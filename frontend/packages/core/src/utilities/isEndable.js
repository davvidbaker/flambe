import { findById } from "./";

// Activity (Block) is only endable if it is on the tip of the icicle.
function isEndable(activity, activityBlocks, threadLevels) {
  if (!activity.thread_id) {
    console.warn("activity missing thread!", activity);
    // debugger;
    return false;
  }
  const lastBlock = activityBlocks[activityBlocks.length - 1];
  if (
    lastBlock.level + 1 ===
    findById(activity.thread_id, threadLevels).current
  ) {
    return true;
  }
  return false;
}

export default isEndable;
