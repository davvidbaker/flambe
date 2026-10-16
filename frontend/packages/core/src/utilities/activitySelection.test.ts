import { afterEach, describe, expect, it, vi } from 'vitest';
import { activitiesInRectangle, supportsActivitySelection } from './activitySelection';
import activitySelection, { selectActivities } from '../reducers/activitySelection';
import { BLOCK_FOCUS, TRACE_SELECT } from '../actions';
import { bulkActivityCommands } from '../constants/commands';

afterEach(() => vi.unstubAllGlobals());

describe('desktop activity selection', () => {
  it('selects intersecting segments once without expanding to children', () => {
    const blocks = [
      { activityId: 1, x: 10, y: 20, width: 50, height: 15 },
      { activityId: 1, x: 80, y: 20, width: 30, height: 15 },
      { activityId: 2, x: 20, y: 40, width: 20, height: 15 },
      { activityId: 3, x: 50, y: 40, width: 0, height: 15 },
    ];
    expect(activitiesInRectangle({ x: 0, y: 15, width: 100, height: 20 }, blocks)).toEqual(['1']);
    expect(activitiesInRectangle({ x: 25, y: 25, width: 100, height: 25 }, blocks)).toEqual(['1', '2']);
    expect(activitiesInRectangle({ x: 60, y: 0, width: 10, height: 35 }, blocks)).toEqual([]);
  });

  it.each([
    [1280, '', true], [390, '', false], [1280, '(pointer: coarse)', false],
    [1280, '(hover: none)', false],
  ])('gates selection for width %s and media %s', (innerWidth, media, expected) => {
    vi.stubGlobal('window', { innerWidth, matchMedia: (query: string) => ({ matches: query === media }) });
    expect(supportsActivitySelection()).toBe(expected);
  });

  it('clears selection on ordinary focus and trace switches', () => {
    const selected = activitySelection([], selectActivities([1, '1', 2]));
    expect(selected).toEqual(['1', '2']);
    expect(activitySelection(selected, { type: BLOCK_FOCUS })).toEqual([]);
    expect(activitySelection(selected, { type: TRACE_SELECT })).toEqual([]);
  });

  it('offers bulk commands only for multiple selected activities and snapshots their IDs', () => {
    expect(bulkActivityCommands(['1'])).toEqual([]);
    const commands = bulkActivityCommands(['1', '2']);
    expect(commands.map(command => command.copy)).toEqual([
      'move 2 activities to thread...', 'delete 2 activities...',
    ]);
    expect(commands[0].activity_ids).toEqual(['1', '2']);
    expect(commands[0].parameters?.[0].key).toBe('thread_id');
  });
});
