import type { Activity } from '../types/Activity';
import type { EntityId } from '../types/ids';
import type { TraceBlock } from './processTrace';

/**
 * Actor-flame projection and lane layout (presentation only).
 *
 * Chrome vocabulary — **activity block**, **rail**, **wash**, **gutter**, **fork** —
 * and labeling rules (display name vs model-provider color, temporal merge) live in
 * docs/ADR-005-actor-lane-chrome.md.
 */

const HUMAN_ACTOR_KEY = 'human';

/** Stable hues for known model providers (ADR-005). */
const PROVIDER_COLORS: Record<string, string> = {
  claude: '#d97706',
  cursor: '#2563eb',
  codex: '#7c3aed',
  gpt: '#059669',
  openai: '#059669',
  grok: '#db2777',
};

const FALLBACK_ACCENTS = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#0891b2'];

type ActivityRecord = Record<string, Pick<
  Activity,
  'agent_id' | 'agent_name' | 'id' | 'parent_id' | 'thread_id'
>>;

export interface ActorFlame {
  actorKey: string;
  actorName: string;
  parentActivityId: EntityId | null;
  rootActivityId: EntityId;
}

export interface ActorFlameSegments {
  parentBlock: TraceBlock | null;
  rootBlock: TraceBlock | null;
}

export interface ActorFlameProjection {
  flames: ActorFlame[];
  /**
   * For each activity id, the nearest actor-flame root activity id (agent only),
   * or null when the activity is human (agent_id is null/undefined).
   */
  rootIdByActivity: Record<string, EntityId | null>;
}

/** Presentation-only vertical band for one agent actor flame. */
export interface ActorLaneBand {
  actorKey: string;
  actorName: string;
  depth: number;
  parentActivityId: EntityId | null;
  parentLaneRootId: EntityId | null;
  rootActivityId: EntityId;
  /** Inclusive display row of the top of this lane band. */
  rowStart: number;
  /** Inclusive display row of the bottom of this lane band. */
  rowEnd: number;
  threadId: EntityId;
}

export interface ActorLaneLayout {
  flames: ActorFlame[];
  lanes: ActorLaneBand[];
  /** Display row for each activity id (replaces block.level for Y placement). */
  rowByActivity: Record<string, number>;
  rootIdByActivity: Record<string, EntityId | null>;
  maxRowsByThread: Record<string, number>;
}

/** Painted chrome envelope for one or more coalesced actor flames (ADR-005). */
export interface ActorLaneChrome {
  actorKey: string;
  actorName: string;
  depth: number;
  endTime: number | null;
  parentLaneRootId: EntityId | null;
  providerKey: string;
  rootActivityIds: EntityId[];
  rowEnd: number;
  rowStart: number;
  startTime: number;
  threadId: EntityId;
}

function keyFor(id: EntityId): string {
  return String(id);
}

export function actorKey(activity: Pick<Activity, 'agent_id'>): string {
  return activity.agent_id === null || activity.agent_id === undefined
    ? HUMAN_ACTOR_KEY
    : `agent:${activity.agent_id}`;
}

export function actorName(activity: Pick<Activity, 'agent_id' | 'agent_name'>): string {
  if (activity.agent_id === null || activity.agent_id === undefined) return 'Human';
  return activity.agent_name || String(activity.agent_id);
}

/**
 * Project presentation-only actor flames from the semantic activity forest.
 * Parentage remains work containment; a flame begins only at an actor boundary.
 */
export function projectActorFlames(activities: ActivityRecord): ActorFlame[] {
  return Object.values(activities).flatMap(activity => {
    const parentId = activity.parent_id ?? null;
    const parent = parentId === null ? undefined : activities[keyFor(parentId)];
    const activityActorKey = actorKey(activity);

    if (parent && actorKey(parent) === activityActorKey) return [];
    if (!parent && activityActorKey === HUMAN_ACTOR_KEY) return [];

    return [{
      actorKey: activityActorKey,
      actorName: actorName(activity),
      parentActivityId: parent?.id ?? null,
      rootActivityId: activity.id,
    }];
  });
}

