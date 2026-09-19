import type { Activity } from '../types/Activity';
import type { EntityId } from '../types/ids';
import type { TraceBlock } from './processTrace';

/**
 * Actor-flame projection and lane layout (presentation only).
 *
 * Chrome vocabulary — **activity block**, **rail**, **wash**, **gutter**, **fork** —
 * and labeling rules (display name vs model-provider color, sustained wash) live in
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
  /** Display row for each activity id (first segment; use rowByBlock for drawing). */
  rowByActivity: Record<string, number>;
  /** Display row for each lifecycle segment (`blockLayoutKey`). */
  rowByBlock: Record<string, number>;
  rootIdByActivity: Record<string, EntityId | null>;
  maxRowsByThread: Record<string, number>;
}

/** Contiguous display-row run painted as one wash rectangle. */
export interface ActorWashRowRange {
  rowEnd: number;
  rowStart: number;
}

/**
 * A single wash rectangle clipped to the (rows × time) an agent actually
 * occupies, so the wash never covers a row at a time owned by another actor.
 */
export interface ActorWashRect {
  rowStart: number;
  rowEnd: number;
  startTime: number;
  endTime: number | null;
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
  /** Inclusive max row across wash ranges (rail/label fallback). */
  rowEnd: number;
  /** Inclusive min row across wash ranges (rail/label fallback). */
  rowStart: number;
  startTime: number;
  threadId: EntityId;
  /**
   * Occupied row runs for the wash. Same-agent owned work shares one time
   * span; unused rows between a suspend and a later resume stay unwashed.
   */
  washRowRanges: ActorWashRowRange[];
  /**
   * Wash rectangles clipped to the actual (row × time) cells the agent owns.
   * A single agent still reads as one presence (one rail/label), but the paint
   * only covers where the agent actually was — so an interleaved neighbour or
   * human block sharing a row is never washed over.
   */
  washRects: ActorWashRect[];
}

function keyFor(id: EntityId): string {
  return String(id);
}

