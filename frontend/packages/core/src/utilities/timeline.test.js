import {
  blocksForActivityWithIndices,
  getFilteredThreads,
  loadSuspendedActivityCount,
} from './timeline';

describe('timeline helpers', () => {
  it('filters thread records and counts suspended activities', () => {
    const threads = { 1: { id: 1 }, 2: { id: 2 } };
    const activities = {
      4: { id: 4, categories: [], status: 'suspended', thread_id: 2 },
      5: { id: 5, categories: [], status: 'active', thread_id: 2 },
    };

    expect(getFilteredThreads([1], threads)).toEqual({ 2: { id: 2 } });
    expect(loadSuspendedActivityCount(activities, threads)).toEqual({
      1: { id: 1, suspendedActivityCount: 0 },
      2: { id: 2, suspendedActivityCount: 1 },
    });
  });

  it('returns matching blocks with their original indexes', () => {
    const blocks = [
      { activity_id: 2, beginning: 'B', events: [1], level: 0, startTime: 100 },
      { activity_id: 3, beginning: 'B', events: [2], level: 0, startTime: 200 },
      { activity_id: 2, beginning: 'R', events: [3], level: 0, startTime: 300 },
    ];

    expect(blocksForActivityWithIndices(2, blocks)).toEqual([
      [0, blocks[0]],
      [2, blocks[2]],
    ]);
  });
});
