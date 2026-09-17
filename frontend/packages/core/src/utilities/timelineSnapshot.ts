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

export type SnapshotTimeLabels = {
  absoluteTimeLabels: boolean;
  twelveHourClock: boolean;
};

export type TimelineSnapshot = {
  version: typeof TIMELINE_SNAPSHOT_VERSION;
  exportedAt: number;
  viewport: SnapshotViewport;
  timeLabels?: SnapshotTimeLabels;
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
  absoluteTimeLabels?: boolean;
  twelveHourClock?: boolean;
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

function activityThreadId(activity: Activity | null | undefined): EntityId | undefined {
  if (!activity) return undefined;
  return activity.thread_id ?? activity.thread?.id;
}

function plainActivity(activity: Activity | null): Activity | null {
  if (!activity) return null;
  const threadId = activityThreadId(activity);
  return {
    id: activity.id,
    name: activity.name,
    categories: [...(activity.categories ?? [])],
    description: activity.description ?? null,
    parent_id: activity.parent_id ?? null,
    thread_id: threadId,
    thread: threadId === undefined ? undefined : { id: threadId, name: activity.thread?.name ?? '' },
    agent_id: activity.agent_id ?? null,
    agent_name: activity.agent_name ?? null,
    flavor: activity.flavor,
    weight: activity.weight,
  };
}

function collectActivitySpans(events: TraceEvent[]): Map<string, ActivitySpan> {
  const spans = new Map<string, ActivitySpan>();

  for (const event of events) {
    const activity = event.activity;
    if (!activity) continue;
    const key = idKey(activity.id);
    const existing = spans.get(key);
    const threadId = activityThreadId(activity) ?? existing?.threadId;
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

function beginPhaseForActivity(events: TraceEvent[], activityKey: string): TraceEvent['phase'] {
  const found = events.find(event => (
    event.activity !== null
    && idKey(event.activity.id) === activityKey
    && (event.phase === 'B' || event.phase === 'Q')
  ));
  return found?.phase === 'Q' ? 'Q' : 'B';
}

function clipEventsToWindow(
  sourceEvents: TraceEvent[],
  spans: Map<string, ActivitySpan>,
  keepActivities: Set<string>,
  left: number,
  right: number,
): TraceEvent[] {
  const clipped: TraceEvent[] = [];
  let synthetic = 0;
  const nextId = () => `clip-${synthetic += 1}`;

  for (const key of keepActivities) {
    const span = spans.get(key);
    if (!span) continue;
    const activity = plainActivity(span.activity);
    const inRange = sourceEvents.filter(event => (
      event.activity !== null
      && idKey(event.activity.id) === key
      && event.timestamp >= left
      && event.timestamp <= right
    ));

    if (intervalIntersects(span.start, span.end, left, right) && span.start < left) {
      clipped.push({
        id: nextId(),
        timestamp: left,
        phase: beginPhaseForActivity(sourceEvents, key),
        activity,
      });
    }

    for (const event of inRange) {
      clipped.push({
        id: event.id,
        timestamp: event.timestamp,
        phase: event.phase,
        message: event.message,
        activity: plainActivity(event.activity),
      });
    }

    if (
      intervalIntersects(span.start, span.end, left, right)
      && span.end > right
      && !inRange.some(event => TERMINAL_PHASES.has(event.phase))
    ) {
      clipped.push({
        id: nextId(),
        timestamp: right,
        phase: 'E',
        activity,
      });
    }
  }

  return clipped.sort((leftEvent, rightEvent) => (
    leftEvent.timestamp - rightEvent.timestamp
    || String(leftEvent.id).localeCompare(String(rightEvent.id))
  ));
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

  const events = clipEventsToWindow(source.events, spans, keepActivities, left, right);

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
    timeLabels: {
      absoluteTimeLabels: Boolean(options.absoluteTimeLabels),
      twelveHourClock: Boolean(options.twelveHourClock),
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
  if (!Array.isArray(events) || !Array.isArray(threads)) return false;
  if (record.timeLabels === undefined) return true;
  if (record.timeLabels === null || typeof record.timeLabels !== 'object') return false;
  const { absoluteTimeLabels, twelveHourClock } = record.timeLabels as Record<string, unknown>;
  return typeof absoluteTimeLabels === 'boolean' && typeof twelveHourClock === 'boolean';
}
