import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { StringDecoder } from 'node:string_decoder';
import { CommandError } from './commands.mjs';

export const codexVersion = '0.166.0';
const error = (code, message, status = 502) => new CommandError(status, code, message);
const require = createRequire(import.meta.url);

/** Resolve the pinned native binary directly: no shell, PATH lookup, or wrapper grandchildren. */
export function resolveCodexRuntime() {
  try {
    const triples = { linux: { x64: 'x86_64-unknown-linux-musl', arm64: 'aarch64-unknown-linux-musl' },
      darwin: { x64: 'x86_64-apple-darwin', arm64: 'aarch64-apple-darwin' },
      win32: { x64: 'x86_64-pc-windows-msvc', arm64: 'aarch64-pc-windows-msvc' } };
    const triple = triples[process.platform]?.[process.arch];
    if (!triple) throw new Error('unsupported platform');
    const manifestPath = require.resolve('@openai/codex/package.json');
    if (JSON.parse(readFileSync(manifestPath, 'utf8')).version !== codexVersion) throw new Error('version mismatch');
    const fromCodex = createRequire(manifestPath);
    const packageName = `@openai/codex-${process.platform}-${process.arch}`;
    const platformManifest = fromCodex.resolve(`${packageName}/package.json`);
    if (JSON.parse(readFileSync(platformManifest, 'utf8')).version !== `${codexVersion}-${process.platform}-${process.arch}`) throw new Error('native version mismatch');
    const root = dirname(platformManifest);
    const file = join(root, 'vendor', triple, 'bin', process.platform === 'win32' ? 'codex.exe' : 'codex');
    if (!existsSync(file)) throw new Error('binary missing');
    return { file, args: [] };
  } catch {
    throw error('REDUCER_CODEX_UNAVAILABLE',
      `Codex ${codexVersion} runtime is unavailable. Reinstall @davvidbaker/flambe-cli with optional dependencies enabled.`, 503);
  }
}

