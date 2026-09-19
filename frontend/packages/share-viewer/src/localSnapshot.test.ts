import { describe, expect, it } from 'vitest';
import type { TimelineSnapshot } from '../../core/src/chart';
import {
  clearLocalSnapshot,
  LOCAL_SNAPSHOT_STORAGE_KEY,
  readLocalSnapshot,
  snapshotFromFileText,
  writeLocalSnapshot,
} from './localSnapshot';

const snapshot: TimelineSnapshot = {
  version: 1,
  exportedAt: 1_700_000_000_000,
  viewport: { leftBoundaryTime: 0, rightBoundaryTime: 1_000 },
  fixture: {
    events: [],
    threads: [],
    categories: [],
    attentionShifts: [],
    traceId: 1,
    traceName: 'Dropped trace',
  },
};

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe('snapshotFromFileText', () => {
  it('accepts a timeline snapshot', () => {
    expect(snapshotFromFileText(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it('rejects invalid JSON', () => {
    expect(() => snapshotFromFileText('{')).toThrow('That file is not valid JSON.');
  });

  it('rejects JSON that is not a snapshot', () => {
    expect(() => snapshotFromFileText('{"hello":"world"}')).toThrow(
      'That file is not a Flambe timeline snapshot.',
    );
  });
});

describe('local snapshot storage', () => {
  it('round-trips a snapshot', () => {
    const storage = memoryStorage();
    writeLocalSnapshot(snapshot, storage);
    expect(readLocalSnapshot(storage)).toEqual(snapshot);
  });

  it('returns null for missing or corrupt storage', () => {
    expect(readLocalSnapshot(memoryStorage())).toBeNull();
    expect(readLocalSnapshot(memoryStorage({ [LOCAL_SNAPSHOT_STORAGE_KEY]: '{' }))).toBeNull();
  });

  it('clears a stored snapshot', () => {
    const storage = memoryStorage();
    writeLocalSnapshot(snapshot, storage);
    clearLocalSnapshot(storage);
    expect(readLocalSnapshot(storage)).toBeNull();
  });

  it('warns when storage refuses the write', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    };
    expect(() => writeLocalSnapshot(snapshot, storage)).toThrow(
      'Loaded the file, but it was too large to keep after a refresh.',
    );
  });
});
