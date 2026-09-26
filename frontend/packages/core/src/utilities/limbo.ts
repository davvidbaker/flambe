import type { ProcessedActivity } from './processTrace';

export interface LimboItem {
  activity: ProcessedActivity;
}

/** Limbo is an untimed unstarted activity, or one that is currently suspended. */
export function limboItems(activities: Record<string, ProcessedActivity>): LimboItem[] {
  return Object.values(activities)
    .filter(activity =>
      activity.status === 'suspended'
      || (activity.status === 'unstarted' && activity.scheduled_start == null && activity.scheduled_end == null))
    .map(activity => ({ activity }))
    .sort((left, right) => String(left.activity.name).localeCompare(String(right.activity.name)));
}
