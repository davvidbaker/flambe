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

function washRowsForRoots(
  rootActivityIds: EntityId[],
  layout: ActorLaneLayout,
  blocks: TraceBlock[],
): number[] {
  const rootSet = new Set(rootActivityIds.map(String));
  const rows: number[] = [];

  for (const block of blocks) {
    const root = layout.rootIdByActivity[String(block.activity_id)];
    if (root === null || root === undefined || !rootSet.has(String(root))) continue;
    const row = layout.rowByBlock[blockLayoutKey(block)];
    if (row !== undefined) rows.push(row);
  }

  // Nested delegated lanes sit inside the parent actor band (ADR-004).
  for (const lane of layout.lanes) {
    if (lane.parentLaneRootId === null || !rootSet.has(String(lane.parentLaneRootId))) continue;
    for (let row = lane.rowStart; row <= lane.rowEnd; row += 1) {
      rows.push(row);
    }
  }

  return rows;
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

    const washRowRanges = contiguousRowRanges(
      washRowsForRoots(rootActivityIds, layout, blocks),
    );
    rootActivityIds.sort((left, right) => Number(left) - Number(right));
    if (!washRowRanges.length) {
      washRowRanges.push({
        rowStart: Math.min(...lanes.map(lane => lane.rowStart)),
        rowEnd: Math.max(...lanes.map(lane => lane.rowEnd)),
      });
    }

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
 * parent actor's band. Human work stays in the thread's primary stack.
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

  const threadRootId = (activityId: EntityId): EntityId => {
    let current = activities[keyFor(activityId)];
    const seen = new Set<string>();
    while (current && current.parent_id != null && !seen.has(keyFor(current.id))) {
      seen.add(keyFor(current.id));
      const parent = activities[keyFor(current.parent_id)];
      if (!parent || String(parent.thread_id) !== String(current.thread_id)) break;
      current = parent;
    }
    return current?.id ?? activityId;
  };

  const rootOwnRow = (rootId: EntityId): number => {
    let max = -1;
    for (const block of blocks) {
      if (String(block.activity_id) !== String(rootId)) continue;
      const row = rowByBlock[blockLayoutKey(block)];
      if (row !== undefined) max = Math.max(max, row);
    }
    return max;
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

    for (const block of ordered) {
      const activity = activities[keyFor(block.activity_id)];
      if (!activity) continue;
      const interval: TimeInterval = {
        start: block.startTime,
        end: block.endTime ?? Number.POSITIVE_INFINITY,
      };

      const parentId = activity.parent_id ?? null;
      const parentOnThread = parentId !== null
        && activities[keyFor(parentId)]
        && String(activities[keyFor(parentId)]?.thread_id) === threadKey;
      let minRow = 0;
      if (parentOnThread && parentId !== null) {
        const parentBlock = coveringParentBlock(parentId, block.startTime);
        if (parentBlock) {
          const parentRow = rowByBlock[blockLayoutKey(parentBlock)]
            ?? rowByActivity[keyFor(parentId)]
            ?? 0;
          minRow = parentRow + 1;
        }
      }

      const flame = flameByRoot[keyFor(activity.id)];
      const isDepth0AgentBlock = flame !== undefined
        && parentLaneRootId(flame, rootIdByActivity) === null;
      const hasEarlierSegment = ordered.some(other =>
        String(other.activity_id) === String(activity.id)
        && other.startTime < block.startTime);

      if (isDepth0AgentBlock && flame && !hasEarlierSegment) {
        let overlapMax = -1;
        for (const other of ordered) {
          const otherRow = rowByBlock[blockLayoutKey(other)];
          if (otherRow === undefined) continue;
          const otherInterval: TimeInterval = {
            start: other.startTime,
            end: other.endTime ?? Number.POSITIVE_INFINITY,
          };
          if (!intervalsOverlap(interval, otherInterval)) continue;
          const owner = depth0Owner(other.activity_id);
          if (owner === null || String(owner) === String(flame.rootActivityId)) continue;
          overlapMax = Math.max(overlapMax, otherRow);
        }
        if (overlapMax >= 0) {
          minRow = Math.max(minRow, overlapMax + 2);
        }
      }

      // Resume (or later segment) of a root sits directly under the overlapping
      // sibling root — not under that sibling's nested children.
      if (!parentOnThread && hasEarlierSegment) {
        let otherMax = -1;
        for (const other of ordered) {
          const otherRow = rowByBlock[blockLayoutKey(other)];
          if (otherRow === undefined) continue;
          const otherInterval: TimeInterval = {
            start: other.startTime,
            end: other.endTime ?? Number.POSITIVE_INFINITY,
          };
          if (!intervalsOverlap(interval, otherInterval)) continue;
          const otherRoot = threadRootId(other.activity_id);
          if (String(otherRoot) === String(activity.id)) continue;
          otherMax = Math.max(otherMax, rootOwnRow(otherRoot));
        }
        if (otherMax >= 0) {
          minRow = Math.max(minRow, otherMax + 1);
        }
      }

      const row = firstFreeRow(threadId, minRow, [interval], 1);
      rowByBlock[blockLayoutKey(block)] = row;
      occupyRows(threadId, row, row, [interval]);
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
