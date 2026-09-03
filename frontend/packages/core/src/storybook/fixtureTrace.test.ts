import processTrace from '../utilities/processTrace';
import { projectActorFlames, projectActorLaneLayout } from '../utilities/actorFlames';
import { viewportForFixture } from './createChartStore';
import { createAppChartFixture } from './fixtureTrace';
import {
  createConcurrentAgentsFixture,
  createDenseTraceFixture,
  createEmptyTraceFixture,
  createParentSuspensionFixture,
  createQuestionOutcomesFixture,
  createResurrectionFixture,
  createSparseTraceFixture,
  createStrangeSequenceFixture,
} from './scenarioFixtures';

describe('app chart Storybook fixture', () => {
  it('builds nested blocks with suspend, resume, and resurrect', () => {
    const fixture = createAppChartFixture({ now: 1_700_000_000_000 });
    const processed = processTrace(fixture.events, fixture.threads);

    expect(Object.keys(processed.threads)).toEqual(['1', '2']);
    expect(processed.blocks.map(block => [block.activity_id, block.level, block.beginning, block.ending])).toEqual([
      [30, 0, 'B', 'S'],
      [31, 1, 'B', 'E'],
      [10, 0, 'B', undefined],
      [11, 1, 'B', 'E'],
      [12, 1, 'B', 'S'],
      [13, 2, 'B', 'S'],
      [12, 1, 'R', 'E'],
      [13, 2, 'R', 'E'],
      [30, 0, 'R', 'E'],
      [14, 2, 'B', 'E'],
      [16, 1, 'B', 'S'],
      [11, 1, 'X', undefined],
    ]);
    expect(processed.activities[10]).toMatchObject({ status: 'active', flavor: 'task' });
    expect(processed.activities[11]).toMatchObject({ status: 'active' });
    expect(processed.activities[12]).toMatchObject({ status: 'complete' });
    expect(processed.activities[16]).toMatchObject({ status: 'suspended' });
    expect(processed.activities[30]).toMatchObject({ status: 'complete' });
  });

  it('keeps simultaneous agents in separate display lanes', () => {
    const fixture = createConcurrentAgentsFixture(1_700_000_000_000);
    const processed = processTrace(fixture.events, fixture.threads);
    const layout = projectActorLaneLayout(processed.activities, processed.blocks);

    expect(new Set(Object.values(processed.activities).map(item => item.agent_name))).toEqual(
      new Set(['Steve', 'Belinda', 'Miles', 'Nora', 'Deploy bot', undefined]),
    );
    expect(projectActorFlames(processed.activities)).toMatchObject([
      { rootActivityId: 100, parentActivityId: 90, actorName: 'Steve' },
      { rootActivityId: 110, parentActivityId: 90, actorName: 'Belinda' },
      { rootActivityId: 120, parentActivityId: 90, actorName: 'Miles' },
      { rootActivityId: 121, parentActivityId: 111, actorName: 'Nora' },
      { rootActivityId: 140, parentActivityId: null, actorName: 'Deploy bot' },
    ]);

    // Nested Variant 1: sibling lanes stack; Nora nests inside Belinda's band.
    expect(layout.rowByActivity['90']).toBe(0);
    expect(layout.rowByActivity['100']).toBeLessThan(layout.rowByActivity['110']);
    expect(layout.rowByActivity['121']).toBeGreaterThan(layout.rowByActivity['111']);
    const belinda = layout.lanes.find(lane => lane.rootActivityId === 110);
    const nora = layout.lanes.find(lane => lane.rootActivityId === 121);
    expect(belinda).toMatchObject({ parentLaneRootId: null, depth: 0 });
    expect(nora).toMatchObject({ parentLaneRootId: 110, depth: 1 });
    expect(nora && belinda && nora.rowStart >= belinda.rowStart).toBe(true);
    expect(nora && belinda && nora.rowEnd <= belinda.rowEnd).toBe(true);
  });

  it('reopens active children when their suspended parent resumes', () => {
    const fixture = createParentSuspensionFixture(1_700_000_000_000);
    const processed = processTrace(fixture.events, fixture.threads);

    expect(processed.blocks.filter(block => block.activity_id === 200)).toMatchObject([
      { beginning: 'B', ending: 'S' },
      { beginning: 'R' },
    ]);
    expect(processed.blocks.filter(block => block.activity_id === 202)).toMatchObject([
      { beginning: 'B', ending: 'S' },
      { beginning: 'R', ending: 'E' },
    ]);
  });

  it('shows each completed-to-active resurrection as another block', () => {
    const fixture = createResurrectionFixture(1_700_000_000_000);
    const processed = processTrace(fixture.events, fixture.threads);

    expect(processed.blocks.filter(block => block.activity_id === 300).map(block => block.beginning))
      .toEqual(['B', 'X', 'X']);
  });

  it('tolerates shuffled, duplicate, missing, and out-of-order lifecycle events', () => {
    const fixture = createStrangeSequenceFixture(1_700_000_000_000);
    const processed = processTrace(fixture.events, fixture.threads);

    expect(processed.blocks.map(block => [block.activity_id, block.beginning, block.ending])).toEqual([
      [400, 'B', 'S'],
      [402, 'R', undefined],
      [401, 'B', 'E'],
      [400, 'R', 'E'],
    ]);
    expect(processed.events).toHaveLength(11);
  });

  it('covers questions, dense work, sparse work, and an empty trace', () => {
    const now = 1_700_000_000_000;
    const questions = createQuestionOutcomesFixture(now);
    const dense = createDenseTraceFixture(now);
    const sparse = createSparseTraceFixture(now);
    const empty = createEmptyTraceFixture();

    expect(processTrace(questions.events, questions.threads).activities[502])
      .toMatchObject({ flavor: 'question', status: 'active' });
    expect(processTrace(dense.events, dense.threads).blocks).toHaveLength(18);
    expect(processTrace(sparse.events, sparse.threads).activities[700])
      .toMatchObject({ status: 'active' });
    expect(processTrace(empty.events, empty.threads).blocks).toEqual([]);
    expect(viewportForFixture(empty, now)).toEqual({
      minTime: now - 60 * 60 * 1000,
      maxTime: now + 10 * 60 * 1000,
    });
  });
});
