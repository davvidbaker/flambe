import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

// Names the reducer assigned to agents on this machine, keyed by agent id (ADR-012).
// Read synchronously because identity is resolved while the client is constructed.

export function defaultAgentNamesPath() {
  return join(homedir(), '.flambe', 'agent-names.json');
}

export function readAgentNames(path = defaultAgentNamesPath()) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function rememberedAgentName(agentId, path = defaultAgentNamesPath()) {
  if (!agentId) return undefined;
  const name = readAgentNames(path)[agentId];
  return typeof name === 'string' && name.trim() ? name : undefined;
}

export function rememberAgentName(agentId, name, path = defaultAgentNamesPath()) {
  if (!agentId || !name) return;
  const names = { ...readAgentNames(path), [agentId]: name };
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(names, null, 2)}\n`);
  renameSync(tmp, path);
}
