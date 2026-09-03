import type { Activity } from '../types/Activity';
import type { TraceBlock } from './processTrace';
import {
  actorAccentColor,
  actorKey,
  actorLaneTimeBounds,
  coalesceActorLaneChrome,
  fitActorLaneLabel,
  modelProviderFromAgentId,
  projectActorFlames,
  projectActorLaneLayout,
  selectActorFlameSegments,
} from './actorFlames';

function activity(fields: Partial<Activity> & Pick<Activity, 'id'>): Activity {
  return { categories: [], thread_id: 1, ...fields };
}

function block(activity_id: number, startTime: number, endTime?: number): TraceBlock {
  return {
    activity_id,
    beginning: 'B',
    events: [],
    level: 0,
    startTime,
    endTime,
  };
}

describe('actor flame projection', () => {
  it('starts a flame when an agent branches from human work', () => {
    const activities = {
      1: activity({ id: 1, name: 'Root' }),
      2: activity({ id: 2, parent_id: 1, agent_id: 'steve', agent_name: 'Steve' }),
    };

    expect(projectActorFlames(activities)).toEqual([{
      actorKey: 'agent:steve',
      actorName: 'Steve',
      parentActivityId: 1,
      rootActivityId: 2,
    }]);
  });

  it('does not create another flame for same-actor descendants', () => {
    const activities = {
      1: activity({ id: 1 }),
      2: activity({ id: 2, parent_id: 1, agent_id: 'steve', agent_name: 'Steve' }),
      3: activity({ id: 3, parent_id: 2, agent_id: 'steve', agent_name: 'Steve' }),
    };

    expect(projectActorFlames(activities).map(flame => flame.rootActivityId)).toEqual([2]);
  });

  it('supports nested delegation and transitions back to human work', () => {
    const activities = {
      1: activity({ id: 1 }),
      2: activity({ id: 2, parent_id: 1, agent_id: 'steve' }),
      3: activity({ id: 3, parent_id: 2, agent_id: 'belinda', agent_name: 'Belinda' }),
      4: activity({ id: 4, parent_id: 3 }),
    };

    expect(projectActorFlames(activities)).toMatchObject([
      { rootActivityId: 2, parentActivityId: 1, actorName: 'steve' },
      { rootActivityId: 3, parentActivityId: 2, actorName: 'Belinda' },
      { rootActivityId: 4, parentActivityId: 3, actorName: 'Human' },
    ]);
  });

  it('marks an independent agent root without inventing a parent connector', () => {
    const activities = {
      1: activity({ id: 1, agent_id: 'solo', agent_name: 'Solo' }),
    };

    expect(projectActorFlames(activities)).toMatchObject([
      { rootActivityId: 1, parentActivityId: null, actorName: 'Solo' },
    ]);
  });

  it('selects the parent lifecycle segment containing the branch start', () => {
    const flame = {
      actorKey: 'agent:steve',
      actorName: 'Steve',
      parentActivityId: 1,
      rootActivityId: 2,
    };
    const firstParent = block(1, 10, 20);
    const resumedParent = { ...block(1, 30), beginning: 'R' as const };
    const child = block(2, 35);

    expect(selectActorFlameSegments(flame, [firstParent, resumedParent, child])).toEqual({
      parentBlock: resumedParent,
      rootBlock: child,
    });
  });

  it('assigns accents from model provider prefixes', () => {
    expect(actorKey(activity({ id: 1 }))).toBe('human');
    expect(modelProviderFromAgentId('agent:claude:session')).toBe('claude');
    expect(modelProviderFromAgentId('cursor:abc')).toBe('cursor');
    expect(actorAccentColor('agent:claude:miles')).toBe(actorAccentColor('agent:claude:other'));
    expect(actorAccentColor('agent:claude:miles')).not.toBe(actorAccentColor('agent:cursor:miles'));
    expect(actorAccentColor('agent:claude:miles')).not.toBe(actorAccentColor('human'));
  });
});

