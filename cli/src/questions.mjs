import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

// A question the reducer asked and the worker has not answered yet (ADR-014).
// One open question per trace. The CLI reminds; it never refuses the next command.

export function defaultQuestionsPath() {
  return join(homedir(), '.flambe', 'open-questions.json');
}

export function readOpenQuestion(traceId, path = defaultQuestionsPath()) {
  if (!traceId) return undefined;
  const stored = readAll(path)[String(traceId)];
  if (!stored || typeof stored.reply !== 'string' || !stored.reply.trim()) return undefined;
  return { activityId: stored.activityId, reply: stored.reply };
}

export function rememberQuestion(traceId, { activityId, reply }, path = defaultQuestionsPath()) {
  if (!traceId || !reply) return;
  const all = { ...readAll(path), [String(traceId)]: { activityId, reply } };
  writeAll(path, all);
}

export function clearQuestion(traceId, path = defaultQuestionsPath()) {
  if (!traceId) return;
  const all = readAll(path);
  if (!(String(traceId) in all)) return;
  delete all[String(traceId)];
  writeAll(path, all);
}

function readAll(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(path, questions) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(questions, null, 2)}\n`);
  renameSync(tmp, path);
}
