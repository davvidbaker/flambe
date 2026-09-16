import type { AppChartFixture } from '../storybook/fixtureTrace';
import type { Activity } from '../types/Activity';
import type { Category } from '../types/Category';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';
import type { TraceEvent } from '../types/TraceEvent';
import type { AttentionShift } from '../reducers/user';

export const TIMELINE_SNAPSHOT_VERSION = 1 as const;

export type SnapshotViewport = {
  leftBoundaryTime: number;
  rightBoundaryTime: number;
};

export type TimelineSnapshot = {
  version: typeof TIMELINE_SNAPSHOT_VERSION;
  exportedAt: number;
  viewport: SnapshotViewport;
  fixture: AppChartFixture;
};

export type SnapshotSource = {
  traceId: EntityId;
  traceName: string;
  threads: Thread[];
  events: TraceEvent[];
  categories: Category[];
  attentionShifts: AttentionShift[];
};

export type BuildTimelineSnapshotOptions = {
  leftBoundaryTime: number;
  rightBoundaryTime: number;
  includedThreadIds: EntityId[];
  collapsedThreadIds: EntityId[];
  exportedAt?: number;
};

type ActivitySpan = {
  activity: Activity;
  end: number;
  parentId: EntityId | null;
  start: number;
  threadId: EntityId;
};

const TERMINAL_PHASES = new Set(['E', 'J', 'V']);

function idKey(id: EntityId): string {
  return String(id);
}

function activityIdFromEvent(event: TraceEvent): EntityId | null {
  return event.activity?.id ?? null;
}

function collectActivitySpans(events: TraceEvent[]): Map<string, ActivitySpan> {
  const spans = new Map<string, ActivitySpan>();

  for (const event of events) {
    const activity = event.activity;
    if (!activity) continue;
    const key = idKey(activity.id);
    const existing = spans.get(key);
    const threadId = activity.thread_id ?? existing?.threadId;
    if (threadId === undefined) continue;

    if (!existing) {
      spans.set(key, {
        activity,
        start: event.timestamp,
        end: TERMINAL_PHASES.has(event.phase) ? event.timestamp : Number.POSITIVE_INFINITY,
        parentId: activity.parent_id ?? null,
        threadId,
      });
      continue;
    }

    existing.start = Math.min(existing.start, event.timestamp);
    if (TERMINAL_PHASES.has(event.phase)) {
      existing.end = Number.isFinite(existing.end)
        ? Math.max(existing.end, event.timestamp)
        : event.timestamp;
    }
  }

  return spans;
}

function intervalIntersects(
  start: number,
  end: number,
  left: number,
  right: number,
): boolean {
  return start <= right && end >= left;
}

function ancestorIdsOnIncludedThreads(
  activityKey: string,
  spans: Map<string, ActivitySpan>,
  includedThreads: Set<string>,
): string[] {
  const ancestors: string[] = [];
  const seen = new Set<string>();
  let parentId = spans.get(activityKey)?.parentId ?? null;

  while (parentId !== null && parentId !== undefined && !seen.has(idKey(parentId))) {
    const parentKey = idKey(parentId);
    seen.add(parentKey);
    const parent = spans.get(parentKey);
    if (!parent) break;
    if (!includedThreads.has(idKey(parent.threadId))) break;
    ancestors.push(parentKey);
    parentId = parent.parentId;
  }

  return ancestors;
}

export function buildTimelineSnapshot(
  source: SnapshotSource,
  options: BuildTimelineSnapshotOptions,
): TimelineSnapshot {
  const left = options.leftBoundaryTime;
  const right = options.rightBoundaryTime;
  const includedThreads = new Set(options.includedThreadIds.map(idKey));
  const collapsed = new Set(options.collapsedThreadIds.map(idKey));
  const spans = collectActivitySpans(source.events);

  const keepActivities = new Set<string>();
  for (const [key, span] of spans) {
    if (!includedThreads.has(idKey(span.threadId))) continue;
    if (!intervalIntersects(span.start, span.end, left, right)) continue;
    keepActivities.add(key);
    for (const ancestor of ancestorIdsOnIncludedThreads(key, spans, includedThreads)) {
      keepActivities.add(ancestor);
    }
  }

  const threadsById = new Map(source.threads.map(thread => [idKey(thread.id), thread]));
  const threads = options.includedThreadIds.flatMap((id, rank) => {
    const thread = threadsById.get(idKey(id));
    if (!thread) return [];
    return [{
      ...thread,
      rank,
      collapsed: collapsed.has(idKey(id)),
    }];
  });

  const events = source.events.filter(event => {
    const activityId = activityIdFromEvent(event);
    if (activityId === null) return false;
    return keepActivities.has(idKey(activityId));
  });

  const usedCategoryIds = new Set<string>();
  for (const event of events) {
    for (const categoryId of event.activity?.categories ?? []) {
      usedCategoryIds.add(idKey(categoryId));
    }
  }

  const categories = source.categories.filter(category => usedCategoryIds.has(idKey(category.id)));
  const attentionShifts = source.attentionShifts.filter(shift => (
    includedThreads.has(idKey(shift.thread_id))
    && shift.timestamp >= left
    && shift.timestamp <= right
  ));

  return {
    version: TIMELINE_SNAPSHOT_VERSION,
    exportedAt: options.exportedAt ?? Date.now(),
    viewport: {
      leftBoundaryTime: left,
      rightBoundaryTime: right,
    },
    fixture: {
      attentionShifts,
      categories,
      events,
      threads,
      traceId: source.traceId,
      traceName: source.traceName,
    },
  };
}

export function isTimelineSnapshot(value: unknown): value is TimelineSnapshot {
  if (value === null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.version !== TIMELINE_SNAPSHOT_VERSION) return false;
  const viewport = record.viewport;
  if (viewport === null || typeof viewport !== 'object') return false;
  const { leftBoundaryTime, rightBoundaryTime } = viewport as Record<string, unknown>;
  if (typeof leftBoundaryTime !== 'number' || typeof rightBoundaryTime !== 'number') return false;
  const fixture = record.fixture;
  if (fixture === null || typeof fixture !== 'object') return false;
  const { events, threads } = fixture as Record<string, unknown>;
  return Array.isArray(events) && Array.isArray(threads);
}
