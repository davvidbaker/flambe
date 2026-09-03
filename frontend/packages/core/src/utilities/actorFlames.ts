import type { Activity } from '../types/Activity';
import type { EntityId } from '../types/ids';
import type { TraceBlock } from './processTrace';

const AGENT_ACCENTS = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#0891b2'];
const HUMAN_ACTOR_KEY = 'human';

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

export function actorAccentColor(key: string): string {
  if (key === HUMAN_ACTOR_KEY) return '#6b7280';

  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = ((hash << 5) - hash + key.charCodeAt(index)) | 0;
  }
  return AGENT_ACCENTS[Math.abs(hash) % AGENT_ACCENTS.length];
}

function parentLaneRootId(
  flame: ActorFlame,
  rootIdByActivity: Record<string, EntityId | null>,
): EntityId | null {
  if (flame.parentActivityId === null) return null;
  return rootIdByActivity[String(flame.parentActivityId)] ?? null;
}

/**
 * Nested actor-sublane layout (Variant 1): each agent boundary opens a labeled
 * vertical lane; same-actor work nests inside; delegated agents nest inside the
 * parent actor's band. Human work stays in the thread's primary stack.
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

  const layoutLane = (
    flame: ActorFlame,
    startRow: number,
    threadId: EntityId,
    depth: number,
  ): number => {
    const sameActorIds = Object.values(activities)
      .filter(activity =>
        String(activity.thread_id) === String(threadId)
        && rootIdByActivity[keyFor(activity.id)] === flame.rootActivityId)
      .map(activity => activity.id);

    let maxSameRow = startRow;
    for (const activityId of sameActorIds) {
      const row = startRow + sameActorLocalDepth(activityId, flame.rootActivityId);
      rowByActivity[keyFor(activityId)] = row;
      maxSameRow = Math.max(maxSameRow, row);
    }

    const nestedFlames = flames
      .filter(candidate => parentLaneRootId(candidate, rootIdByActivity) === flame.rootActivityId)
      .slice()
      .sort((left, right) =>
        activityStartTime(left.rootActivityId, blocks)
        - activityStartTime(right.rootActivityId, blocks));

    let cursor = maxSameRow + 1;
    let bandEnd = maxSameRow;

    for (const nested of nestedFlames) {
      const parentRow = nested.parentActivityId === null
        ? startRow
        : (rowByActivity[keyFor(nested.parentActivityId)] ?? startRow);
      const nestStart = Math.max(cursor, parentRow + 1);
      const nestEnd = layoutLane(nested, nestStart, threadId, depth + 1);
      cursor = nestEnd + 1;
      bandEnd = Math.max(bandEnd, nestEnd);
    }

    // Human children that hang directly under this lane's activities (actor boundary back to human).
    const humanChildren = sameActorIds.flatMap(activityId =>
      sortByStart(childrenByParent.get(keyFor(activityId)) ?? [])
        .filter(childId => actorKey(activities[keyFor(childId)] ?? { agent_id: null }) === HUMAN_ACTOR_KEY));

    for (const humanId of humanChildren) {
      const parent = activities[keyFor(humanId)]?.parent_id;
      const parentRow = parent === undefined || parent === null
        ? maxSameRow
        : (rowByActivity[keyFor(parent)] ?? maxSameRow);
      const humanStart = Math.max(cursor, parentRow + 1);
      const humanEnd = layoutHumanSubtree(humanId, humanStart, threadId);
      cursor = humanEnd + 1;
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

    return bandEnd;
  };

  const layoutHumanSubtree = (
    activityId: EntityId,
    startRow: number,
    threadId: EntityId,
  ): number => {
    rowByActivity[keyFor(activityId)] = startRow;
    const children = sortByStart(childrenByParent.get(keyFor(activityId)) ?? []);
    let cursor = startRow + 1;
    let maxEnd = startRow;

    for (const childId of children) {
      const child = activities[keyFor(childId)];
      if (!child) continue;

      const flame = flameByRoot[keyFor(childId)];
      if (flame) {
        const end = layoutLane(flame, cursor, threadId, 0);
        cursor = end + 1;
        maxEnd = Math.max(maxEnd, end);
        continue;
      }

      if (actorKey(child) === HUMAN_ACTOR_KEY) {
        const end = layoutHumanSubtree(childId, cursor, threadId);
        cursor = end + 1;
        maxEnd = Math.max(maxEnd, end);
      }
    }

    return maxEnd;
  };

  for (const [threadKey, roots] of threadRoots) {
    const threadId = activities[keyFor(roots[0])]?.thread_id;
    if (threadId === undefined || threadId === null) continue;

    let cursor = 0;
    let maxEnd = -1;

    for (const rootId of sortByStart(roots)) {
      const root = activities[keyFor(rootId)];
      if (!root) continue;
      const flame = flameByRoot[keyFor(rootId)];
      if (flame) {
        const end = layoutLane(flame, cursor, threadId, 0);
        cursor = end + 1;
        maxEnd = Math.max(maxEnd, end);
        continue;
      }
      if (actorKey(root) === HUMAN_ACTOR_KEY) {
        const end = layoutHumanSubtree(rootId, cursor, threadId);
        cursor = end + 1;
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
