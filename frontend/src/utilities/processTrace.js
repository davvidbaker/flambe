// @flow
// flow-ignore
import sortBy from 'lodash/fp/sortBy';
import uniq from 'lodash/uniq';
import last from 'lodash/last';

import type { Activity } from 'types/Activity';
import type { TraceEvent } from 'types/TraceEvent';
import type { Thread } from 'types/Thread';

export function lastActivityBlock(blocks, activity_id) {
  return last(blocks.filter(block => block.activity_id === activity_id));
}

/** ⚠️ kinda sorta definitely mutates blocks array/maybe the objects inside, right? */
export function terminateBlock(
  blocks,
  activity_id,
  timestamp,
  phase,
  message = '',
) {
  const block = lastActivityBlock(blocks, activity_id);
  block.endTime = timestamp;
  block.ending = phase;
  block.endMessage = message;

  return blocks;
}

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
  // 1 "activity" is made up of 1 or more blocks which happen from suspending and resuming the activity
  const activities = {};
  let blocks = [];

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

    // 🔮 more phases like async
    switch (event.phase) {
      // S for suspend
      case 'S':
        blocks = terminateBlock(
          blocks,
          event.activity.id,
          event.timestamp,
          event.phase,
          event.message,
        );
        threadLevels[thread_id].current--;
        activity.status = 'suspended';
        break;

      // R for resume
      case 'R':
        console.log('event.phase', event.phase);
        blocks.push({
          startTime: event.timestamp,
          level: threadLevels[thread_id].current,
          activity_id: event.activity.id,
          beginning: event.phase,
        });
        threadLevels[thread_id].current++;
        threadLevels[thread_id].max = Math.max(
          threadLevels[thread_id].current,
          threadLevels[thread_id].max,
        );
        activity.status = 'active';
        break;

      // B for begin, Q for question
      case 'Q':
      case 'B':
        activity.startTime = event.timestamp; // 👈 do i need this?
        activity.status = 'active';
        // activity.level = threadLevels[thread_id].current;
        activity.name = event.activity.name;
        activity.description = event.activity.description;
        activity.thread = event.activity.thread;
        activity.flavor = event.phase === 'Q' ? 'question' : 'task';
        blocks.push({
          startTime: event.timestamp,
          level: threadLevels[thread_id].current,
          activity_id: event.activity.id,
          beginning: event.phase,
          startMessage: event.message
        });

        threadLevels[thread_id].current++;
        threadLevels[thread_id].max = Math.max(
          threadLevels[thread_id].current,
          threadLevels[thread_id].max,
        );
        break;

      // E for End, J for Reject, V for Resolve
      case 'E':
      case 'J':
      case 'V':
        activity.endTime = event.timestamp;
        activity.ending = event.phase; // ⚠️ need the message!
        activity.status = 'complete';
        blocks = terminateBlock(
          blocks,
          event.activity.id,
          event.timestamp,
          event.phase,
          event.message,
        );
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
    blocks,
    lastCategory_id,
    lastThread_id,
    min: leftTime,
    max: rightTime,
    threadLevels,
    threads,
  };
}

export default processTrace;