describe('nested actor sublane layout', () => {
  it('stacks sibling agent lanes under a shared human parent', () => {
    const activities = {
      90: activity({ id: 90, name: 'Ship' }),
      100: activity({ id: 100, parent_id: 90, agent_id: 'steve', agent_name: 'Steve' }),
      101: activity({ id: 101, parent_id: 100, agent_id: 'steve', agent_name: 'Steve' }),
      110: activity({ id: 110, parent_id: 90, agent_id: 'belinda', agent_name: 'Belinda' }),
    };
    const blocks = [
      block(90, 0, 100),
      block(100, 10, 40),
      block(101, 15, 30),
      block(110, 20, 50),
    ];

    const layout = projectActorLaneLayout(activities, blocks);

    expect(layout.rowByActivity).toMatchObject({
      90: 0,
      100: 1,
      101: 2,
      110: 4,
    });
    expect(layout.lanes).toMatchObject([
      { rootActivityId: 100, rowStart: 1, rowEnd: 2, depth: 0, parentLaneRootId: null },
      { rootActivityId: 110, rowStart: 4, rowEnd: 4, depth: 0, parentLaneRootId: null },
    ]);
    expect(layout.maxRowsByThread['1']).toBe(5);
  });

  it('nests a delegated agent lane inside the parent actor band', () => {
    const activities = {
      90: activity({ id: 90 }),
      110: activity({ id: 110, parent_id: 90, agent_id: 'belinda', agent_name: 'Belinda' }),
      111: activity({ id: 111, parent_id: 110, agent_id: 'belinda', agent_name: 'Belinda' }),
      121: activity({ id: 121, parent_id: 111, agent_id: 'nora', agent_name: 'Nora' }),
    };
    const blocks = [
      block(90, 0, 100),
      block(110, 10, 80),
      block(111, 20, 70),
      block(121, 30, 50),
    ];

    const layout = projectActorLaneLayout(activities, blocks);
    const belinda = layout.lanes.find(lane => lane.rootActivityId === 110);
    const nora = layout.lanes.find(lane => lane.rootActivityId === 121);

    expect(layout.rowByActivity).toMatchObject({
      90: 0,
      110: 1,
      111: 2,
      121: 3,
    });
    expect(belinda).toMatchObject({
      rowStart: 1,
      rowEnd: 3,
      depth: 0,
      parentLaneRootId: null,
    });
    expect(nora).toMatchObject({
      rowStart: 3,
      rowEnd: 3,
      depth: 1,
      parentLaneRootId: 110,
    });
  });

  it('leaves a gap row between stacked non-nested agents but not before nested ones', () => {
    const activities = {
      90: activity({ id: 90 }),
      100: activity({ id: 100, parent_id: 90, agent_id: 'steve', agent_name: 'Steve' }),
      110: activity({ id: 110, parent_id: 90, agent_id: 'belinda', agent_name: 'Belinda' }),
      111: activity({ id: 111, parent_id: 110, agent_id: 'belinda', agent_name: 'Belinda' }),
      121: activity({ id: 121, parent_id: 111, agent_id: 'nora', agent_name: 'Nora' }),
    };
    const blocks = [
      block(90, 0, 100),
      block(100, 10, 50),
      block(110, 15, 80),
      block(111, 20, 70),
      block(121, 30, 50),
    ];

    const layout = projectActorLaneLayout(activities, blocks);
    expect(layout.rowByActivity['100']).toBe(1);
    expect(layout.rowByActivity['110']).toBe(3);
    expect(layout.rowByActivity['121']).toBe(5);
    expect(layout.rowByActivity['121'] - layout.rowByActivity['111']).toBe(1);
  });

  it('reuses rows for sequential non-overlapping roots like a flame chart', () => {
    const activities = {
      1: activity({ id: 1, name: 'Morning' }),
      2: activity({ id: 2, name: 'Afternoon' }),
      3: activity({ id: 3, name: 'Evening', agent_id: 'steve', agent_name: 'Steve' }),
    };
    const blocks = [
      block(1, 0, 10),
      block(2, 20, 30),
      block(3, 40, 50),
    ];

    const layout = projectActorLaneLayout(activities, blocks);

    expect(layout.rowByActivity).toMatchObject({
      1: 0,
      2: 0,
      3: 0,
    });
    expect(layout.maxRowsByThread['1']).toBe(1);
  });

  it('bounds an actor lane to its activity time range', () => {
    const activities = {
      1: activity({ id: 1 }),
      2: activity({ id: 2, parent_id: 1, agent_id: 'claude:miles', agent_name: 'Miles' }),
      3: activity({ id: 3, parent_id: 2, agent_id: 'claude:miles', agent_name: 'Miles' }),
    };
    const blocks = [
      block(1, 0, 100),
      block(2, 10, 40),
      block(3, 15, 35),
    ];
    const layout = projectActorLaneLayout(activities, blocks);
    const lane = layout.lanes.find(entry => entry.rootActivityId === 2);
    expect(lane).toBeTruthy();
    expect(actorLaneTimeBounds(lane!, layout.rootIdByActivity, blocks)).toEqual({
      startTime: 10,
      endTime: 40,
    });
  });
});