export function projectActorFlameProjection(
  activities: ActivityRecord,
): ActorFlameProjection {
  const rootMemo: Record<string, EntityId | null | undefined> = {};

  const rootIdForActivity = (activityId: EntityId): EntityId | null => {
    const actKey = keyFor(activityId);
    if (actKey in rootMemo) return rootMemo[actKey] as EntityId | null;

    const act = activities[actKey];
    if (!act) {
      rootMemo[actKey] = null;
      return null;
    }

    if (actorKey(act) === HUMAN_ACTOR_KEY) {
      rootMemo[actKey] = null;
      return null;
    }

    const parentId = act.parent_id ?? null;
    if (parentId === null) {
      rootMemo[actKey] = act.id;
      return act.id;
    }

    const parent = activities[keyFor(parentId)];
    if (!parent) {
      rootMemo[actKey] = act.id;
      return act.id;
    }

    if (actorKey(parent) === actorKey(act)) {
      const next = rootIdForActivity(parent.id);
      rootMemo[actKey] = next;
      return next;
    }

    rootMemo[actKey] = act.id;
    return act.id;
  };

  const rootIdByActivity: Record<string, EntityId | null> = {};
  for (const activity of Object.values(activities)) {
    rootIdByActivity[String(activity.id)] = rootIdForActivity(activity.id);
  }

  const flames: ActorFlame[] = Object.values(activities).flatMap(activity => {
    const rootId = rootIdByActivity[String(activity.id)];
    if (!rootId || rootId !== activity.id) return [];
    if (actorKey(activity) === HUMAN_ACTOR_KEY) return [];

    const parentId = activity.parent_id ?? null;
    const parent = parentId === null ? undefined : activities[keyFor(parentId)];

    return [{
      actorKey: actorKey(activity),
      actorName: actorName(activity),
      parentActivityId: parent ? parent.id : null,
      rootActivityId: activity.id,
    }];
  });

  return { flames, rootIdByActivity };
}

function firstBlock(blocks: TraceBlock[], activityId: EntityId): TraceBlock | null {
  return blocks
    .filter(block => String(block.activity_id) === String(activityId))
    .sort((left, right) => left.startTime - right.startTime)[0] ?? null;
}

function activityStartTime(
  activityId: EntityId,
  blocks: TraceBlock[],
): number {
  return firstBlock(blocks, activityId)?.startTime ?? Number.POSITIVE_INFINITY;
}

export function selectActorFlameSegments(
  flame: ActorFlame,
  blocks: TraceBlock[],
): ActorFlameSegments {
  const rootBlock = firstBlock(blocks, flame.rootActivityId);
  if (!rootBlock || flame.parentActivityId === null) {
    return { parentBlock: null, rootBlock };
  }

  const parentBlocks = blocks
    .filter(block => String(block.activity_id) === String(flame.parentActivityId))
    .sort((left, right) => left.startTime - right.startTime);
  const rootStart = rootBlock.startTime;
  const containing = parentBlocks.find(block =>
    block.startTime <= rootStart
    && (block.endTime === undefined || block.endTime >= rootStart));
  const preceding = [...parentBlocks]
    .reverse()
    .find(block => (block.endTime ?? block.startTime) <= rootStart);

  return {
    parentBlock: containing ?? preceding ?? parentBlocks[0] ?? null,
    rootBlock,
  };
}

/**
 * Pick a label that fits in `maxLengthPx` when drawn horizontally (which becomes
 * the vertical budget after a 90° CCW rotation). Prefer full name, then
 * initials, then ellipsis truncation.
 */
export function fitActorLaneLabel(
  name: string,
  maxLengthPx: number,
  measureWidth: (text: string) => number,
): string {
  const trimmed = name.trim();
  if (!trimmed || maxLengthPx <= 0) return '';
  if (measureWidth(trimmed) <= maxLengthPx) return trimmed;

  const initials = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]!.toUpperCase())
    .join('');
  if (initials && measureWidth(initials) <= maxLengthPx) return initials;

  let candidate = trimmed;
  while (candidate.length > 1) {
    candidate = candidate.slice(0, -1);
    const withEllipsis = `${candidate}…`;
    if (measureWidth(withEllipsis) <= maxLengthPx) return withEllipsis;
  }

  const single = trimmed[0] ?? '';
  return measureWidth(single) <= maxLengthPx ? single : '';
}

/**
 * Model provider token from an agent id or actor key (`agent:claude:session` → `claude`).
 */
