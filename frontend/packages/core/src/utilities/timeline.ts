import type { Activity } from '../types/Activity';
import type { EntityId } from '../types/ids';
import type { TraceBlock } from './processTrace';

type ActivityWithThread = Activity & { thread_id?: EntityId; status?: string };
type ThreadRecord = Record<string, { id?: EntityId }>;

export function getFilteredThreads<T extends { id?: EntityId }>(
  filterExcludes: EntityId[] = [],
  threads: Record<string, T>,
): Record<string, T> {
  const excluded = new Set(filterExcludes.map(String));
  return Object.fromEntries(
    Object.entries(threads).filter(([id]) => !excluded.has(id)),
  );
}

export function loadSuspendedActivityCount<T extends { id?: EntityId }>(
  activities: Record<string, ActivityWithThread>,
  threads: Record<string, T>,
): Record<string, T & { suspendedActivityCount: number }> {
  const result = Object.fromEntries(
    Object.entries(threads).map(([id, thread]) => [
      id,
      { ...thread, suspendedActivityCount: 0 },
    ]),
  ) as Record<string, T & { suspendedActivityCount: number }>;

  Object.values(activities).forEach(activity => {
    if (activity.status !== 'suspended' || activity.thread_id === undefined) return;
    const thread = result[String(activity.thread_id)];
    if (thread) thread.suspendedActivityCount += 1;
  });

  return result;
}

export const getShamefulColor = (num: number): string => `rgba(${num}, 0, 0, 0.5)`;

export function blocksForActivity(
  activity_id: EntityId,
  blocks: TraceBlock[],
): TraceBlock[] {
  return blocks.filter(block => block.activity_id === activity_id);
}

export function blocksForActivityWithIndices(
  activity_id: EntityId,
  blocks: TraceBlock[],
): Array<[number, TraceBlock]> {
  const matches: Array<[number, TraceBlock]> = [];
  blocks.forEach((block, index) => {
    if (String(block.activity_id) === String(activity_id)) matches.push([index, block]);
  });
  return matches;
}
