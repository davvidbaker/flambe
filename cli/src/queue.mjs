import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export function defaultQueuePath() {
  return join(homedir(), '.flambe', 'event-queue.json');
}

// How many times a server-*rejected* entry is retried before it is dropped. Only
// HTTP-status failures count toward this; a server that is simply unreachable
// never does, so a long offline stretch cannot age out a legitimate event.
export const MAX_FLUSH_ATTEMPTS = 5;

function describeEntry(entry) {
  if (entry.type === 'observe') {
    return `${entry.type} (${entry.input?.kind ?? '?'})`;
  }
  return `${entry.type} (activity ${entry.activityId ?? entry.localId ?? '?'})`;
}

function warnToStderr(message) {
  process.stderr.write(`${message}\n`);
}

function emptyState() {
  return { version: 1, entries: [], aliases: {} };
}

export class FlambeQueue {
  constructor({ baseUrl, traceId, path = defaultQueuePath() }) {
    this.baseUrl = baseUrl;
    this.traceId = Number(traceId);
    this.path = path;
  }

  matches(entry) {
    return entry.baseUrl === this.baseUrl && entry.traceId === this.traceId;
  }

  async read() {
    try {
      const state = JSON.parse(await readFile(this.path, 'utf8'));
      if (state?.version !== 1 || !Array.isArray(state.entries) || typeof state.aliases !== 'object') {
        throw new Error(`Invalid Flambe offline queue: ${this.path}`);
      }
      return state;
    } catch (error) {
      if (error?.code === 'ENOENT') return emptyState();
      throw error;
    }
  }

  async write(state) {
    if (state.entries.length === 0 && Object.keys(state.aliases).length === 0) {
      await rm(this.path, { force: true });
      return;
    }

    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
    const temporaryPath = `${this.path}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(state)}\n`, { mode: 0o600 });
    await rename(temporaryPath, this.path);
  }

  async enqueue(type, payload) {
    const state = await this.read();
    const localId = type === 'start' ? `offline-${randomUUID()}` : undefined;
    state.entries.push({
      type,
      baseUrl: this.baseUrl,
      traceId: this.traceId,
      ...(localId ? { localId } : {}),
      ...payload,
    });
    await this.write(state);
    return localId;
  }

  async resolveActivityId(activityId) {
    const state = await this.read();
    return state.aliases[activityId] ?? activityId;
  }

  async removeAlias(activityId) {
    if (!String(activityId).startsWith('offline-')) return;
    const state = await this.read();
    if (!(activityId in state.aliases)) return;
    delete state.aliases[activityId];
    await this.write(state);
  }

  async flush({ start, end, suspend, resume, observe }, { warn = warnToStderr } = {}) {
    const state = await this.read();

    for (let index = 0; index < state.entries.length;) {
      const entry = state.entries[index];
      if (!this.matches(entry)) {
        index += 1;
        continue;
      }

      try {
        if (entry.type === 'start') {
          const activityId = await start(entry.input);
          state.aliases[entry.localId] = activityId;
        } else if (entry.type === 'end' || entry.type === 'suspend' || entry.type === 'resume') {
          const activityId = state.aliases[entry.activityId] ?? entry.activityId;
          const post = { end, suspend, resume }[entry.type];
          await post({
            activityId,
            message: entry.message,
            timestamp: entry.timestamp,
            force: entry.force ?? false,
            phase: entry.phase,
          });
          if (entry.type === 'end') delete state.aliases[entry.activityId];
        } else if (entry.type === 'observe') {
          await observe(entry.input);
        } else {
          // An entry type this build does not understand can never succeed, so
          // dropping it is the only way to stop it wedging everything behind it.
          warn(`Flambe: dropping unrecognized offline queue entry type "${entry.type}".`);
          state.entries.splice(index, 1);
          continue;
        }
      } catch (error) {
        // Flushing is best-effort and must never abort the command that triggered
        // it. The three cases below differ only in whether the entry is worth
        // keeping -- but none of them is ever silent, which is the bug this fixes.
        const label = describeEntry(entry);
        const serverResponded = typeof error?.status === 'number';

        if (error?.retryable && !serverResponded) {
          // Can't reach the server at all -- not this entry's fault. Keep the
          // whole queue in order and try again when connectivity returns.
          const pending = state.entries.length - index;
          warn(`Flambe: offline queue not flushed, server unreachable `
            + `(${pending} pending, first is ${label}): ${error.message}`);
          break;
        }

        const attempts = (entry.attempts ?? 0) + 1;
        if (error?.retryable && attempts < MAX_FLUSH_ATTEMPTS) {
          // Server reachable but erroring on this entry. Could be a transient
          // 5xx, so keep it and preserve order -- but say so, and bound it.
          entry.attempts = attempts;
          warn(`Flambe: offline queue stalled on ${label} `
            + `(server error, attempt ${attempts}/${MAX_FLUSH_ATTEMPTS}): ${error.message}`);
          break;
        }

        // A client-side rejection (4xx), or a server error that has recurred too
        // many times to be transient (e.g. a permanently-malformed entry): drop
        // it, loudly and with its payload, so one bad row cannot block the rest.
        warn(`Flambe: dropping offline queue entry ${label} after ${attempts} `
          + `attempt(s): ${error.message}\n  payload: ${JSON.stringify(entry)}`);
        state.entries.splice(index, 1);
        continue;
      }

      state.entries.splice(index, 1);
    }

    await this.write(state);
  }
}