export function modelProviderFromAgentId(agentId: string | null | undefined): string {
  if (!agentId) return HUMAN_ACTOR_KEY;
  const id = agentId.startsWith('agent:') ? agentId.slice('agent:'.length) : agentId;
  const colon = id.indexOf(':');
  if (colon > 0) return id.slice(0, colon).toLowerCase();
  return 'unknown';
}

/** Rail/wash accent from model provider (ADR-005). */
export function actorAccentColor(actorKeyOrAgentId: string): string {
  if (actorKeyOrAgentId === HUMAN_ACTOR_KEY) return '#6b7280';
  const provider = modelProviderFromAgentId(actorKeyOrAgentId);
  if (PROVIDER_COLORS[provider]) return PROVIDER_COLORS[provider];

  let hash = 0;
  for (let index = 0; index < provider.length; index += 1) {
    hash = ((hash << 5) - hash + provider.charCodeAt(index)) | 0;
  }
  return FALLBACK_ACCENTS[Math.abs(hash) % FALLBACK_ACCENTS.length];
}

function laneTimeBoundsForRoots(
  rootActivityIds: EntityId[],
  rootIdByActivity: Record<string, EntityId | null>,
  blocks: TraceBlock[],
): { startTime: number; endTime: number | null } | null {
  const rootSet = new Set(rootActivityIds.map(String));
  const laneBlocks = blocks.filter(block => {
    const root = rootIdByActivity[String(block.activity_id)];
    return root !== null && root !== undefined && rootSet.has(String(root));
  });
  if (!laneBlocks.length) return null;

  const startTime = Math.min(...laneBlocks.map(block => block.startTime));
  const open = laneBlocks.some(block => block.endTime === undefined);
  if (open) return { startTime, endTime: null };

  return {
    startTime,
    endTime: Math.max(...laneBlocks.map(block => block.endTime as number)),
  };
}

/** Horizontal time extent of an actor lane from its same-actor activity blocks. */
export function actorLaneTimeBounds(
  lane: Pick<ActorLaneBand, 'rootActivityId'>,
  rootIdByActivity: Record<string, EntityId | null>,
  blocks: TraceBlock[],
): { startTime: number; endTime: number | null } | null {
  return laneTimeBoundsForRoots([lane.rootActivityId], rootIdByActivity, blocks);
}

/**
 * Coalesce lane chrome when same-agent flames are within one grid tick (ADR-005 S5).
 */
export function coalesceActorLaneChrome(
  layout: ActorLaneLayout,
  blocks: TraceBlock[],
  gridTickMs: number,
  nowMs: number = Date.now(),
): ActorLaneChrome[] {
  const tick = Number.isFinite(gridTickMs) && gridTickMs > 0 ? gridTickMs : 0;
  const withBounds = layout.lanes.map(lane => {
    const bounds = actorLaneTimeBounds(lane, layout.rootIdByActivity, blocks);
    return {
      lane,
      startTime: bounds?.startTime ?? Number.POSITIVE_INFINITY,
      endTime: bounds?.endTime === null ? null : (bounds?.endTime ?? Number.POSITIVE_INFINITY),
    };
  }).filter(entry => Number.isFinite(entry.startTime));

  const groups = new Map<string, typeof withBounds>();
  for (const entry of withBounds) {
    const key = [
      String(entry.lane.threadId),
      entry.lane.actorKey,
      String(entry.lane.parentLaneRootId ?? ''),
      String(entry.lane.depth),
    ].join('|');
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }

  const chrome: ActorLaneChrome[] = [];
  for (const entries of groups.values()) {
    entries.sort((left, right) => left.startTime - right.startTime
      || Number(left.lane.rootActivityId) - Number(right.lane.rootActivityId));

    let current = entries[0]!;
    let roots = [current.lane.rootActivityId];
    let rowStart = current.lane.rowStart;
    let rowEnd = current.lane.rowEnd;
    let endTime = current.endTime;

    const flush = () => {
      chrome.push({
        actorKey: current.lane.actorKey,
        actorName: current.lane.actorName,
        depth: current.lane.depth,
        endTime,
        parentLaneRootId: current.lane.parentLaneRootId,
        providerKey: modelProviderFromAgentId(current.lane.actorKey),
        rootActivityIds: roots.slice(),
        rowEnd,
        rowStart,
        startTime: current.startTime,
        threadId: current.lane.threadId,
      });
    };

    for (let index = 1; index < entries.length; index += 1) {
      const next = entries[index]!;
      const currentEnd = endTime === null ? nowMs : endTime;
      const gap = next.startTime - currentEnd;
      if (tick > 0 && gap <= tick) {
        roots.push(next.lane.rootActivityId);
        rowStart = Math.min(rowStart, next.lane.rowStart);
        rowEnd = Math.max(rowEnd, next.lane.rowEnd);
        if (endTime === null || next.endTime === null) {
          endTime = null;
        } else {
          endTime = Math.max(endTime, next.endTime);
        }
        continue;
      }
      flush();
      current = next;
      roots = [next.lane.rootActivityId];
      rowStart = next.lane.rowStart;
      rowEnd = next.lane.rowEnd;
      endTime = next.endTime;
    }
    flush();
  }

  return chrome.sort((left, right) => left.depth - right.depth
    || left.startTime - right.startTime);
}

