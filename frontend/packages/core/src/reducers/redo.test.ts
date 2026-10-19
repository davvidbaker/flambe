import { afterEach, describe, expect, it, vi } from 'vitest';
import undo, { redo, UNDO_POP, REDO_POP, type UndoState } from './undo';
import { UNDO_RECORD } from '../actions';
import { loadUndoHistory, loadRedoHistory, saveUndoHistory } from '../utilities/undoStorage';

afterEach(() => vi.unstubAllGlobals());
describe('reciprocal persistent history', () => {
  const move = { kind: 'move' as const, token: 'undo', trace_id: 1 };
  const reverse = { kind: 'move' as const, token: 'redo', trace_id: 1 };
  const scope = '4:1';
  it('moves complete operations between stacks, survives refresh, and clears redo on a new mutation', () => {
    let u: UndoState = {}, r: UndoState = {};
    const apply = (action: Parameters<typeof undo>[1]) => { u = undo(u, action); r = redo(r, action); };
    apply({ type: UNDO_RECORD, scope, target: move });
    apply({ type: UNDO_POP, scope, target: move, inverse: reverse });
    expect(u[scope]).toEqual([]);
    expect(r[scope]).toEqual([reverse]);
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key),
      setItem: (key: string, value: string) => storage.set(key, value) });
    saveUndoHistory(u, r);
    u = loadUndoHistory(); r = loadRedoHistory();
    apply({ type: REDO_POP, scope, target: r[scope][0], inverse: move });
    expect(u[scope]).toEqual([move]); expect(r[scope]).toEqual([]);
    apply({ type: UNDO_POP, scope, target: u[scope][0], inverse: reverse });
    apply({ type: UNDO_RECORD, scope: '8:1', target: move });
    expect(r[scope]).toEqual([reverse]);
    apply({ type: UNDO_RECORD, scope, target: { kind: 'unsupported', label: 'Edit' } });
    expect(r[scope]).toEqual([]);
  });
  it('migrates v1 undo history without inventing redo entries', () => {
    vi.stubGlobal('localStorage', { getItem: (key: string) => key.endsWith('.v1') ? JSON.stringify({ [scope]: [move] }) : null });
    expect(loadUndoHistory()[scope]).toEqual([move]);
    expect(loadRedoHistory()).toEqual({});
  });
});
