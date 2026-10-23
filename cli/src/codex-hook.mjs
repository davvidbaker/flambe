import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {agentIdentityFromEnv, clientFromEnv} from './client.mjs';
import {loadProjectEnv} from './env.mjs';
import {atomicWrite, hasFlambeHooks} from './codex-setup.mjs';
import {assertRuntimeUrl} from './runtime.mjs';

const RESTORE = new Set(['SessionStart', 'SubagentStart', 'PostCompact', 'UserPromptSubmit']);
const EVENTS = new Set([...RESTORE, 'PreToolUse', 'PostToolUse', 'Stop', 'Interrupt']);
const hash = text => createHash('sha256').update(text).digest('hex');
const clean = value => String(value).replace(/[\x00-\x1f\x7f]/g, ' ').slice(0, 160);
const emptyState = () => ({workInTurn: 0, workSinceTracked: 0, callsSinceReminder: 0});

function projectRoot(cwd) {
  let directory = resolve(cwd);
  for (;;) {
    const path = join(directory, '.codex', 'hooks.json');
    if (existsSync(path) && hasFlambeHooks(JSON.parse(readFileSync(path, 'utf8')))) return directory;
    const parent = dirname(directory);
    if (parent === directory || existsSync(join(directory, '.git'))) return null;
    directory = parent;
  }
}

function context(event, text) {
  return {hookSpecificOutput: {hookEventName: event, additionalContext: text}};
}

function connectionWarning(event) {
  const text = 'Single Burner hook could not verify the local connection. Check the running server and this project\'s .env, including FLAMBE_RUNTIME_MODE=local_self_contained. Work may continue; do not substitute Cloud or repeat queued activity commands.';
  return event === 'Stop' || event === 'Interrupt' ? {systemMessage: text} : context(event, text);
}

