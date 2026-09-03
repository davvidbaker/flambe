import uniq from 'lodash/uniq';

import type { Activity, ActivityStatus } from '../types/Activity';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';
import type { EventPhase, TraceEvent } from '../types/TraceEvent';

export interface TraceBlock {
  activity_id: EntityId;
  beginning: EventPhase;
  endMessage?: string;
  endTime?: number;
  ending?: EventPhase;
  events: EntityId[];
  level: number;
  startMessage?: string;
  startTime: number;
}

export interface ThreadLevel {
  current: number;
  max: number;
}

export interface ProcessedActivity extends Activity {
  categories: EntityId[];
  events: EntityId[];
  suspendedChildren: EntityId[];
  status?: ActivityStatus;
}

export interface ProcessedTrace {
  activities: Record<string, ProcessedActivity>;
  blocks: TraceBlock[];
  events: TraceEvent[];
  lastCategory_id?: EntityId | null;
  lastThread_id?: EntityId;
  max: number;
  min: number;
  threadLevels: Record<string, ThreadLevel>;
  threads: Record<string, Thread>;
}

const keyFor = (id: EntityId): string => String(id);

export function lastActivityBlock(
  blocks: TraceBlock[],
  activity_id: EntityId,
): TraceBlock | undefined {
  return [...blocks].reverse().find(block => block.activity_id === activity_id);
}

export function removeActivity(
  activity_id: EntityId,
  thread_id: EntityId,
  threadOpenActivities: Record<string, EntityId[]>,
): Record<string, EntityId[]> {
  const key = keyFor(thread_id);
  return {
    ...threadOpenActivities,
    [key]: (threadOpenActivities[key] ?? []).filter(id => id !== activity_id),
  };
}

function decrementThreadLevel(level: number): number {
  return Math.max(0, level - 1);
}

function isDescendantActivity(
  activity_id: EntityId,
  ancestor_id: EntityId,
  activities: Record<string, ProcessedActivity>,
): boolean {
  const seen = new Set<EntityId>();
  let parentId = activities[keyFor(activity_id)]?.parent_id;

  while (parentId !== undefined && parentId !== null && !seen.has(parentId)) {
    if (parentId === ancestor_id) return true;
    seen.add(parentId);
    parentId = activities[keyFor(parentId)]?.parent_id;
  }

  return false;
}

function activityLevel(activity: Activity, activities: Record<string, ProcessedActivity>): number {
  const seen = new Set<EntityId>([activity.id]);
  let depth = 0;
  let parentId = activity.parent_id;

  while (parentId !== undefined && parentId !== null && !seen.has(parentId)) {
    depth += 1;
    seen.add(parentId);
    parentId = activities[keyFor(parentId)]?.parent_id;
  }

  return depth;
}

function displayLevel(
  activity: Activity,
  activities: Record<string, ProcessedActivity>,
  blocks: TraceBlock[],
): number {
  const minimumLevel = activityLevel(activity, activities);
  const occupiedLevels = new Set(
    blocks
      .filter(block =>
        block.endTime === undefined
        && activities[keyFor(block.activity_id)]?.thread_id === activity.thread_id)
      .map(block => block.level),
  );

  let level = minimumLevel;
  while (occupiedLevels.has(level)) level += 1;
  return level;
}

/** A block can have at most a beginning and an ending event. */
export function terminateBlock(
  blocks: TraceBlock[],
  activity_id: EntityId,
  timestamp: number,
  phase: EventPhase,
  message = '',
  event_id?: EntityId,
): TraceBlock[] {
  const block = lastActivityBlock(blocks, activity_id);
  if (!block) return blocks;

  block.endTime = timestamp;
  block.ending = phase;
  block.endMessage = message;
  if (event_id !== undefined) block.events.push(event_id);
  return blocks;
}

