import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export function defaultQueuePath() {
  return join(homedir(), '.flambe', 'event-queue.json');
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

  async flush({ start, end }) {
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
        } else if (entry.type === 'end') {
          const activityId = state.aliases[entry.activityId] ?? entry.activityId;
          await end({ activityId, message: entry.message, timestamp: entry.timestamp });
          delete state.aliases[entry.activityId];
        } else {
          throw new Error(`Invalid Flambe offline queue entry type: ${entry.type}`);
        }
      } catch (error) {
        if (error?.retryable) break;
        throw error;
      }

      state.entries.splice(index, 1);
    }

    await this.write(state);
  }
}