function parentLaneRootId(
  flame: ActorFlame,
  rootIdByActivity: Record<string, EntityId | null>,
): EntityId | null {
  if (flame.parentActivityId === null) return null;
  return rootIdByActivity[String(flame.parentActivityId)] ?? null;
}

type TimeInterval = { start: number; end: number };

function activityInterval(
  activityId: EntityId,
  blocks: TraceBlock[],
): TimeInterval {
  const mine = blocks.filter(block => String(block.activity_id) === String(activityId));
  if (!mine.length) {
    return { start: Number.POSITIVE_INFINITY, end: Number.POSITIVE_INFINITY };
  }
  return {
    start: Math.min(...mine.map(block => block.startTime)),
    end: Math.max(...mine.map(block => block.endTime ?? Number.POSITIVE_INFINITY)),
  };
}

function intervalsOverlap(left: TimeInterval, right: TimeInterval): boolean {
  return left.start < right.end && right.start < left.end;
}

function unionIntervals(intervals: TimeInterval[]): TimeInterval {
  const finite = intervals.filter(interval => Number.isFinite(interval.start));
  if (!finite.length) {
    return { start: Number.POSITIVE_INFINITY, end: Number.POSITIVE_INFINITY };
  }
  return {
    start: Math.min(...finite.map(interval => interval.start)),
    end: Math.max(...finite.map(interval => interval.end)),
  };
}

/**
 * Nested actor-sublane layout (Variant 1): each agent boundary opens a labeled
 * vertical lane; same-actor work nests inside; delegated agents nest inside the
 * parent actor's band. Human work stays in the thread's primary stack.
 *
 * Rows are packed by time occupancy (flame-chart style): non-overlapping
 * siblings/roots reuse vertical space instead of stacking into a waterfall.
 */
