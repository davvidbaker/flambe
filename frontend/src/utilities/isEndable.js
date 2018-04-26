// Activity (Block) is only endable if it is on the tip of the icicle.
function isEndable(activity, activityBlocks, threadLevels) {
  if (!activity.thread) {
    console.warn('activity missing thread!', activity);
    // debugger;
    return false;
  }
  const lastBlock = activityBlocks[activityBlocks.length - 1];
  if (lastBlock.level + 1 === threadLevels[activity.thread_id].current) {
    return true;
  }
  return false;
}

export default isEndable;
