import {existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';

export const HOOK_COMMAND = 'flambe hook codex';
export const HOOK_COMMAND_WINDOWS = 'flambe.cmd hook codex';
export const HOOK_EVENTS = ['SessionStart', 'SubagentStart', 'UserPromptSubmit', 'PostCompact', 'PreToolUse', 'PostToolUse', 'Stop', 'Interrupt'];

export function managedHook(hook) {
  return hook?.type === 'command' && hook.command === HOOK_COMMAND
    && hook.commandWindows === HOOK_COMMAND_WINDOWS;
}

export function hasFlambeHooks(config) {
  return Object.values(config?.hooks ?? {}).some(groups => Array.isArray(groups)
    && groups.some(group => group.hooks?.some(managedHook)));
}

function readConfig(path) {
  if (!existsSync(path)) return {hooks: {}};
  let config;
  try { config = JSON.parse(readFileSync(path, 'utf8')); }
  catch { throw new Error('Cannot read .codex/hooks.json as JSON; existing hooks were not changed.'); }
  if (!config || typeof config !== 'object' || Array.isArray(config)
    || (config.hooks !== undefined && (!config.hooks || typeof config.hooks !== 'object' || Array.isArray(config.hooks)))
    || Object.values(config.hooks ?? {}).some(groups => !Array.isArray(groups)
      || groups.some(group => !group || !Array.isArray(group.hooks)))) {
    throw new Error('Unsupported .codex/hooks.json structure; existing hooks were not changed.');
  }
  return config;
}

export function atomicWrite(path, text) {
  mkdirSync(dirname(path), {recursive: true});
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, text, {mode: 0o600, flag: 'wx'});
    renameSync(temporary, path);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

export function bundledSkill() {
  const bundled = fileURLToPath(new URL('../skills/flambe-cli/SKILL.md', import.meta.url));
  const source = fileURLToPath(new URL('../../.codex/skills/flambe-cli/SKILL.md', import.meta.url));
  return readFileSync(existsSync(bundled) ? bundled : source, 'utf8');
}

function withoutManagedHooks(config) {
  const result = {...config, hooks: {...config.hooks}};
  for (const [event, groups] of Object.entries(result.hooks)) {
    result.hooks[event] = groups.flatMap(group => {
      if (!group.hooks.some(managedHook)) return [group];
      const hooks = group.hooks.filter(hook => !managedHook(hook));
      return hooks.length ? [{...group, hooks}] : [];
    });
    if (!result.hooks[event].length) delete result.hooks[event];
  }
  return result;
}

export function setupCodex({cwd = process.cwd(), action = 'install', skill = bundledSkill()} = {}) {
  const root = resolve(cwd);
  const path = join(root, '.codex', 'hooks.json');
  const skillPath = join(root, '.codex', 'skills', 'flambe-cli', 'SKILL.md');
  const existing = readConfig(path);
  const installedEvents = HOOK_EVENTS.filter(event => existing.hooks?.[event]?.some(group =>
    group.hooks.some(managedHook)));
  const skillExists = existsSync(skillPath);
  if (action === 'check') return {
    root, hooksPath: path, installed: installedEvents.length === HOOK_EVENTS.length,
    installedEvents, skillExists,
    skillMatches: skillExists && readFileSync(skillPath, 'utf8') === skill,
  };
  const config = withoutManagedHooks(existing);
  if (action === 'remove') {
    if (installedEvents.length) atomicWrite(path, `${JSON.stringify(config, null, 2)}\n`);
    return {root, hooksPath: path, removed: installedEvents.length > 0, skillRetained: skillExists};
  }
  if (action !== 'install') throw new Error('Unknown Codex setup action');
  for (const event of HOOK_EVENTS) {
    config.hooks[event] ??= [];
    config.hooks[event].push({hooks: [{
      type: 'command', command: HOOK_COMMAND, commandWindows: HOOK_COMMAND_WINDOWS,
      timeout: event === 'Interrupt' ? 3 : 5,
      statusMessage: 'Single Burner tracking checkpoint', additionalContextLimit: 1800,
    }]});
  }
  // Preserve custom/existing instructions. Never silently replace a skill.
  if (!skillExists) atomicWrite(skillPath, skill);
  const serialized = `${JSON.stringify(config, null, 2)}\n`;
  const unchanged = existsSync(path) && readFileSync(path, 'utf8') === serialized;
  if (!unchanged) {
    if (existsSync(path)) {
      const backup = `${path}.before-flambe`;
      if (!existsSync(backup)) writeFileSync(backup, readFileSync(path), {flag: 'wx', mode: 0o600});
    }
    atomicWrite(path, serialized);
  }
  return {root, hooksPath: path, unchanged, skillInstalled: !skillExists,
    skillMatches: !skillExists || readFileSync(skillPath, 'utf8') === skill};
}
