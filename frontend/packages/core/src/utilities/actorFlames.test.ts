import type { Activity } from '../types/Activity';
import type { TraceBlock } from './processTrace';
import {
  actorAccentColor,
  actorKey,
  actorLaneTimeBounds,
  blockLayoutKey,
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

function rowsOfWash(band: { washRects: Array<{ rowStart: number; rowEnd: number }> }): number[] {
  const rows: number[] = [];
  for (const rect of band.washRects) {
    for (let row = rect.rowStart; row <= rect.rowEnd; row += 1) rows.push(row);
  }
  return rows;
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

    // Human base stack first, then each agent in its own contiguous band.
    expect(layout.rowByActivity).toMatchObject({
      90: 0,
      100: 1,
      101: 2,
      110: 3,
    });
    expect(layout.lanes).toMatchObject([
      { rootActivityId: 100, rowStart: 1, rowEnd: 2, depth: 0, parentLaneRootId: null },
      { rootActivityId: 110, rowStart: 3, rowEnd: 3, depth: 0, parentLaneRootId: null },
    ]);
    expect(layout.maxRowsByThread['1']).toBe(4);
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

  it('packs each agent in its own contiguous band with delegated child inside', () => {
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
    // Human row 0; Steve's band next; Belinda's band (with Nora nested) below,
    // contiguous and disjoint from Steve's — no interleaving, no spacer.
    expect(layout.rowByActivity['100']).toBe(1);
    expect(layout.rowByActivity['110']).toBe(2);
    expect(layout.rowByActivity['111']).toBe(3);
    expect(layout.rowByActivity['121']).toBe(4);
    // Nora (delegated) sits directly under her parent inside Belinda's band.
    expect(layout.rowByActivity['121'] - layout.rowByActivity['111']).toBe(1);
  });

  it('packs a leftover same-actor child under the remaining ancestor without a spacer row', () => {
    const activities = {
      212: activity({ id: 212 }),
      321: activity({
        id: 321, parent_id: 212, agent_id: 'claude:x', agent_name: 'Claude',
      }),
      325: activity({
        id: 325, parent_id: 321, agent_id: 'claude:x', agent_name: 'Claude',
      }),
    };
    const blocks = [
      block(212, 0, 100),
      block(321, 10, 90),
      block(325, 20, 70),
    ];

    const layout = projectActorLaneLayout(activities, blocks);

    expect(layout.rowByActivity).toMatchObject({
      212: 0,
      321: 1,
      325: 2,
    });
    expect(layout.lanes).toMatchObject([
      { rootActivityId: 321, rowStart: 1, rowEnd: 2, depth: 0 },
    ]);
  });

  it('does not park a later child under a parent that already ended', () => {
    // 268 parented to 95, which ended weeks earlier — occupancy, not 95's row.
    const activities = {
      1: activity({ id: 1 }),
      62: activity({ id: 62 }),
      95: activity({ id: 95, name: 'accommodate on frontend' }),
      268: activity({ id: 268, name: 'Implement nested actor sublanes', parent_id: 95 }),
      269: activity({ id: 269, parent_id: 268 }),
      270: activity({ id: 270, parent_id: 268 }),
    };
    const blocks = [
      block(1, 0, 50),
      block(62, 10, 45),
      block(95, 20, 40),
      block(268, 80, 120),
      block(269, 85, 90),
      block(270, 90, 115),
    ];

    const layout = projectActorLaneLayout(activities, blocks);

    expect(layout.rowByActivity['95']).toBe(2);
    expect(layout.rowByActivity['268']).toBe(0);
    expect(layout.rowByActivity['269']).toBe(1);
    expect(layout.rowByActivity['270']).toBe(1);
  });

  it('floats an agent up to a shared row when its span does not collide', () => {
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

    // Steve's span (40–50) collides with neither human block on row 0, so his
    // swimlane floats all the way up and shares that row — as high as possible.
    expect(layout.rowByActivity).toMatchObject({
      1: 0,
      2: 0,
      3: 0,
    });
    expect(layout.maxRowsByThread['1']).toBe(1);
  });

  it('reuses a row for sequential siblings under an overlapping parent', () => {
    // 1 / 62 / 63 / 67 / 69 / 70: 63 then 67 do not overlap, 69 then 70 do not.
    const activities = {
      1: activity({ id: 1 }),
      62: activity({ id: 62 }),
      63: activity({ id: 63 }),
      67: activity({ id: 67 }),
      69: activity({ id: 69 }),
      70: activity({ id: 70 }),
    };
    const blocks = [
      block(1, 0, 100),
      block(62, 10, 90),
      block(63, 20, 40),
      block(67, 40, 80),
      block(69, 45, 50),
      block(70, 50, 70),
    ];

    const layout = projectActorLaneLayout(activities, blocks);

    expect(layout.rowByActivity['1']).toBe(0);
    expect(layout.rowByActivity['62']).toBe(1);
    expect(layout.rowByActivity['63']).toBe(2);
    expect(layout.rowByActivity['67']).toBe(2);
    expect(layout.rowByActivity['69']).toBe(3);
    expect(layout.rowByActivity['70']).toBe(3);
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

  it('does not nest gap work under a resumed activity', () => {
    // A: begin→suspend, then resume. B runs only during the suspend gap and is
    // not a child of A — packing must not treat A's hull as continuous occupancy.
    const activities = {
      1: activity({ id: 1, name: 'Suspended then resumed' }),
      2: activity({ id: 2, name: 'Work during the gap' }),
    };
    const blocks = [
      { ...block(1, 0, 10), beginning: 'B' as const, ending: 'S' as const },
      block(2, 20, 40),
      { ...block(1, 50), beginning: 'R' as const },
    ];

    const layout = projectActorLaneLayout(activities, blocks);

    expect(layout.rowByActivity).toMatchObject({
      1: 0,
      2: 0,
    });
  });

  it('stacks a resume below concurrent sibling work that holds attention', () => {
    const begin = { ...block(1, 0, 10), beginning: 'B' as const, ending: 'S' as const };
    const triage = block(2, 15, 70);
    const reply = block(3, 20, 40);
    const resume = { ...block(1, 50, 80), beginning: 'R' as const, ending: 'E' as const };
    const activities = {
      1: activity({ id: 1, name: 'Draft release notes' }),
      2: activity({ id: 2, name: 'Triage support inbox' }),
      3: activity({ id: 3, name: 'Reply to billing question', parent_id: 2 }),
    };

    const layout = projectActorLaneLayout(activities, [begin, triage, reply, resume]);

    expect(layout.rowByBlock[blockLayoutKey(begin)]).toBe(0);
    expect(layout.rowByActivity['2']).toBe(0);
    expect(layout.rowByActivity['3']).toBe(1);
    // Directly under the overlapping sibling (Triage), not under Reply.
    expect(layout.rowByBlock[blockLayoutKey(resume)]).toBe(layout.rowByActivity['2'] + 1);
    expect(layout.rowByBlock[blockLayoutKey(resume)]).toBe(layout.rowByActivity['3']);
  });

  it('keeps a resumed agent in its own band, separate from concurrent agent work', () => {
    const begin = { ...block(1, 0, 10), beginning: 'B' as const, ending: 'S' as const };
    const gap = block(2, 15, 70);
    const child = block(3, 20, 40);
    const resume = { ...block(1, 50, 80), beginning: 'R' as const, ending: 'E' as const };
    const activities = {
      1: activity({
        id: 1, name: 'Land SNL orbits', agent_id: 'claude:a', agent_name: 'Claude',
      }),
      2: activity({
        id: 2, name: 'Fix selected block offset', agent_id: 'cursor:b', agent_name: 'Composer',
      }),
      3: activity({
        id: 3, name: 'Align FocusedBlock Y', parent_id: 2,
        agent_id: 'cursor:b', agent_name: 'Composer',
      }),
    };

    const layout = projectActorLaneLayout(activities, [begin, gap, child, resume]);

    // Claude's begin and resume share Claude's own band row (they do not overlap),
    // while Composer occupies a separate band below — no interleaving.
    const beginRow = layout.rowByBlock[blockLayoutKey(begin)];
    const resumeRow = layout.rowByBlock[blockLayoutKey(resume)];
    const gapRow = layout.rowByBlock[blockLayoutKey(gap)];
    const childRow = layout.rowByBlock[blockLayoutKey(child)];
    expect(resumeRow).toBe(beginRow);
    expect(gapRow).toBeGreaterThan(beginRow);
    expect(childRow).toBe(gapRow + 1);
  });
});

describe('coalesceActorLaneChrome', () => {
  it('puts all same-agent owned flames in one sustained wash, including large gaps', () => {
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
    const miles = chrome.filter(band => band.actorName === 'Miles');

    expect(miles).toMatchObject([{
      actorName: 'Miles',
      providerKey: 'claude',
      rootActivityIds: [2, 3, 4],
      startTime: 10,
      endTime: 110,
    }]);
  });

  it('keeps a nested delegated agent as its own inset chrome', () => {
    const activities = {
      1: activity({ id: 1 }),
      2: activity({ id: 2, parent_id: 1, agent_id: 'cursor:steve', agent_name: 'Steve' }),
      3: activity({ id: 3, parent_id: 2, agent_id: 'codex:nora', agent_name: 'Nora' }),
    };
    const blocks = [
      block(1, 0, 100),
      block(2, 10, 80),
      block(3, 20, 40),
    ];
    const layout = projectActorLaneLayout(activities, blocks);
    const chrome = coalesceActorLaneChrome(layout, blocks, 10);
    expect(chrome.map(band => band.actorName)).toEqual(['Steve', 'Nora']);
    const steve = chrome.find(band => band.actorName === 'Steve')!;
    const nora = chrome.find(band => band.actorName === 'Nora')!;
    expect(steve.startTime).toBe(10);
    expect(steve.endTime).toBe(80);
    expect(nora.depth).toBe(1);
    expect(nora.parentLaneRootId).toBe(2);

    // Washes must not overlap: the parent does not wash the delegated child's row.
    const noraRow = layout.rowByBlock[blockLayoutKey(block(3, 20, 40))];
    const steveCoversNora = steve.washRects.some(rect =>
      rect.rowStart <= noraRow && noraRow <= rect.rowEnd);
    expect(steveCoversNora).toBe(false);
    expect(nora.washRects.some(rect => rect.rowStart <= noraRow && noraRow <= rect.rowEnd)).toBe(true);
  });

  it('washes independent --root flames of the same agent as one presence', () => {
    const activities = {
      339: activity({ id: 339, agent_id: 'cursor:a', agent_name: 'Grok' }),
      340: activity({ id: 340, agent_id: 'cursor:a', agent_name: 'Grok' }),
    };
    const blocks = [
      block(339, 0, 10),
      block(340, 12, 22),
    ];
    const chrome = coalesceActorLaneChrome(projectActorLaneLayout(activities, blocks), blocks, 10);
    expect(chrome).toHaveLength(1);
    expect(chrome[0]).toMatchObject({
      actorName: 'Grok',
      rootActivityIds: [339, 340],
      startTime: 0,
      endTime: 22,
    });
  });

  it('gives an agent its own band so its wash never shares a row with human work', () => {
    const activities = {
      2: activity({ id: 2, agent_id: 'cursor:ada', agent_name: 'Ada' }),
      3: activity({ id: 3 }),
      4: activity({ id: 4, agent_id: 'cursor:ada', agent_name: 'Ada' }),
    };
    const blocks = [block(2, 0, 10), block(3, 20, 30), block(4, 40, 50)];
    const layout = projectActorLaneLayout(activities, blocks);
    const humanRow = layout.rowByBlock[blockLayoutKey(block(3, 20, 30))];
    const chrome = coalesceActorLaneChrome(layout, blocks, 10);

    const ada = chrome.filter(band => band.actorName === 'Ada');
    expect(ada).toHaveLength(1);
    // Ada owns her own band row (the human block is on a different row), so her
    // sustained wash is one continuous rectangle that never covers the human.
    expect(ada[0]).toMatchObject({ rootActivityIds: [2, 4], startTime: 0, endTime: 50 });
    const adaRows = new Set(rowsOfWash(ada[0]!));
    expect(adaRows.has(humanRow)).toBe(false);
  });

  it('keeps each actor on its own band so washes never overlap (incl. suspend/resume)', () => {
    const begin = { ...block(2, 0, 10), beginning: 'B' as const, ending: 'S' as const };
    const gap = block(3, 15, 70);
    const resume = { ...block(2, 50, 80), beginning: 'R' as const, ending: 'E' as const };
    const activities = {
      1: activity({ id: 1 }),
      2: activity({
        id: 2, parent_id: 1, agent_id: 'claude:a', agent_name: 'Claude',
      }),
      3: activity({
        id: 3, parent_id: 1, agent_id: 'cursor:b', agent_name: 'Composer',
      }),
    };
    const blocks = [block(1, 0, 100), begin, gap, resume];
    const layout = projectActorLaneLayout(activities, blocks);
    const chrome = coalesceActorLaneChrome(layout, blocks, 1);

    const claude = chrome.find(band => band.rootActivityIds.some(id => Number(id) === 2))!;
    const composer = chrome.find(band => band.rootActivityIds.some(id => Number(id) === 3))!;
    expect(claude).toMatchObject({ startTime: 0, endTime: 80 });

    // Claude's begin and resume share Claude's own band row; Composer sits on a
    // separate band, so no row (and no wash) is shared between the two agents.
    expect(layout.rowByBlock[blockLayoutKey(resume)]).toBe(layout.rowByBlock[blockLayoutKey(begin)]);
    const claudeRows = new Set(rowsOfWash(claude));
    const composerRows = new Set(rowsOfWash(composer));
    for (const row of claudeRows) expect(composerRows.has(row)).toBe(false);
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
