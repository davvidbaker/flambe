import processTrace from '../utilities/processTrace';
import {
  blockLayoutKey,
  coalesceActorLaneChrome,
  projectActorFlames,
  projectActorLaneLayout,
} from '../utilities/actorFlames';
import { createChartStore, viewportForFixture } from './createChartStore';
import { createAppChartFixture } from './fixtureTrace';
import { createFrontiersFixture } from './frontiersFixture';
import { createWinterStormUriFixture } from './winterStormUriFixture';
import {
  createConcurrentAgentsFixture,
  createDenseTraceFixture,
  createEmptyTraceFixture,
  createParentSuspensionFixture,
  createQuestionOutcomesFixture,
  createResumeDuringConcurrentWorkFixture,
  createHumanResumeDuringConcurrentWorkFixture,
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

  it('keeps gap work as a sibling when a suspended root resumes over it', () => {
    const fixture = createResumeDuringConcurrentWorkFixture(1_700_000_000_000);
    const processed = processTrace(fixture.events, fixture.threads);
    const layout = projectActorLaneLayout(processed.activities, processed.blocks);

    expect(processed.activities[250]?.parent_id).toBeUndefined();
    expect(processed.activities[251]?.parent_id).toBeUndefined();
    expect(processed.activities[252]?.parent_id).toBe(251);
    expect(processed.blocks.filter(block => block.activity_id === 250)).toMatchObject([
      { beginning: 'B', ending: 'S' },
      { beginning: 'R', ending: 'E' },
    ]);

    // Independent root flames — Composer is not nested under Claude.
    const claude = layout.lanes.find(lane => lane.rootActivityId === 250);
    const composer = layout.lanes.find(lane => lane.rootActivityId === 251);
    expect(claude).toMatchObject({ parentActivityId: null, parentLaneRootId: null, depth: 0 });
    expect(composer).toMatchObject({ parentActivityId: null, parentLaneRootId: null, depth: 0 });

    const claudeResume = processed.blocks.find(
      block => block.activity_id === 250 && block.beginning === 'R',
    );
    const composerBlock = processed.blocks.find(block => block.activity_id === 251);
    expect(claudeResume && composerBlock).toBeTruthy();
    expect(layout.rowByBlock[blockLayoutKey(claudeResume!)]).toBe(
      layout.rowByBlock[blockLayoutKey(composerBlock!)] + 1,
    );
  });

  it('keeps human gap work as a sibling when a suspended root resumes over it', () => {
    const fixture = createHumanResumeDuringConcurrentWorkFixture(1_700_000_000_000);
    const processed = processTrace(fixture.events, fixture.threads);
    const layout = projectActorLaneLayout(processed.activities, processed.blocks);

    expect(Object.values(processed.activities).every(item => !item.agent_id)).toBe(true);
    expect(processed.activities[260]?.parent_id).toBeUndefined();
    expect(processed.activities[261]?.parent_id).toBeUndefined();
    expect(processed.activities[262]?.parent_id).toBe(261);
    expect(processed.blocks.filter(block => block.activity_id === 260)).toMatchObject([
      { beginning: 'B', ending: 'S' },
      { beginning: 'R', ending: 'E' },
    ]);
    expect(layout.flames).toEqual([]);
    // Both are thread roots; gap triage is not a child of the notes.
    expect(layout.rowByActivity['260']).toBeDefined();
    expect(layout.rowByActivity['261']).toBeDefined();

    const notesResume = processed.blocks.find(
      block => block.activity_id === 260 && block.beginning === 'R',
    );
    const triage = processed.blocks.find(block => block.activity_id === 261);
    expect(notesResume && triage).toBeTruthy();
    expect(layout.rowByBlock[blockLayoutKey(notesResume!)]).toBe(
      layout.rowByBlock[blockLayoutKey(triage!)] + 1,
    );
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

  it('answers one research question by nested rabbit holes', () => {
    const fixture = createFrontiersFixture(1_700_000_000_000);
    const processed = processTrace(fixture.events, fixture.threads);

    expect(fixture.threads.map(item => item.name)).toEqual([
      'mission 🚀',
      'energy ⚡',
      'fuels 🔥',
      'materials 🧱',
      'navigation 📡',
    ]);
    expect(fixture.traceName).toBe('How do we get to the Moon and back?');
    expect(processed.activities[100]).toMatchObject({
      flavor: 'question',
      status: 'complete',
      name: 'How do we get to the Moon and back?',
    });
    expect(processed.activities[200]).toMatchObject({
      flavor: 'question',
      status: 'complete',
      name: 'What is energy?',
    });
    expect(processed.activities[300]).toMatchObject({
      flavor: 'question',
      status: 'complete',
      name: 'How do fuels actually store energy?',
    });
    expect(processed.blocks.find(block => block.activity_id === 100)).toMatchObject({
      beginning: 'Q', ending: 'V',
    });
    expect(processed.blocks.find(block => block.activity_id === 110)).toMatchObject({
      beginning: 'Q', ending: 'J',
    });
    expect(processed.blocks.find(block => block.activity_id === 120)).toMatchObject({
      beginning: 'Q', ending: 'V',
    });
    expect(processed.blocks.find(block => block.activity_id === 130)).toMatchObject({
      beginning: 'Q', ending: 'V',
    });
    expect(new Set(Object.values(processed.activities).map(item => item.agent_name))).toEqual(
      new Set(['Athena', 'Kepler', 'Maxwell', undefined]),
    );

    const layout = projectActorLaneLayout(processed.activities, processed.blocks);
    expect(layout.rowByActivity['100']).toBe(0);
    expect(layout.rowByActivity['110']).toBe(1);
    expect(layout.rowByActivity['120']).toBe(1);
    expect(layout.rowByActivity['130']).toBe(1);
    expect(layout.rowByActivity['111']).toBe(2);
    expect(layout.rowByActivity['131']).toBe(2);
    expect(layout.rowByActivity['200']).toBe(0);
    expect(layout.rowByActivity['300']).toBe(0);
    expect(layout.rowByActivity['400']).toBe(0);
    expect(layout.rowByActivity['500']).toBe(0);
  });

  it('covers ERCOT during Winter Storm Uri across six threads', () => {
    const fixture = createWinterStormUriFixture(1_700_000_000_000);
    const processed = processTrace(fixture.events, fixture.threads);
    const layout = projectActorLaneLayout(processed.activities, processed.blocks);

    expect(fixture.threads.map(item => item.name)).toEqual([
      'ERCOT ⚡',
      'generation 🏭',
      'natural gas 🔥',
      'utilities 🏠',
      'weather ❄️',
      'Austin 🏛️',
    ]);
    expect(new Set(Object.values(processed.activities).map(item => item.agent_name))).toEqual(
      new Set([
        'Vistra',
        'Pattern',
        'STPNOC',
        'Atmos',
        'Kinder Morgan',
        'Oncor',
        'CenterPoint',
        'Austin Energy',
        'NWS',
        undefined,
      ]),
    );
    expect(processed.activities[610]).toMatchObject({ flavor: 'question', status: 'active' });
    expect(processed.activities[611]).toMatchObject({ status: 'active' });
    expect(processed.activities[103]).toMatchObject({ flavor: 'question' });
    expect(processed.blocks.filter(block => block.activity_id === 211).map(block => block.beginning))
      .toEqual(['B', 'X', 'X']);
    expect(processed.blocks.filter(block => block.activity_id === 440)).toMatchObject([
      { beginning: 'B', ending: 'S' },
      { beginning: 'R', ending: 'E' },
    ]);
    expect(processed.blocks.filter(block => block.activity_id === 250)).toMatchObject([
      { beginning: 'B', ending: 'S' },
      { beginning: 'R', ending: 'E' },
    ]);

    const oncor = layout.lanes.find(lane => lane.rootActivityId === 410);
    const centerpoint = layout.lanes.find(lane => lane.rootActivityId === 420);
    const austin = layout.lanes.find(lane => lane.rootActivityId === 430);
    expect(oncor).toMatchObject({ depth: 0, parentLaneRootId: null });
    expect(centerpoint).toMatchObject({ depth: 0, parentLaneRootId: null });
    expect(austin).toMatchObject({ depth: 0, parentLaneRootId: null });
    expect(oncor && centerpoint && oncor.rowStart < centerpoint.rowStart).toBe(true);
    expect(projectActorFlames(processed.activities).length).toBeGreaterThan(8);
    expect(() => coalesceActorLaneChrome(layout, processed.blocks, 60 * 60 * 1000)).not.toThrow();
  });
});

describe('createChartStore share path', () => {
  it('honors an explicit viewport and skips demo observations', () => {
    const fixture = createAppChartFixture({ now: 1_700_000_000_000 });
    const store = createChartStore(fixture, 1_700_000_000_000, {
      demoOverlays: false,
      viewport: { leftBoundaryTime: 100, rightBoundaryTime: 200 },
    });
    const state = store.getState();
    expect(state.timeline.leftBoundaryTime).toBe(100);
    expect(state.timeline.rightBoundaryTime).toBe(200);
    expect(state.user.observations).toEqual([]);
    expect(state.user.mantras).toEqual([]);
  });

  it('applies frozen time label settings', () => {
    const fixture = createAppChartFixture({ now: 1_700_000_000_000 });
    const store = createChartStore(fixture, 1_700_000_000_000, {
      demoOverlays: false,
      timeLabels: { absoluteTimeLabels: true, twelveHourClock: true },
    });
    expect(store.getState().settings.absoluteTimeLabels).toBe(true);
    expect(store.getState().settings.twelveHourClock).toBe(true);
  });
});