/** Stable key for a lifecycle segment in `rowByBlock`. */
export function blockLayoutKey(
  block: Pick<TraceBlock, 'activity_id' | 'beginning' | 'startTime'>,
): string {
  return `${block.activity_id}@${block.startTime}@${block.beginning}`;
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

type TimeInterval = { start: number; end: number };

/** Collapse sorted unique rows into inclusive contiguous runs. */
export function contiguousRowRanges(rows: number[]): ActorWashRowRange[] {
  const unique = [...new Set(rows.filter(row => Number.isFinite(row)))].sort((left, right) => left - right);
  if (!unique.length) return [];

  const ranges: ActorWashRowRange[] = [];
  let rowStart = unique[0]!;
  let rowEnd = unique[0]!;
  for (const row of unique.slice(1)) {
    if (row === rowEnd + 1) {
      rowEnd = row;
      continue;
    }
    ranges.push({ rowStart, rowEnd });
    rowStart = row;
    rowEnd = row;
  }
  ranges.push({ rowStart, rowEnd });
  return ranges;
}

/**
 * Wash rectangles for one agent group. Because each agent occupies its own
 * contiguous band (its rows are exclusive to it for its whole span), the wash is
 * painted as a solid envelope over the agent's own rows: every contiguous run of
 * the agent's owned rows becomes one rectangle spanning the agent's full time
 * range. This *contains* stacked simultaneous same-agent work under one wash,
 * rather than stair-stepping around each nested block.
 *
 * Only the agent's own roots count as owned, so a delegated child's rows are not
 * part of the envelope — they break the run and stay the child's own wash. Every
 * row is therefore washed by at most one agent and washes never overlap.
 */
function washRectsForGroup(
  rootActivityIds: EntityId[],
  layout: ActorLaneLayout,
  blocks: TraceBlock[],
): ActorWashRect[] {
  const rootSet = new Set(rootActivityIds.map(String));

  const ownsBlock = (activityId: EntityId): boolean => {
    const root = layout.rootIdByActivity[String(activityId)];
    if (root === null || root === undefined) return false;
    return rootSet.has(String(root));
  };

  const ownedRows = new Set<number>();
  let spanStart = Number.POSITIVE_INFINITY;
  let spanEnd = Number.NEGATIVE_INFINITY;
  for (const block of blocks) {
    if (!ownsBlock(block.activity_id)) continue;
    const row = layout.rowByBlock[blockLayoutKey(block)];
    if (row === undefined) continue;
    ownedRows.add(row);
    spanStart = Math.min(spanStart, block.startTime);
    if (block.endTime === undefined) {
      spanEnd = Number.POSITIVE_INFINITY;
    } else if (spanEnd !== Number.POSITIVE_INFINITY) {
      spanEnd = Math.max(spanEnd, block.endTime);
    }
  }

  if (!ownedRows.size || !Number.isFinite(spanStart)) return [];
  const startTime = spanStart;
  const endTime = Number.isFinite(spanEnd) ? spanEnd : null;

  // One rectangle per contiguous run of owned rows (a delegated child's row, if
  // any, breaks the run so its own wash owns it).
  const sortedRows = [...ownedRows].sort((left, right) => left - right);
  const rects: ActorWashRect[] = [];
  let runStart = sortedRows[0]!;
  let runEnd = sortedRows[0]!;
  const flush = () => rects.push({ rowStart: runStart, rowEnd: runEnd, startTime, endTime });
  for (const row of sortedRows.slice(1)) {
    if (row === runEnd + 1) {
      runEnd = row;
    } else {
      flush();
      runStart = row;
      runEnd = row;
    }
  }
  flush();

  return rects;
}

/**
 * One sustained wash per agent on a thread (ADR-005). Same-actor owned work —
 * including independent `--root` flames and idle gaps — shares one time span.
 * Unused rows between a suspend and a later resume stay unwashed.
 *
 * `gridTickMs` is accepted for call-site compatibility; wash coalescing is no
 * longer zoom-dependent.
 */
export function coalesceActorLaneChrome(
  layout: ActorLaneLayout,
  blocks: TraceBlock[],
  _gridTickMs: number = 0,
  _nowMs: number = Date.now(),
): ActorLaneChrome[] {
  const groups = new Map<string, ActorLaneBand[]>();
  for (const lane of layout.lanes) {
    const key = [
      String(lane.threadId),
      lane.actorKey,
      String(lane.parentLaneRootId ?? ''),
      String(lane.depth),
    ].join('|');
    const list = groups.get(key) ?? [];
    list.push(lane);
    groups.set(key, list);
  }

  const chrome: ActorLaneChrome[] = [];
  for (const lanes of groups.values()) {
    const first = lanes[0]!;
    const rootActivityIds = lanes.map(lane => lane.rootActivityId);
    const bounds = laneTimeBoundsForRoots(rootActivityIds, layout.rootIdByActivity, blocks);
    if (!bounds || !Number.isFinite(bounds.startTime)) continue;

    const washRects = washRectsForGroup(rootActivityIds, layout, blocks);
    if (!washRects.length) {
      washRects.push({
        rowStart: Math.min(...lanes.map(lane => lane.rowStart)),
        rowEnd: Math.max(...lanes.map(lane => lane.rowEnd)),
        startTime: bounds.startTime,
        endTime: bounds.endTime,
      });
    }
    // Row ranges are derived from the painted rectangles so the vertical extent
    // never claims a row the agent does not actually occupy.
    const washRowRanges = contiguousRowRanges(
      washRects.flatMap(rect => {
        const rows: number[] = [];
        for (let row = rect.rowStart; row <= rect.rowEnd; row += 1) rows.push(row);
        return rows;
      }),
    );
    rootActivityIds.sort((left, right) => Number(left) - Number(right));

    chrome.push({
      actorKey: first.actorKey,
      actorName: first.actorName,
      depth: first.depth,
      endTime: bounds.endTime,
      parentLaneRootId: first.parentLaneRootId,
      providerKey: modelProviderFromAgentId(first.actorKey),
      rootActivityIds,
      rowEnd: Math.max(...washRowRanges.map(range => range.rowEnd)),
      rowStart: Math.min(...washRowRanges.map(range => range.rowStart)),
      startTime: bounds.startTime,
      threadId: first.threadId,
      washRowRanges,
      washRects,
    });
  }

  return chrome.sort((left, right) => left.depth - right.depth
    || left.startTime - right.startTime
    || left.rowStart - right.rowStart);
}

function parentLaneRootId(
  flame: ActorFlame,
  rootIdByActivity: Record<string, EntityId | null>,
): EntityId | null {
  if (flame.parentActivityId === null) return null;
  return rootIdByActivity[String(flame.parentActivityId)] ?? null;
}

function intervalsOverlap(left: TimeInterval, right: TimeInterval): boolean {
  return left.start < right.end && right.start < left.end;
}

function anyIntervalOverlap(
  existing: TimeInterval[],
  candidates: TimeInterval[],
): boolean {
  return candidates.some(candidate =>
    existing.some(entry => intervalsOverlap(entry, candidate)));
}


/**
 * Nested actor-sublane layout (Variant 1): each agent boundary opens a labeled
 * vertical lane; same-actor work nests inside; delegated agents nest inside the
 * parent actor's band. Human work is the thread's primary stack at the top;
 * every agent band sits strictly below that stack.
 *
 * Lifecycle segments pack independently in start-time order. Nested children
 * sit under their parent only while that parent still covers them in time.
 * Non-overlapping siblings reuse a row (classic flame chart). A resume stacks
 * directly under the overlapping sibling root, not under that sibling's nested
 * children. Concurrent sibling agent flames keep a spacer row.
 */
export function projectActorLaneLayout(
  activities: ActivityRecord,
  blocks: TraceBlock[],
): ActorLaneLayout {
  const { flames, rootIdByActivity } = projectActorFlameProjection(activities);
  const rowByActivity: Record<string, number> = {};
  const rowByBlock: Record<string, number> = {};
  const lanes: ActorLaneBand[] = [];
  const maxRowsByThread: Record<string, number> = {};

  const flameByRoot = Object.fromEntries(
    flames.map(flame => [String(flame.rootActivityId), flame]),
  );

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
    intervals: TimeInterval[],
    rowCount = 1,
  ): number => {
    const occupied = occupiedRows(threadId);
    let row = Math.max(0, minRow);
    for (;;) {
      let fits = true;
      for (let offset = 0; offset < rowCount; offset += 1) {
        const existing = occupied.get(row + offset) ?? [];
        if (anyIntervalOverlap(existing, intervals)) {
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
    intervals: TimeInterval[],
  ) => {
    const finite = intervals.filter(interval => Number.isFinite(interval.start));
    if (!finite.length) return;
    const occupied = occupiedRows(threadId);
    for (let row = rowStart; row <= rowEnd; row += 1) {
      const entries = occupied.get(row) ?? [];
      entries.push(...finite);
      occupied.set(row, entries);
    }
  };

  const forestDepth = (activityId: EntityId): number => {
    let depth = 0;
    let current = activities[keyFor(activityId)];
    const seen = new Set<string>();
    while (current && current.parent_id != null && !seen.has(keyFor(current.id))) {
      seen.add(keyFor(current.id));
      depth += 1;
      current = activities[keyFor(current.parent_id)];
    }
    return depth;
  };

  const flameDepth = (flame: ActorFlame): number => {
    let depth = 0;
    let parentRoot = parentLaneRootId(flame, rootIdByActivity);
    const seen = new Set<string>();
    while (parentRoot !== null && !seen.has(String(parentRoot))) {
      seen.add(String(parentRoot));
      depth += 1;
      const parent = flameByRoot[String(parentRoot)];
      if (!parent) break;
      parentRoot = parentLaneRootId(parent, rootIdByActivity);
    }
    return depth;
  };

  const depth0Owner = (activityId: EntityId): EntityId | null => {
    let current = activities[keyFor(activityId)];
    const seen = new Set<string>();
    while (current && !seen.has(keyFor(current.id))) {
      seen.add(keyFor(current.id));
      const root = rootIdByActivity[keyFor(current.id)];
      if (root !== null && root !== undefined) {
        let ownerFlame: ActorFlame | undefined = flameByRoot[keyFor(root)];
        while (ownerFlame) {
          const parentRoot = parentLaneRootId(ownerFlame, rootIdByActivity);
          if (parentRoot === null) return ownerFlame.rootActivityId;
          ownerFlame = flameByRoot[keyFor(parentRoot)];
        }
        return root;
      }
      const parentId = current.parent_id ?? null;
      if (parentId === null) return null;
      current = activities[keyFor(parentId)];
    }
    return null;
  };

  const coveringParentBlock = (parentId: EntityId, childStart: number): TraceBlock | null => {
    const parentBlocks = blocks
      .filter(block => String(block.activity_id) === String(parentId))
      .sort((left, right) => left.startTime - right.startTime);
    return parentBlocks.find(block =>
      block.startTime <= childStart
      && (block.endTime === undefined || block.endTime >= childStart))
      ?? null;
  };

  const blocksByThread = new Map<string, TraceBlock[]>();
  for (const block of blocks) {
    const activity = activities[keyFor(block.activity_id)];
    if (!activity || activity.thread_id === undefined || activity.thread_id === null) continue;
    const threadKey = keyFor(activity.thread_id);
    const list = blocksByThread.get(threadKey) ?? [];
    list.push(block);
    blocksByThread.set(threadKey, list);
  }

  for (const [threadKey, threadBlocks] of blocksByThread) {
    const threadId = activities[keyFor(threadBlocks[0]!.activity_id)]?.thread_id;
    if (threadId === undefined || threadId === null) continue;

    const ordered = threadBlocks.slice().sort((left, right) =>
      left.startTime - right.startTime
      || forestDepth(left.activity_id) - forestDepth(right.activity_id)
      || Number(left.activity_id) - Number(right.activity_id));

    // Group every block under its top-level actor (human work → the shared
    // human owner). Each owner gets a contiguous band of rows so an agent's
    // work never shares a row with another actor — one clean, non-overlapping
    // wash per agent, and a delegated child sits contiguously inside its
    // parent's band rather than forcing a hole or an overlap.
    // Band owner = the top-level actor (by actor key), so every independent
    // root of the same agent shares one band and a delegated child folds into
    // its parent agent's band.
    const ownerKeyOf = (activityId: EntityId): string => {
      const ownerRoot = depth0Owner(activityId);
      if (ownerRoot === null) return HUMAN_ACTOR_KEY;
      const ownerActivity = activities[keyFor(ownerRoot)];
      return ownerActivity ? actorKey(ownerActivity) : HUMAN_ACTOR_KEY;
    };

    const ownerFirstStart = new Map<string, number>();
    for (const block of ordered) {
      const key = ownerKeyOf(block.activity_id);
      const prev = ownerFirstStart.get(key) ?? Number.POSITIVE_INFINITY;
      ownerFirstStart.set(key, Math.min(prev, block.startTime));
    }

    // Human base stack first (top of the thread), then agents in order of
    // first appearance. Agent bands never share a row with that human stack.
    const ownerOrder = [...ownerFirstStart.keys()].sort((left, right) => {
      if (left === HUMAN_ACTOR_KEY) return right === HUMAN_ACTOR_KEY ? 0 : -1;
      if (right === HUMAN_ACTOR_KEY) return 1;
      return (ownerFirstStart.get(left)! - ownerFirstStart.get(right)!)
        || left.localeCompare(right);
    });

    const nestedMinRow = (
      block: TraceBlock,
      ownerKey: string,
      rowOf: (parentBlock: TraceBlock) => number | undefined,
    ): number => {
      const activity = activities[keyFor(block.activity_id)];
      const parentId = activity?.parent_id ?? null;
      const parentSameOwner = parentId !== null
        && String(activities[keyFor(parentId)]?.thread_id) === threadKey
        && ownerKeyOf(parentId) === ownerKey;
      if (!parentSameOwner || parentId === null) return 0;
      const parentBlock = coveringParentBlock(parentId, block.startTime);
      const parentRow = parentBlock ? rowOf(parentBlock) : undefined;
      return parentRow === undefined ? 0 : parentRow + 1;
    };

    let humanFloor = 0;

    for (const ownerKey of ownerOrder) {
      const ownerBlocks = ordered.filter(block => ownerKeyOf(block.activity_id) === ownerKey);
      if (!ownerBlocks.length) continue;

      if (ownerKey === HUMAN_ACTOR_KEY) {
        // Human base stack: classic time-based packing, rows reused across time.
        let maxHumanRow = -1;
        for (const block of ownerBlocks) {
          const interval: TimeInterval = {
            start: block.startTime,
            end: block.endTime ?? Number.POSITIVE_INFINITY,
          };
          const minRow = nestedMinRow(block, ownerKey,
            parentBlock => rowByBlock[blockLayoutKey(parentBlock)]);
          const row = firstFreeRow(threadId, minRow, [interval], 1);
          rowByBlock[blockLayoutKey(block)] = row;
          occupyRows(threadId, row, row, [interval]);
          maxHumanRow = Math.max(maxHumanRow, row);
        }
        humanFloor = maxHumanRow + 1;
        continue;
      }

      // Agent swimlane: lay the band out relative to its own base, then place
      // the whole band on the highest row at or below the human stack where
      // its time span collides with no other agent band (a delegated child
      // nests inside on the row below its parent).
      const localOccupied = new Map<number, TimeInterval[]>();
      const relativeRow: Record<string, number> = {};
      let height = 0;
      let spanStart = Number.POSITIVE_INFINITY;
      let spanEnd = Number.NEGATIVE_INFINITY;

      for (const block of ownerBlocks) {
        const interval: TimeInterval = {
          start: block.startTime,
          end: block.endTime ?? Number.POSITIVE_INFINITY,
        };
        spanStart = Math.min(spanStart, interval.start);
        spanEnd = interval.end === Number.POSITIVE_INFINITY
          ? Number.POSITIVE_INFINITY
          : Math.max(spanEnd, interval.end);

        const minRel = nestedMinRow(block, ownerKey,
          parentBlock => relativeRow[blockLayoutKey(parentBlock)]);
        let rel = Math.max(0, minRel);
        while (anyIntervalOverlap(localOccupied.get(rel) ?? [], [interval])) rel += 1;
        relativeRow[blockLayoutKey(block)] = rel;
        const list = localOccupied.get(rel) ?? [];
        list.push(interval);
        localOccupied.set(rel, list);
        height = Math.max(height, rel + 1);
      }

      if (!Number.isFinite(spanStart)) continue;
      // Reserve the band's full span across all its rows so the agent stays one
      // exclusive block (its sustained wash never fragments), while agents whose
      // spans do not overlap still share rows with each other — always below
      // the human stack.
      const span: TimeInterval = { start: spanStart, end: spanEnd };
      const base = firstFreeRow(threadId, humanFloor, [span], height);
      for (const block of ownerBlocks) {
        const rel = relativeRow[blockLayoutKey(block)];
        if (rel !== undefined) rowByBlock[blockLayoutKey(block)] = base + rel;
      }
      occupyRows(threadId, base, base + height - 1, [span]);
    }

    const threadFlames = flames.filter(flame => {
      const root = activities[keyFor(flame.rootActivityId)];
      return root !== undefined && String(root.thread_id) === threadKey;
    });

    const laneByRoot: Record<string, ActorLaneBand> = {};
    const byDepthDesc = threadFlames.slice().sort((left, right) =>
      flameDepth(right) - flameDepth(left)
      || Number(left.rootActivityId) - Number(right.rootActivityId));

    for (const flame of byDepthDesc) {
      const sameActorRows: number[] = [];
      for (const block of threadBlocks) {
        if (String(rootIdByActivity[keyFor(block.activity_id)]) !== String(flame.rootActivityId)) {
          continue;
        }
        const row = rowByBlock[blockLayoutKey(block)];
        if (row !== undefined) sameActorRows.push(row);
      }
      const nestedEnds = Object.values(laneByRoot)
        .filter(lane => String(lane.parentLaneRootId) === String(flame.rootActivityId))
        .map(lane => lane.rowEnd);
      const rowStart = sameActorRows.length ? Math.min(...sameActorRows) : 0;
      const rowEnd = Math.max(rowStart, ...sameActorRows, ...nestedEnds);
      laneByRoot[keyFor(flame.rootActivityId)] = {
        actorKey: flame.actorKey,
        actorName: flame.actorName,
        depth: flameDepth(flame),
        parentActivityId: flame.parentActivityId,
        parentLaneRootId: parentLaneRootId(flame, rootIdByActivity),
        rootActivityId: flame.rootActivityId,
        rowStart,
        rowEnd,
        threadId,
      };
    }

    const lanesInOrder = threadFlames.slice().sort((left, right) =>
      activityStartTime(left.rootActivityId, blocks)
      - activityStartTime(right.rootActivityId, blocks)
      || Number(left.rootActivityId) - Number(right.rootActivityId));
    for (const flame of lanesInOrder) {
      const lane = laneByRoot[keyFor(flame.rootActivityId)];
      if (lane) lanes.push(lane);
    }

    let maxEnd = -1;
    for (const block of threadBlocks) {
      const row = rowByBlock[blockLayoutKey(block)];
      if (row !== undefined) maxEnd = Math.max(maxEnd, row);
    }
    maxRowsByThread[threadKey] = Math.max(0, maxEnd + 1);
  }

  for (const activity of Object.values(activities)) {
    const mine = blocks
      .filter(block => String(block.activity_id) === String(activity.id))
      .sort((left, right) => left.startTime - right.startTime);
    if (mine.length) {
      const firstRow = rowByBlock[blockLayoutKey(mine[0]!)];
      if (firstRow !== undefined) rowByActivity[keyFor(activity.id)] = firstRow;
    }
  }

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
    rowByBlock,
    rootIdByActivity,
    maxRowsByThread,
  };
}
