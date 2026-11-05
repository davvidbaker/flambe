import type { ProcessedActivity } from './processTrace';
import type { EntityId } from '../types/ids';

/** Active work plus its ancestry, once per activity; never flatten concurrent branches into a fictitious stack. */
export function mobileStack(activities: Record<string, ProcessedActivity>, threadId: EntityId) {
  const included = new Map<string, ProcessedActivity>();
  for (const activity of Object.values(activities)) {
    if (activity.status !== 'active' || String(activity.thread_id) !== String(threadId)) continue;
    let current: ProcessedActivity | undefined = activity;
    const seen = new Set<string>();
    while (current && String(current.thread_id) === String(threadId) && !seen.has(String(current.id))) {
      seen.add(String(current.id));
      included.set(String(current.id), current);
      current = current.parent_id == null ? undefined : activities[String(current.parent_id)];
    }
  }
  const children = new Map<string, ProcessedActivity[]>();
  const roots: ProcessedActivity[] = [];
  for (const activity of included.values()) {
    const parent = activity.parent_id == null ? undefined : String(activity.parent_id);
    if (parent && included.has(parent)) children.set(parent, [...(children.get(parent) ?? []), activity]);
    else roots.push(activity);
  }
  const rows: { activity: ProcessedActivity; depth: number }[] = [];
  const visited = new Set<string>();
  const visit = (activity: ProcessedActivity, depth: number) => {
    if (visited.has(String(activity.id))) return;
    visited.add(String(activity.id));
    rows.push({ activity, depth });
    for (const child of children.get(String(activity.id)) ?? []) visit(child, depth + 1);
  };
  roots.forEach(activity => visit(activity, 0));
  // Malformed cyclic ancestry must not hide live work or recurse forever.
  included.forEach(activity => visit(activity, 0));
  return rows;
}