function processTrace(trace: TraceEvent[] = [], threads: Thread[] = []): ProcessedTrace {
  const threadLevels: Record<string, ThreadLevel> = {};
  const threadOpenActivities: Record<string, EntityId[]> = {};
  const threadsObject: Record<string, Thread> = {};

  threads.forEach(thread => {
    const key = keyFor(thread.id);
    threadsObject[key] = thread;
    threadLevels[key] = { current: 0, max: 0 };
    threadOpenActivities[key] = [];
  });

  if (trace.length === 0) {
    const min = Date.now();
    return {
      activities: {}, blocks: [], events: trace, max: min + 1000, min,
      threadLevels, threads: threadsObject,
    };
  }

  const orderedTrace = [...trace].sort((left, right) => left.timestamp - right.timestamp);
  const activities: Record<string, ProcessedActivity> = {};
  const blocks: TraceBlock[] = [];
  let leftTime = orderedTrace[0].timestamp;
  let rightTime = orderedTrace[0].timestamp;
  let lastCategory_id: EntityId | null | undefined;
  let lastThread_id: EntityId | undefined;

  orderedTrace.forEach((event, index) => {
    const sourceActivity = event.activity;
    if (!sourceActivity) return;

    const thread_id = sourceActivity.thread?.id ?? sourceActivity.thread_id;
    if (thread_id === undefined) return;

    const threadKey = keyFor(thread_id);
    const activityKey = keyFor(sourceActivity.id);
    const threadLevel = threadLevels[threadKey] ?? { current: 0, max: 0 };
    threadLevels[threadKey] = threadLevel;
    threadOpenActivities[threadKey] ??= [];

    const activity = activities[activityKey] ?? {
      ...sourceActivity,
      categories: [],
      events: [],
      suspendedChildren: [],
    };
    activities[activityKey] = activity;
    activity.events.push(event.id);
    activity.description ??= sourceActivity.description;
    activity.parent_id ??= sourceActivity.parent_id;
    activity.categories = uniq([...activity.categories, ...sourceActivity.categories]);

    switch (event.phase) {
      case 'S': {
        if (activity.status === 'suspended' || activity.status === 'parent_suspended') break;
        terminateBlock(blocks, sourceActivity.id, event.timestamp, event.phase, event.message, event.id);
        threadLevel.current = decrementThreadLevel(threadLevel.current);
        activity.status = 'suspended';
        const remaining = removeActivity(sourceActivity.id, thread_id, threadOpenActivities);
        threadOpenActivities[threadKey] = remaining[threadKey];

        [...threadOpenActivities[threadKey]].forEach(childId => {
          if (!isDescendantActivity(childId, sourceActivity.id, activities)) return;
          activity.suspendedChildren.push(childId);
          const child = activities[keyFor(childId)];
          if (child) child.status = 'parent_suspended';
          terminateBlock(blocks, childId, event.timestamp, event.phase, event.message);
          threadLevel.current = decrementThreadLevel(threadLevel.current);
          threadOpenActivities[threadKey] = removeActivity(childId, thread_id, threadOpenActivities)[threadKey];
        });
        break;
      }
      case 'X':
      case 'R': {
        if (event.phase === 'R' && (activity.status === 'parent_suspended' || activity.status === 'active')) break;
        const level = displayLevel(activity, activities, blocks);
        blocks.push({ activity_id: sourceActivity.id, beginning: event.phase, events: [event.id], level, startMessage: event.message, startTime: event.timestamp });
        threadLevel.current += 1;
        threadLevel.max = Math.max(level + 1, threadLevel.max);
        if (event.phase === 'R') {
          activity.suspendedChildren.forEach(childId => {
            const child = activities[keyFor(childId)];
            if (child) child.status = 'active';
            const childLevel = displayLevel(child, activities, blocks);
            blocks.push({ activity_id: childId, beginning: event.phase, events: [event.id], level: childLevel, startTime: event.timestamp });
            threadLevel.current += 1;
            threadLevel.max = Math.max(childLevel + 1, threadLevel.max);
            threadOpenActivities[threadKey].push(childId);
          });
          activity.suspendedChildren = [];
        }
        threadOpenActivities[threadKey].push(sourceActivity.id);
        activity.status = 'active';
        break;
      }
      case 'Q':
      case 'B':
        activity.startTime = event.timestamp;
        activity.status = 'active';
        activity.name = sourceActivity.name;
        activity.weight = sourceActivity.weight;
        activity.description = sourceActivity.description;
        activity.thread_id = thread_id;
        activity.flavor = event.phase === 'Q' ? 'question' : 'task';
        const level = displayLevel(activity, activities, blocks);
        blocks.push({ activity_id: sourceActivity.id, beginning: event.phase, events: [event.id], level, startMessage: event.message, startTime: event.timestamp });
        threadOpenActivities[threadKey].push(sourceActivity.id);
        threadLevel.current += 1;
        threadLevel.max = Math.max(level + 1, threadLevel.max);
        break;
      case 'E':
      case 'J':
      case 'V': {
        if (activity.status === 'suspended') {
          activity.status = 'complete';
          break;
        }
        activity.endTime = event.timestamp;
        activity.status = 'complete';
        [...threadOpenActivities[threadKey]].forEach(childId => {
          const child = activities[keyFor(childId)];
          if (!child || !isDescendantActivity(childId, sourceActivity.id, activities)) return;
          terminateBlock(blocks, childId, event.timestamp, event.phase, event.message, event.id);
          threadLevel.current = decrementThreadLevel(threadLevel.current);
          child.status = 'complete';
          threadOpenActivities[threadKey] = removeActivity(childId, thread_id, threadOpenActivities)[threadKey];
        });
        terminateBlock(blocks, sourceActivity.id, event.timestamp, event.phase, event.message, event.id);
        threadLevel.current = decrementThreadLevel(threadLevel.current);
        threadOpenActivities[threadKey] = removeActivity(sourceActivity.id, thread_id, threadOpenActivities)[threadKey];
        break;
      }
      default:
        break;
    }

    rightTime = Math.max(rightTime, event.timestamp);
    leftTime = Math.min(leftTime, event.timestamp);
    lastCategory_id = activity.categories[0] ?? null;
    if (index === orderedTrace.length - 1) lastThread_id = activity.thread_id;
  });

  return { activities, blocks, events: trace, lastCategory_id, lastThread_id, max: rightTime, min: leftTime, threadLevels, threads: threadsObject };
}

export default processTrace;