/** Preserve OS necessities, never worker identity, Flambe/provider credentials, or Codex overrides. */
export function codexEnvironment(home, source = process.env) {
  const env = {};
  for (const key of ['PATH', 'HOME', 'USERPROFILE', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP', 'TMPDIR']) {
    if (typeof source[key] === 'string') env[key] = source[key];
  }
  return { ...env, CODEX_HOME: home, NO_COLOR: '1', TERM: 'dumb' };
}

export function assertIsolatedHome(home, source = process.env) {
  const canonical = path => existsSync(path) ? realpathSync(path) : resolve(path);
  const userHome = source.HOME ?? source.USERPROFILE;
  const forbidden = [source.CODEX_HOME, userHome && join(userHome, '.codex'), userHome].filter(Boolean);
  if (forbidden.some(path => canonical(path) === canonical(home))) {
    throw error('REDUCER_CONFIG_INVALID', 'FLAMBE_LOCAL_CODEX_HOME must be a dedicated reducer profile, not the worker Codex home or user home.', 503);
  }
  // Codex loads these even with --ignore-user-config and project_doc_max_bytes=0.
  // Refuse rather than silently importing instructions or deleting user files.
  if (['AGENTS.md', 'AGENTS.override.md'].some(name => existsSync(join(home, name)))) {
    throw error('REDUCER_CONFIG_INVALID', 'The dedicated reducer Codex profile must not contain AGENTS.md or AGENTS.override.md instructions.', 503);
  }
}

/** Codex model metadata can enable native tools even when feature flags are off.
 * Use its custom-catalog interface to keep the selected model id but declare no
 * agent capabilities. No invented context-window size or automatic compaction.
 * The selected backend must support Responses structured output and low effort.
 */
export function toolFreeCatalog(model) {
  return { models: [{ slug: model, display_name: model, description: null,
    default_reasoning_level: 'low', supported_reasoning_levels: [{ effort: 'low', description: 'Reducer review' }],
    shell_type: 'disabled', visibility: 'hide', supported_in_api: true, priority: 0,
    support_verbosity: false, default_verbosity: null, apply_patch_tool_type: null,
    truncation_policy: { mode: 'bytes', limit: 131072 }, experimental_supported_tools: [],
    input_modalities: ['text'], tool_mode: 'direct', supports_reasoning_summary_parameter: false,
    include_apps_usage_instructions: false,
    model_messages: { instructions_template: 'Use the supplied reducer policy and JSON schema. No tools.', persistent_instructions: '' },
  }] };
}

/** Exported for deterministic argument/isolation tests; no user-supplied extra CLI flags. */
export function codexArguments({ model, schemaPath, policyPath, catalogPath }) {
  const config = {
    model_provider: 'openai', approval_policy: 'never', web_search: 'disabled', model_reasoning_effort: 'low',
    developer_instructions: 'You are an independent Flambe reviewer, not a worker. Use no tools. Return only the requested JSON decision.',
    model_instructions_file: policyPath, model_catalog_json: catalogPath, project_doc_max_bytes: 0,
    include_environment_context: false, 'skills.include_instructions': false,
    'history.persistence': 'none', suppress_unstable_features_warning: true, 'tools.update_plan.enabled': false,
    'tools.experimental_request_user_input.enabled': false,
    'features.skip_host_skill_discovery': true,
  };
  for (const feature of ['shell_tool', 'unified_exec', 'view_image', 'apply_patch_freeform', 'js_repl',
    'code_mode', 'code_mode_host', 'hooks', 'plugin_hooks', 'plugins', 'apps',
    'multi_agent', 'multi_agent_v2', 'memories', 'skill_search',
    'skill_mcp_dependency_install', 'tool_suggest', 'tool_search', 'search_tool', 'request_permissions_tool', 'browser_use',
    'browser_use_external', 'computer_use', 'image_generation', 'standalone_web_search', 'goals',
    'sleep_tool', 'current_time_reminder', 'deferred_executor']) config[`features.${feature}`] = false;
  return ['exec', '--json', '--ephemeral', '--ignore-user-config', '--ignore-rules', '--strict-config',
    '--skip-git-repo-check', '--sandbox', 'read-only', '--model', model, '--output-schema', schemaPath,
    ...Object.entries(config).flatMap(([key, value]) => ['--config', `${key}=${JSON.stringify(value)}`]), '-'];
}

const safeUsage = usage => Object.fromEntries(['input_tokens', 'cached_input_tokens', 'cache_write_input_tokens',
  'output_tokens', 'reasoning_output_tokens'].filter(key => Number.isSafeInteger(usage?.[key]) && usage[key] >= 0).map(key => [key, usage[key]]));

export function codexLoginHelp(home, platform = process.platform) {
  const quoted = `'${home.replaceAll("'", platform === 'win32' ? "''" : "'\"'\"'")}'`;
  const login = `npx --yes @openai/codex@${codexVersion} login`;
  const command = platform === 'win32'
    ? `$previousCodexHome = $env:CODEX_HOME; try { $env:CODEX_HOME = ${quoted}; ${login} } finally { $env:CODEX_HOME = $previousCodexHome }`
    : `CODEX_HOME=${quoted} ${login}`;
  return `Codex reducer login is separate from your regular Codex login. If missing or expired, run in another terminal${platform === 'win32' ? ' (PowerShell)' : ''}:\n${command}\nIf browser login fails, append --device-auth. Then retry the review; no FSB restart is needed. Do not export CODEX_HOME or add it to FSB's .env.`;
}

export function createCodexProvider(config, { env = process.env, codexRuntime, spawnImpl = spawn, warn = message => console.error(message) } = {}) {
  assertIsolatedHome(config.codexHome, env);
  const runtime = codexRuntime ?? resolveCodexRuntime();
  const loginHelp = codexLoginHelp(config.codexHome);
  let authWarningShown = false;
  return {
    mode: 'codex', model: config.model, loginHelp,
    async review({ system, context, schema, onUsage }) {
      let directory;
      const started = Date.now();
      try {
        assertIsolatedHome(config.codexHome, env);
        mkdirSync(config.codexHome, { recursive: true, mode: 0o700 });
        directory = mkdtempSync(join(tmpdir(), 'flambe-codex-review-'));
        const schemaPath = join(directory, 'decision.schema.json');
        const policyPath = join(directory, 'instructions.txt');
        const catalogPath = join(directory, 'models.json');
        writeFileSync(schemaPath, JSON.stringify(schema), { mode: 0o600 });
        writeFileSync(policyPath, system, { mode: 0o600 });
        writeFileSync(catalogPath, JSON.stringify(toolFreeCatalog(config.model)), { mode: 0o600 });
        const args = [...runtime.args, ...codexArguments({ model: config.model, schemaPath, policyPath, catalogPath })];
        const result = await new Promise((resolveReview, reject) => {
          let child;
          let failure;
          let stderr = '';
          let pending = '';
          let finalResponse;
          let completed = false;
          let usage;
          let received = 0;
          const decoder = new StringDecoder('utf8');
          const stop = problem => {
            failure ??= problem;
            try { child?.kill('SIGKILL'); } catch { /* close/error settles the request */ }
          };
          try { child = spawnImpl(runtime.file, args, { cwd: directory, shell: false,
            windowsHide: true, env: codexEnvironment(config.codexHome, env), stdio: ['pipe', 'pipe', 'pipe'] }); }
          catch { reject(error('REDUCER_CODEX_UNAVAILABLE', 'Codex could not be started. Check the installed runtime.', 503)); return; }
          const timer = setTimeout(() => stop(error('REDUCER_TIMEOUT', 'Codex reducer review timed out.', 504)), config.timeoutMs);
          const record = line => {
            if (!line.trim() || failure) return;
            let event;
            try { event = JSON.parse(line); } catch { stop(error('REDUCER_PROVIDER_ERROR', 'Codex returned an invalid event stream.')); return; }
            if (!event || typeof event !== 'object' || Array.isArray(event) || typeof event.type !== 'string') {
              stop(error('REDUCER_PROVIDER_ERROR', 'Codex returned an invalid event stream.')); return;
            }
            if (['item.started', 'item.updated', 'item.completed'].includes(event.type)) {
              if (event.item?.type === 'error') {
                stderr += ' ' + String(event.item.message ?? '').slice(0, 4096);
                // Codex also emits nonfatal startup/metadata warnings as error items.
              } else if (!['agent_message', 'reasoning'].includes(event.item?.type)) {
                stop(error('REDUCER_CODEX_TOOL_CALL', 'Codex attempted a tool operation; no reducer decision was applied.'));
              } else if (event.type === 'item.completed' && event.item?.type === 'agent_message') finalResponse = event.item.text;
            }
            if (event.type === 'turn.completed') { completed = true; usage = safeUsage(event.usage); }
            if (event.type === 'turn.failed' || event.type === 'error') {
              stderr += ' ' + String(event.error?.message ?? event.message ?? '').slice(0, 4096);
              stop(error('REDUCER_PROVIDER_ERROR', 'Codex reducer review failed. Check the model and dedicated profile login.'));
            }
          };
          child.stdout.on('data', chunk => {
            received += chunk.length;
            if (received > 1_048_576) { stop(error('REDUCER_PROVIDER_ERROR', 'Codex response exceeded the size limit.')); return; }
            pending += decoder.write(chunk);
            let newline;
            while ((newline = pending.indexOf('\n')) !== -1) {
              const line = pending.slice(0, newline); pending = pending.slice(newline + 1); record(line);
            }
          });
          child.stderr.on('data', chunk => {
            received += chunk.length;
            if (received > 1_048_576) stop(error('REDUCER_PROVIDER_ERROR', 'Codex response exceeded the size limit.'));
            if (stderr.length < 16384) stderr += chunk.toString('utf8').slice(0, 16384 - stderr.length);
          });
          child.stdin.on('error', () => {}); // EPIPE is explained by the close status, never raw stderr.
          child.on('error', () => {
            clearTimeout(timer);
            reject(error('REDUCER_CODEX_UNAVAILABLE', 'Codex could not be started. Check the installed runtime.', 503));
          });
          child.on('close', code => {
            clearTimeout(timer);
            pending += decoder.end();
            if (pending.trim()) record(pending);
            if ((failure || code !== 0 || !completed) && /not logged in|unauthorized|authentication|401|login required|refresh_token_(?:expired|reused|invalidated)|(?:session|token|credentials?) (?:has |have )?expired/i.test(stderr)
              && (!failure || failure.body?.error?.code === 'REDUCER_PROVIDER_ERROR')) {
              if (!authWarningShown) {
                authWarningShown = true;
                try { warn(`Codex reducer authentication required (login missing or expired).\n${loginHelp}`); }
                catch { /* Terminal output must not affect recorded work. */ }
              }
              reject(error('REDUCER_CODEX_AUTH_REQUIRED', loginHelp, 503));
            } else if (failure) reject(failure);
            else if (code !== 0 || !completed || typeof finalResponse !== 'string') {
              reject(error('REDUCER_PROVIDER_ERROR', 'Codex did not complete a decision. Check the model and dedicated profile login.'));
            } else {
              try { resolveReview({ decision: JSON.parse(finalResponse), usage }); }
              catch { reject(error('REDUCER_PROVIDER_ERROR', 'Codex returned an invalid JSON decision.')); }
            }
          });
          child.stdin.end(JSON.stringify(context));
        });
        authWarningShown = false;
        onUsage?.({ ...result.usage, duration_ms: Date.now() - started, runtime_version: codexVersion });
        return result.decision;
      } catch (problem) {
        if (problem instanceof CommandError) throw problem;
        throw error('REDUCER_PROVIDER_ERROR', 'Codex reducer review could not be completed.');
      } finally {
        if (directory) rmSync(directory, { recursive: true, force: true });
      }
    },
  };
}
