import { describe, expect, it } from 'vitest';
import { isTimelineSnapshot } from '../../core/src/chart';
import { createExampleSnapshot, exampleSnapshotJson } from './exampleSnapshot';
import { snapshotFromFileText } from './localSnapshot';

describe('createExampleSnapshot', () => {
  it('is a timeline snapshot anchored at now with several chart features', () => {
    const now = 1_758_000_000_000;
    const snapshot = createExampleSnapshot(now);
    expect(isTimelineSnapshot(snapshot)).toBe(true);
    expect(snapshotFromFileText(exampleSnapshotJson(now))).toEqual(snapshot);
    expect(snapshot.exportedAt).toBe(now);
    expect(snapshot.viewport.rightBoundaryTime).toBe(now);
    expect(snapshot.timeLabels).toEqual({ absoluteTimeLabels: true, twelveHourClock: false });
    expect(snapshot.viewport.rightBoundaryTime - snapshot.viewport.leftBoundaryTime).toBeGreaterThan(
      90 * 24 * 60 * 60 * 1000,
    );
    expect(snapshot.fixture.events.length).toBeGreaterThan(40);
    expect(new Set(snapshot.fixture.events.map(event => event.activity?.id).filter(Boolean)).size).toBeGreaterThan(20);
    expect(snapshot.fixture.events.some(event => event.phase === 'Q')).toBe(true);
    expect(snapshot.fixture.categories.length).toBeGreaterThan(1);
    expect(snapshot.fixture.attentionShifts.length).toBeGreaterThan(0);
    expect(snapshot.fixture.events.some(event => event.phase === 'S')).toBe(true);
    expect(snapshot.fixture.events.some(event => event.activity?.agent_name)).toBe(true);
    const activities = new Map(
      snapshot.fixture.events
        .filter(event => event.activity)
        .map(event => [event.activity!.id, event.activity!]),
    );
    const playground = [...activities.values()].find(
      activity => activity.name === 'JSON playground on the share homepage',
    );
    expect(playground?.agent_name).toBe('Cursor');
    const playgroundDescendants = [...activities.values()].filter(activity => (
      activity.parent_id === playground?.id
      || activities.get(activity.parent_id ?? '')?.parent_id === playground?.id
    ));
    expect(playgroundDescendants.length).toBeGreaterThan(0);
    expect(playgroundDescendants.every(activity => activity.agent_name === 'Cursor')).toBe(true);
    expect(JSON.stringify(snapshot)).not.toMatch(/elastic/i);
    expect(snapshot.fixture.threads.map(thread => thread.name)).toEqual([
      'flambe🔥',
      'pudl ⚡',
      'home 🔨',
    ]);
  });
});