export function projectActorLaneLayout(
  activities: ActivityRecord,
  blocks: TraceBlock[],
): ActorLaneLayout {
  const { flames, rootIdByActivity } = projectActorFlameProjection(activities);
  const rowByActivity: Record<string, number> = {};
  const lanes: ActorLaneBand[] = [];
  const maxRowsByThread: Record<string, number> = {};

  const flameByRoot = Object.fromEntries(
    flames.map(flame => [String(flame.rootActivityId), flame]),
  );

  const childrenByParent = new Map<string, EntityId[]>();
  const threadRoots = new Map<string, EntityId[]>();

  for (const activity of Object.values(activities)) {
    if (activity.thread_id === undefined || activity.thread_id === null) continue;
    const threadKey = keyFor(activity.thread_id);
    const parentId = activity.parent_id ?? null;
    if (parentId === null || !activities[keyFor(parentId)]
      || String(activities[keyFor(parentId)]?.thread_id) !== threadKey) {
      const roots = threadRoots.get(threadKey) ?? [];
      roots.push(activity.id);
      threadRoots.set(threadKey, roots);
      continue;
    }
    const parentKey = keyFor(parentId);
    const siblings = childrenByParent.get(parentKey) ?? [];
    siblings.push(activity.id);
    childrenByParent.set(parentKey, siblings);
  }

  const sortByStart = (ids: EntityId[]) => ids
    .slice()
    .sort((left, right) =>
      activityStartTime(left, blocks) - activityStartTime(right, blocks)
      || Number(left) - Number(right));

  const sameActorLocalDepth = (activityId: EntityId, laneRootId: EntityId): number => {
    let depth = 0;
    let current = activities[keyFor(activityId)];
    const seen = new Set<string>();
    while (current && current.id !== laneRootId && !seen.has(keyFor(current.id))) {
      seen.add(keyFor(current.id));
      const parentId = current.parent_id ?? null;
      if (parentId === null) break;
      const parent = activities[keyFor(parentId)];
      if (!parent || actorKey(parent) !== actorKey(current)) break;
      depth += 1;
      current = parent;
    }
    return depth;
  };

  const occupiedByThread = new Map<string, Map<number, TimeInterval[]>>();

  const occupiedRows = (threadId: EntityId) => {
    const threadKey = keyFor(threadId);
    let rows = occupiedByThread.get(threadKey);
    if (!rows) {
      rows = new Map();
      occupiedByThread.set(threadKey, rows);
    }
    return rows;
  };

  const firstFreeRow = (
    threadId: EntityId,
    minRow: number,
    interval: TimeInterval,
    rowCount = 1,
  ): number => {
    const occupied = occupiedRows(threadId);
    let row = Math.max(0, minRow);
    for (;;) {
      let fits = true;
      for (let offset = 0; offset < rowCount; offset += 1) {
        const existing = occupied.get(row + offset) ?? [];
        if (existing.some(entry => intervalsOverlap(entry, interval))) {
          fits = false;
          break;
        }
      }
      if (fits) return row;
      row += 1;
    }
  };

  const occupyRows = (
    threadId: EntityId,
    rowStart: number,
    rowEnd: number,
    interval: TimeInterval,
  ) => {
    if (!Number.isFinite(interval.start)) return;
    const occupied = occupiedRows(threadId);
    for (let row = rowStart; row <= rowEnd; row += 1) {
      const entries = occupied.get(row) ?? [];
      entries.push(interval);
      occupied.set(row, entries);
    }
  };

  const layoutLane = (
    flame: ActorFlame,
    minRow: number,
    threadId: EntityId,
    depth: number,
  ): number => {
    const sameActorIds = sortByStart(Object.values(activities)
      .filter(activity =>
        String(activity.thread_id) === String(threadId)
        && rootIdByActivity[keyFor(activity.id)] === flame.rootActivityId)
      .map(activity => activity.id));

    const relativeOccupied = new Map<number, TimeInterval[]>();
    const relativeFirstFree = (minRelative: number, span: TimeInterval) => {
      let row = Math.max(0, minRelative);
      for (;;) {
        const existing = relativeOccupied.get(row) ?? [];
        if (!existing.some(entry => intervalsOverlap(entry, span))) return row;
        row += 1;
      }
    };
    const relativeOccupy = (row: number, span: TimeInterval) => {
      if (!Number.isFinite(span.start)) return;
      const entries = relativeOccupied.get(row) ?? [];
      entries.push(span);
      relativeOccupied.set(row, entries);
    };

    const provisional: Record<string, number> = {};
    let maxSameRow = 0;
    for (const activityId of sameActorIds) {
      const span = activityInterval(activityId, blocks);
      const row = relativeFirstFree(
        sameActorLocalDepth(activityId, flame.rootActivityId),
        span,
      );
      provisional[keyFor(activityId)] = row;
      relativeOccupy(row, span);
      maxSameRow = Math.max(maxSameRow, row);
    }

    const nestedFlames = flames
      .filter(candidate => parentLaneRootId(candidate, rootIdByActivity) === flame.rootActivityId)
      .slice()
      .sort((left, right) =>
        activityStartTime(left.rootActivityId, blocks)
        - activityStartTime(right.rootActivityId, blocks));

    const humanChildren = sameActorIds.flatMap(activityId =>
      sortByStart(childrenByParent.get(keyFor(activityId)) ?? [])
        .filter(childId => actorKey(activities[keyFor(childId)] ?? { agent_id: null }) === HUMAN_ACTOR_KEY));

    const baseInterval = unionIntervals(
      sameActorIds.map(id => activityInterval(id, blocks)),
    );
    const baseHeight = maxSameRow + 1;
    const startRow = firstFreeRow(threadId, minRow, baseInterval, baseHeight);

    for (const [activityKey, relativeRow] of Object.entries(provisional)) {
      rowByActivity[activityKey] = startRow + relativeRow;
    }
    for (const activityId of sameActorIds) {
      const absoluteRow = rowByActivity[keyFor(activityId)];
      occupyRows(
        threadId,
        absoluteRow,
        absoluteRow,
        activityInterval(activityId, blocks),
      );
    }

    let bandEnd = startRow + maxSameRow;

    for (const nested of nestedFlames) {
      const parentRow = nested.parentActivityId === null
        ? startRow
        : (rowByActivity[keyFor(nested.parentActivityId)] ?? startRow);
      const nestEnd = layoutLane(nested, parentRow + 1, threadId, depth + 1);
      bandEnd = Math.max(bandEnd, nestEnd);
    }

    for (const humanId of humanChildren) {
      const parent = activities[keyFor(humanId)]?.parent_id;
      const parentRow = parent === undefined || parent === null
        ? bandEnd
        : (rowByActivity[keyFor(parent)] ?? bandEnd);
      const humanEnd = layoutHumanSubtree(humanId, parentRow + 1, threadId);
      bandEnd = Math.max(bandEnd, humanEnd);
    }

    lanes.push({
      actorKey: flame.actorKey,
      actorName: flame.actorName,
      depth,
      parentActivityId: flame.parentActivityId,
      parentLaneRootId: parentLaneRootId(flame, rootIdByActivity),
      rootActivityId: flame.rootActivityId,
      rowStart: startRow,
      rowEnd: bandEnd,
      threadId,
    });

    // Leave one empty row under top-level agent bands so sibling agents don't
    // stack flush; nested (depth > 0) lanes stay tight inside the parent.
    if (depth === 0) {
      const bandInterval = unionIntervals(
        Object.values(activities)
          .filter(activity => {
            const row = rowByActivity[keyFor(activity.id)];
            return row !== undefined
              && row >= startRow
              && row <= bandEnd
              && String(activity.thread_id) === String(threadId);
          })
          .map(activity => activityInterval(activity.id, blocks)),
      );
      if (Number.isFinite(bandInterval.start)) {
        occupyRows(threadId, bandEnd + 1, bandEnd + 1, bandInterval);
      }
    }

    return bandEnd;
  };

  const layoutHumanSubtree = (
    activityId: EntityId,
    minRow: number,
    threadId: EntityId,
  ): number => {
    const interval = activityInterval(activityId, blocks);
    const row = firstFreeRow(threadId, minRow, interval, 1);
    rowByActivity[keyFor(activityId)] = row;
    occupyRows(threadId, row, row, interval);

    const children = sortByStart(childrenByParent.get(keyFor(activityId)) ?? []);
    let maxEnd = row;

    for (const childId of children) {
      const child = activities[keyFor(childId)];
      if (!child) continue;

      const flame = flameByRoot[keyFor(childId)];
      if (flame) {
        const end = layoutLane(flame, row + 1, threadId, 0);
        maxEnd = Math.max(maxEnd, end);
        continue;
      }

      if (actorKey(child) === HUMAN_ACTOR_KEY) {
        const end = layoutHumanSubtree(childId, row + 1, threadId);
        maxEnd = Math.max(maxEnd, end);
      }
    }

    return maxEnd;
  };

  for (const [threadKey, roots] of threadRoots) {
    const threadId = activities[keyFor(roots[0])]?.thread_id;
    if (threadId === undefined || threadId === null) continue;

    let maxEnd = -1;

    for (const rootId of sortByStart(roots)) {
      const root = activities[keyFor(rootId)];
      if (!root) continue;
      const flame = flameByRoot[keyFor(rootId)];
      if (flame) {
        const end = layoutLane(flame, 0, threadId, 0);
        maxEnd = Math.max(maxEnd, end);
        continue;
      }
      if (actorKey(root) === HUMAN_ACTOR_KEY) {
        const end = layoutHumanSubtree(rootId, 0, threadId);
        maxEnd = Math.max(maxEnd, end);
      }
    }

    maxRowsByThread[threadKey] = Math.max(0, maxEnd + 1);
  }

  // Ensure every activity with blocks has a row fallback.
  for (const activity of Object.values(activities)) {
    const key = keyFor(activity.id);
    if (key in rowByActivity) continue;
    if (activity.thread_id === undefined || activity.thread_id === null) continue;
    rowByActivity[key] = 0;
    const threadKey = keyFor(activity.thread_id);
    maxRowsByThread[threadKey] = Math.max(maxRowsByThread[threadKey] ?? 0, 1);
  }

  return {
    flames,
    lanes,
    rowByActivity,
    rootIdByActivity,
    maxRowsByThread,
  };
}