describe('coalesceActorLaneChrome', () => {
  it('merges same-agent flames when the gap is within one grid tick', () => {
    const activities = {
      1: activity({ id: 1 }),
      2: activity({ id: 2, parent_id: 1, agent_id: 'claude:miles', agent_name: 'Miles' }),
      3: activity({ id: 3, parent_id: 1, agent_id: 'claude:miles', agent_name: 'Miles' }),
      4: activity({ id: 4, parent_id: 1, agent_id: 'claude:miles', agent_name: 'Miles' }),
    };
    const blocks = [
      block(1, 0, 200),
      block(2, 10, 20),
      block(3, 25, 35),
      block(4, 100, 110),
    ];
    const layout = projectActorLaneLayout(activities, blocks);
    const chrome = coalesceActorLaneChrome(layout, blocks, 10);

    expect(chrome).toMatchObject([
      {
        actorName: 'Miles',
        providerKey: 'claude',
        rootActivityIds: [2, 3],
        startTime: 10,
        endTime: 35,
      },
      {
        actorName: 'Miles',
        rootActivityIds: [4],
        startTime: 100,
        endTime: 110,
      },
    ]);
  });

  it('keeps separate chrome when the gap exceeds one grid tick', () => {
    const activities = {
      1: activity({ id: 1 }),
      2: activity({ id: 2, parent_id: 1, agent_id: 'cursor:steve', agent_name: 'Steve' }),
      3: activity({ id: 3, parent_id: 1, agent_id: 'cursor:steve', agent_name: 'Steve' }),
    };
    const blocks = [
      block(1, 0, 100),
      block(2, 10, 20),
      block(3, 40, 50),
    ];
    const layout = projectActorLaneLayout(activities, blocks);
    expect(coalesceActorLaneChrome(layout, blocks, 10)).toHaveLength(2);
    expect(coalesceActorLaneChrome(layout, blocks, 30)).toHaveLength(1);
  });
});

describe('fitActorLaneLabel', () => {
  const measure = (text: string) => text.length * 10;

  it('keeps the full name when it fits', () => {
    expect(fitActorLaneLabel('Claude', 100, measure)).toBe('Claude');
  });

  it('falls back to initials before ellipsis', () => {
    expect(fitActorLaneLabel('Claude Opus', 20, measure)).toBe('CO');
  });

  it('truncates with an ellipsis when initials still do not fit', () => {
    const noInitials = (text: string) => (/^[A-Z]{1,4}$/.test(text) ? 1000 : text.length * 10);
    expect(fitActorLaneLabel('Claude', 40, noInitials)).toBe('Cla…');
  });

  it('returns empty when nothing fits', () => {
    expect(fitActorLaneLabel('Claude', 0, measure)).toBe('');
  });
});
