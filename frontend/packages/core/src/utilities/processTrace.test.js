// @flow

import processTrace from './processTrace';

const thread = { id: 1, name: 'Main' };

const activity = {
  id: 9,
  name: 'Ship the timeline',
  description: 'A trace-processing fixture',
  weight: 1,
  categories: [4],
  thread,
};

describe('processTrace', () => {
  it('orders events and builds a completed activity block', () => {
    const trace = [
      {
        id: 2,
        timestamp: 200,
        phase: 'E',
        message: 'Finished',
        activity,
      },
      {
        id: 1,
        timestamp: 100,
        phase: 'B',
        message: 'Started',
        activity,
      },
    ];

    const result = processTrace(trace, [thread]);

    expect(result.min).toBe(100);
    expect(result.max).toBe(200);
    expect(result.lastCategory_id).toBe(4);
    expect(result.activities[activity.id]).toMatchObject({
      status: 'complete',
      flavor: 'task',
      startTime: 100,
      endTime: 200,
      events: [1, 2],
    });
    expect(result.blocks).toEqual([
      {
        activity_id: activity.id,
        beginning: 'B',
        endMessage: 'Finished',
        ending: 'E',
        events: [1, 2],
        level: 0,
        startMessage: 'Started',
        startTime: 100,
        endTime: 200,
      },
    ]);
    expect(result.threadLevels[thread.id]).toEqual({ current: 0, max: 1 });
  });

  it('returns an empty timeline safely when a trace has no events', () => {
    const result = processTrace([], [thread]);

    expect(result.activities).toEqual({});
    expect(result.threadLevels[thread.id]).toEqual({ current: 0, max: 0 });
    expect(result.max).toBeGreaterThan(result.min);
  });
});
