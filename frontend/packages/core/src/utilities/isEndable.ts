import type { EntityId } from '../types/ids';

interface ActivityLike {
  thread_id?: EntityId | null;
}

interface ActivityBlockLike {
  level: number;
}

interface ThreadLevelLike {
  current: number;
}

// Activity (Block) is only endable if it is on the tip of the icicle.
function isEndable(
  activity: ActivityLike,
  activityBlocks: ActivityBlockLike[],
  threadLevels: Record<string, ThreadLevelLike>,
): boolean {
  if (!activity.thread_id) {
    console.warn('activity missing thread!', activity);
    return false;
  }

  const lastBlock = activityBlocks[activityBlocks.length - 1];
  if (!lastBlock) return false;

  return lastBlock.level + 1 === threadLevels[String(activity.thread_id)]?.current;
}

export default isEndable;
