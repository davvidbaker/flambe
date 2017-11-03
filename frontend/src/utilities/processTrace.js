// @flow
// flow-ignore
import sortBy from 'lodash/fp/sortBy';
import uniq from 'lodash/uniq';

import type { Activity } from 'types/Activity';
import type { TraceEvent } from 'types/TraceEvent';
import type { Thread } from 'types/Thread';

function pushToMaybeNullArray(arr, ...items) {
  if (arr) {
    return [...arr, ...items];
  }
  return [...items];
}

function processTrace(trace: TraceEvent[], threads: Thread[]) {
  const threadLevels = {};
  threads.forEach(thread => {
    threadLevels[thread.id] = 0;
  });
  console.log('processing trace events...');

  if (!trace || trace.length <= 0) {
    return {
      min: Date.now(),
      max: Date.now() + 1000, // arbitrary
      activities: {},
      threadLevels,
      threads,
    };
  }

  // 👇 The trace from the database is not necessarily ordered.
  const orderedTrace: TraceEvent[] = sortBy(
    (event: TraceEvent) => event.timestamp,
  )(trace);

  // ⚠️ maybe one day don't have this redundancy.
  // Activities on client are slightly different than how they are stored on server. On client, activities have fields for their start and end times, while activities on server do not. Originally I was calling them entries on the client, but I stopped because the confusion around that being a keyword for objects in javascript. (Object.entries()...).
  // 1 "activity" on the timeline is 1 block, start to end.
  const activities = {};

  let leftTime = trace[0].timestamp;
  let rightTime = trace[0].timestamp;
  let lastCategory;

  orderedTrace.forEach(event => {
    // If an event's activity is null, don't process it as part of trace.
    if (!event.activity) {
      return;
    }

    activities[event.activity.id] = activities[event.activity.id] || {};

    const threadId = event.activity.thread.id;

    if (!threadLevels[threadId]) {
      threadLevels[threadId] = 0;
    }
    console.log('threadId', threadId);

    const activity: Activity = activities[event.activity.id];

    activity.events = pushToMaybeNullArray(activity.events, event.id);

    activity.categories = pushToMaybeNullArray(
      activity.categories,
      ...event.activity.categories,
    );
    activity.categories = uniq(activity.categories);

    // ⚠️ TODO more phases like async
    switch (event.phase) {
      // S for spark
      case 'S':
        break;
      // B for begin
      case 'B':
        activity.startTime = event.timestamp;
        activity.level = threadLevels[threadId];
        activity.name = event.activity.name;
        activity.description = event.activity.description;
        activity.thread = event.activity.thread;

        threadLevels[threadId]++;
        break;
      // E for End
      case 'E':
        activity.endTime = event.timestamp;
        threadLevels[threadId]--;
        break;

      default:
        break;
    }

    if (!activity.name) debugger;
    // adjust boundaries
    if (event.timestamp > rightTime) {
      rightTime = event.timestamp;
    }
    if (event.timestamp < leftTime) {
      leftTime = event.timestamp;
    }
    lastCategory =
      activity.categories.length > 0 ? activity.categories[0] : null;
  });

  return {
    activities,
    min: leftTime,
    max: rightTime,
    threadLevels,
    threads,
    lastCategory,
  };
}

export default processTrace;
