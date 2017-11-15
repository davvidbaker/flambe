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
    threadLevels[thread.id] = {
      current: 0,
      max: 0,
    };
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
  let lastCategory_id;
  let lastThread_id;

  orderedTrace.forEach((event, ind) => {
    // If an event's activity is null, don't process it as part of trace.
    if (!event.activity) {
      return;
    }

    activities[event.activity.id] = activities[event.activity.id] || {};

    const thread_id = event.activity.thread.id;

    if (!threadLevels[thread_id]) {
      threadLevels[thread_id] = { current: 0, max: 0 };
    }

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

      // B for begin, Q for question
      case 'Q':
      case 'B':
        activity.startTime = event.timestamp;
        activity.level = threadLevels[thread_id].current;
        activity.name = event.activity.name;
        activity.description = event.activity.description;
        activity.thread = event.activity.thread;
        activity.flavor = event.phase === 'Q' ? 'question' : 'task';

        threadLevels[thread_id].current++;
        threadLevels[thread_id].max = Math.max(
          threadLevels[thread_id].current,
          threadLevels[thread_id].max,
        );
        break;
      // E for End
      case 'E':
        activity.endTime = event.timestamp;
        threadLevels[thread_id].current--;
        break;

      default:
        console.log('event.phase', event.phase);
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
    lastCategory_id =
      activity.categories.length > 0 ? activity.categories[0] : null;

    if (ind === orderedTrace.length - 1) {
      lastThread_id = activity.thread.id;
    }
  });

  return {
    activities,
    lastCategory_id,
    lastThread_id,
    min: leftTime,
    max: rightTime,
    threadLevels,
    threads,
  };
}

export default processTrace;
