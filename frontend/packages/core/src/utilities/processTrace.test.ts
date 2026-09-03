import processTrace from './processTrace';
import type { Activity } from '../types/Activity';
import type { Thread } from '../types/Thread';
import type { TraceEvent } from '../types/TraceEvent';

const thread: Thread = { id: 1, name: 'Main' };

const activity: Activity = {
  id: 9,
  name: 'Ship the timeline',
  description: 'A trace-processing fixture',
  weight: 1,
  categories: [4],
  thread,
};

describe('processTrace', () => {
  it('orders events and builds a completed activity block', () => {
    const trace: TraceEvent[] = [
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

  it('uses explicit parentage for flame-chart depth', () => {
    const root: Activity = { ...activity, id: 10, name: 'Root work' };
    const child: Activity = { ...activity, id: 11, name: 'Inspect config', parent_id: root.id };

    const result = processTrace([
      { id: 1, timestamp: 100, phase: 'B', activity: root },
      { id: 2, timestamp: 110, phase: 'B', activity: child },
      { id: 3, timestamp: 120, phase: 'E', activity: child },
      { id: 4, timestamp: 130, phase: 'E', activity: root },
    ], [thread]);

    expect(result.blocks.map(block => [block.activity_id, block.level])).toEqual([
      [root.id, 0],
      [child.id, 1],
    ]);
    expect(result.threadLevels[thread.id]).toEqual({ current: 0, max: 2 });
  });

  it('keeps overlapping root activities in separate display lanes', () => {
    const firstRoot: Activity = { ...activity, id: 10, name: 'First root' };
    const secondRoot: Activity = { ...activity, id: 11, name: 'Second root' };

    const result = processTrace([
      { id: 1, timestamp: 100, phase: 'B', activity: firstRoot },
      { id: 2, timestamp: 110, phase: 'B', activity: secondRoot },
      { id: 3, timestamp: 120, phase: 'E', activity: secondRoot },
      { id: 4, timestamp: 130, phase: 'E', activity: firstRoot },
    ], [thread]);

    expect(result.blocks.map(block => [block.activity_id, block.level])).toEqual([
      [firstRoot.id, 0],
      [secondRoot.id, 1],
    ]);
    expect(result.threadLevels[thread.id]).toEqual({ current: 0, max: 2 });
  });

  it('reuses display lanes across separate threads', () => {
    const otherThread: Thread = { id: 2, name: 'Other' };
    const firstRoot: Activity = { ...activity, id: 10, name: 'First root' };
    const secondRoot: Activity = {
      ...activity,
      id: 11,
      name: 'Second root',
      thread: otherThread,
    };

    const result = processTrace([
      { id: 1, timestamp: 100, phase: 'B', activity: firstRoot },
      { id: 2, timestamp: 110, phase: 'B', activity: secondRoot },
      { id: 3, timestamp: 120, phase: 'E', activity: secondRoot },
      { id: 4, timestamp: 130, phase: 'E', activity: firstRoot },
    ], [thread, otherThread]);

    expect(result.blocks.map(block => [block.activity_id, block.level])).toEqual([
      [firstRoot.id, 0],
      [secondRoot.id, 0],
    ]);
    expect(result.threadLevels[thread.id]).toEqual({ current: 0, max: 1 });
    expect(result.threadLevels[otherThread.id]).toEqual({ current: 0, max: 1 });
  });
});