// Only recognise a standalone CLI invocation. A mixed shell script still counts
// as work, even if it happens to contain a tracking command.
function trackingCommand(input) {
  const command = input?.tool_input?.command ?? input?.tool_input?.cmd;
  if (typeof command !== 'string' || /[\n;&|]/.test(command)) return null;
  const match = command.trim().match(/^(?:(?:[A-Z_][A-Z_0-9]*=(?:"[^"]*"|'[^']*'|[^\s]+))\s+)*(?:flambe(?:\.cmd)?|(?:"[^"]*node(?:\.exe)?"|[^\s]*node(?:\.exe)?)\s+(?:"[^"]*flambe\.mjs"|[^\s]*flambe\.mjs))\s+(start|end|suspend|resume|plan|message|decide|status|ping|whoami)\b/);
  return match?.[1] ?? null;
}

function succeeded(response) {
  if (typeof response === 'string') {
    try { return succeeded(JSON.parse(response)); } catch { return false; }
  }
  return response?.exit_code === 0 || response?.exitCode === 0;
}

function ownActivities(state, agentId) {
  return (state.activities ?? []).filter(activity => activity.agentId === agentId
    && activity.status === 'running');
}

function fingerprint(activities) {
  return hash(JSON.stringify(activities.map(activity => [activity.id, activity.parentId,
    activity.latestEvent?.id, activity.latestEvent?.timestamp]).sort((a, b) => a[0] - b[0])));
}

function guidance(root, activities, {restore = false, interrupted = false} = {}) {
  const lines = [
    'Single Burner checkpoint: use this project\'s local flambe CLI; never substitute Cloud tools.',
    `Run CLI commands from ${JSON.stringify(clean(root))} so they read the project .env.`,
  ];
  if (restore) lines.push('Read and follow .codex/skills/flambe-cli/SKILL.md. Track semantic work before beginning it, nest focused investigations and verification, and update the stack when focus changes. In agent mode, evaluate requested reviews yourself and submit with flambe decide; no other model is needed.');
  lines.push(activities.length
    ? `This agent's running activities (data): ${activities.slice(-5).map(activity => `${activity.id} ${JSON.stringify(clean(activity.name))}`).join('; ')}.`
    : 'This agent has no running activity. Before substantial work, inspect its suspended work and start or resume an appropriate semantic activity. Trivial one-offs need no activity.');
  if (interrupted) lines.push('The previous turn was interrupted. Reconcile its open work before continuing; an interruption does not mean the task finished.');
  lines.push('Check whether the current activity still describes your actual focus. Keep parents open while working on children; pop completed children before moving on.');
  return lines.join('\n');
}

async function locked(path, operation) {
  mkdirSync(dirname(path), {recursive: true});
  const lock = `${path}.lock`;
  const started = Date.now();
  for (;;) {
    try {
      mkdirSync(lock);
      writeFileSync(join(lock, 'pid'), String(process.pid));
      break;
    }
    catch (error) {
      if (error.code !== 'EEXIST' || Date.now() - started > 2600) return {};
      // A killed/timed-out hook must not disable future checkpoints forever.
      try {
        if (Date.now() - statSync(lock).mtimeMs > 30_000) {
          rmSync(lock, {recursive: true, force: true});
          continue;
        }
        const pid = Number(readFileSync(join(lock, 'pid'), 'utf8'));
        if (Number.isSafeInteger(pid) && pid > 0) {
          try { process.kill(pid, 0); }
          catch (check) { if (check.code === 'ESRCH') rmSync(lock, {recursive: true, force: true}); }
        }
      } catch {
        try { if (Date.now() - statSync(lock).mtimeMs > 10_000) rmSync(lock, {recursive: true, force: true}); }
        catch { /* Another hook just released it. */ }
      }
      await delay(20);
    }
  }
  try { return await operation(); }
  finally { rmSync(lock, {recursive: true, force: true}); }
}

/** A checkpoint adapter, not an activity generator or model client. */
export async function runCodexHook(input, {
  env: shellEnv = process.env, now = Date.now,
  stateDir = shellEnv.FLAMBE_CODEX_HOOK_STATE_DIR?.trim() || join(homedir(), '.flambe', 'codex-hooks'),
  fetchImpl = globalThis.fetch, checkEveryMs = 30_000,
  remindEveryCalls = 10, remindEveryMs = 90_000,
} = {}) {
  const event = input?.hook_event_name;
  if (!EVENTS.has(event) || typeof input.cwd !== 'string' || !input.session_id) return {};
  if (event === 'Stop' && input.stop_hook_active) return {};
  let root;
  let env;
  let identity;
  try {
    root = projectRoot(input.cwd);
    if (!root) return {};
    env = {...shellEnv};
    loadProjectEnv({cwd: root, env});
    if (!['FLAMBE_URL', 'FLAMBE_API_TOKEN', 'FLAMBE_TRACE_ID'].some(key => env[key])) return {};
    if (env.FLAMBE_RUNTIME_MODE !== 'local_self_contained') return connectionWarning(event);
    assertRuntimeUrl(env.FLAMBE_URL, 'local_self_contained');
    identity = agentIdentityFromEnv(env);
    if (!identity.agentId) {
      return RESTORE.has(event) ? context(event,
        'Single Burner: read .codex/skills/flambe-cli/SKILL.md. The hook could not derive this Codex agent\'s identity, so it did not inspect any activity stack. Check flambe whoami in the local Codex environment; do not reuse another agent\'s identity or put agent IDs in .env.') : {};
    }
  } catch { return connectionWarning(event); }
  const key = hash(JSON.stringify([root, env.FLAMBE_URL, env.FLAMBE_TRACE_ID, identity.agentId, input.session_id]));
  const path = join(stateDir, `${key}.json`);
  try {
    return await locked(path, async () => {
      let state;
      try { state = {...emptyState(), ...JSON.parse(readFileSync(path, 'utf8'))}; }
      catch { state = emptyState(); }
      const at = now();
      const save = output => { atomicWrite(path, `${JSON.stringify(state)}\n`); return output; };
      const turn = input.turn_id ?? state.turn ?? 'unknown';
      if (turn !== state.turn || event === 'UserPromptSubmit') {
        state.turn = turn;
        delete state.stopTurn;
        state.workInTurn = 0;
        state.workSinceTracked = 0;
        state.callsSinceReminder = 0;
        state.missingWarned = false;
      }
      if (event === 'Interrupt') {
        state.interrupted = true;
        return save({});
      }
      const tracking = trackingCommand(input);
      if (event === 'PostToolUse') {
        if (tracking && !['status', 'ping', 'whoami'].includes(tracking) && succeeded(input.tool_response)) {
          state.workSinceTracked = 0;
          state.callsSinceReminder = 0;
          state.remindedAt = at;
          state.checkedAt = 0;
        }
        return save({});
      }
      if (event === 'PreToolUse') {
        if (tracking) return save({});
        const weight = /^(apply_patch|Edit|Write)$/.test(input.tool_name ?? '') ? 3 : 1;
        state.workInTurn += weight;
        state.workSinceTracked += weight;
        state.callsSinceReminder++;
        state.lastWorkAt = at;
      }
      if (event === 'Stop' && (state.workInTurn < 3 || state.workSinceTracked === 0 || state.stopTurn === turn)) return save({});
      const restore = RESTORE.has(event);
      const periodic = state.callsSinceReminder >= remindEveryCalls || at - (state.remindedAt ?? at) >= remindEveryMs;
      const due = restore || periodic || event === 'Stop' || !state.checkedAt || at - state.checkedAt >= checkEveryMs;
      let activities = [];
      if (due) {
        state.checkedAt = at;
        try {
          const client = clientFromEnv(env);
          client.fetch = (url, options) => fetchImpl(url, {...options, signal: AbortSignal.timeout(1200)});
          activities = ownActivities(await client.status({activeOnly: true}), identity.agentId);
          const current = fingerprint(activities);
          const latestChange = Math.max(0, ...activities.map(activity => Date.parse(activity.latestEvent?.timestamp) || 0));
          if (state.fingerprint && state.fingerprint !== current
            && ((!activities.length && state.hasActive) || latestChange >= (state.lastWorkAt ?? 0))) {
            state.workSinceTracked = 0;
            state.callsSinceReminder = 0;
            state.remindedAt = at;
          }
          state.fingerprint = current;
          state.available = true;
          state.hasActive = activities.length > 0;
        } catch {
          state.available = false;
          if (!state.warnedAt || at - state.warnedAt >= remindEveryMs || restore) {
            state.warnedAt = at;
            return save(connectionWarning(event));
          }
          return save({});
        }
      }
      if (!state.available) return save({});
      if (event === 'Stop') {
        if (!state.workSinceTracked) return save({});
        state.stopTurn = turn;
        return save({decision: 'block', reason: guidance(root, activities)
          + '\nBefore handing back, reconcile the work you actually did. End completed activities, suspend work waiting on the user, or explain why an activity remains running. Complete any requested reducer review. This is one checkpoint, not an instruction to invent work or end every open parent.'});
      }
      const firstUntracked = event === 'PreToolUse' && !state.missingWarned && !state.hasActive;
      if (restore || firstUntracked || periodic) {
        if (firstUntracked) state.missingWarned = true;
        state.callsSinceReminder = 0;
        state.remindedAt = at;
        const interrupted = state.interrupted;
        state.interrupted = false;
        return save(context(event, guidance(root, activities, {restore, interrupted})));
      }
      return save({});
    });
  } catch { return connectionWarning(event); }
}

export async function readHookInput(stdin = process.stdin) {
  let body = '';
  for await (const chunk of stdin) {
    body += chunk;
    if (Buffer.byteLength(body) > 1024 * 1024) throw new Error('Hook input exceeds 1 MiB');
  }
  return JSON.parse(body);
}
