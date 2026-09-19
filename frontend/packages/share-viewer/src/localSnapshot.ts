import { isTimelineSnapshot, type TimelineSnapshot } from '../../core/src/chart';

export const LOCAL_SNAPSHOT_STORAGE_KEY = 'flambe-share.localSnapshot.v1';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function snapshotFromFileText(text: string): TimelineSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!isTimelineSnapshot(parsed)) {
    throw new Error('That file is not a Flambe timeline snapshot.');
  }
  return parsed;
}

export function readLocalSnapshot(storage: StorageLike | null = browserStorage()): TimelineSnapshot | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(LOCAL_SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    return snapshotFromFileText(raw);
  } catch {
    return null;
  }
}

export function writeLocalSnapshot(
  snapshot: TimelineSnapshot,
  storage: StorageLike | null = browserStorage(),
): void {
  writeLocalSnapshotText(JSON.stringify(snapshot), storage);
}

export function writeLocalSnapshotText(
  text: string,
  storage: StorageLike | null = browserStorage(),
): void {
  if (!storage) {
    throw new Error('This browser cannot keep the snapshot after a refresh.');
  }
  try {
    storage.setItem(LOCAL_SNAPSHOT_STORAGE_KEY, text);
  } catch {
    throw new Error('Loaded the file, but it was too large to keep after a refresh.');
  }
}

export function readLocalSnapshotText(storage: StorageLike | null = browserStorage()): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(LOCAL_SNAPSHOT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearLocalSnapshot(storage: StorageLike | null = browserStorage()): void {
  storage?.removeItem(LOCAL_SNAPSHOT_STORAGE_KEY);
}

function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
