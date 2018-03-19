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

export function removeActivity(activity_id, thread_id, nonTerminatedBlocks) {
  return {
    ...nonTerminatedBlocks,
    [thread_id]: nonTerminatedBlocks[thread_id].filter(
      id => activity_id !== id
    ),
  };
}

/** ⚠️ kinda sorta definitely mutates blocks array/maybe the objects inside, right? */
export function terminateBlock(
  blocks,
  activity_id,
  timestamp,
  phase,
  message = ''
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
  let threadNonTerminatedBlocks = {};
  // const threadStatuses = {};
  threads.forEach(thread => {
    threadLevels[thread.id] = {
      current: 0,
      max: 0,
    };
    threadNonTerminatedBlocks[thread.id] = [];
  });

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
    (event: TraceEvent) => event.timestamp
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
      ...event.activity.categories
    );
    activity.categories = uniq(activity.categories);
    activity.suspendedChildren = activity.suspendedChildren || [];

    // 🔮 more phases like async
    switch (event.phase) {
      /* 💁 If an activity is suspended, so are its child activities */
      // S for suspend
      case 'S':
        blocks = terminateBlock(
          blocks,
          event.activity.id,
          event.timestamp,
          event.phase,
          event.message
        );
        threadLevels[thread_id].current--;
        // threadStatuses[thread_id].status = 'suspended';
        // threadStatuses[thread_id].suspendedAt = event.timestamp;
        activity.status = 'suspended';
        threadNonTerminatedBlocks = removeActivity(
          event.activity.id,
          thread_id,
          threadNonTerminatedBlocks
        );

        threadNonTerminatedBlocks[thread_id].forEach(activity_id => {
          if (
            blocks.find(block => block.activity_id === activity_id).startTime >
            blocks.find(block => block.activity_id === event.activity.id)
              .startTime
          ) {
            activity.suspendedChildren.push(activity_id);
            terminateBlock(
              blocks,
              activity_id,
              event.timestamp,
              event.phase,
              event.message
            );
            threadLevels[thread_id].current--;
            threadNonTerminatedBlocks[thread_id] = threadNonTerminatedBlocks[
              thread_id
            ].filter(id => id !== activity_id);
          }
        });

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
          threadLevels[thread_id].max
        );
        if (activity.suspendedChildren.length > 0) {
          activity.suspendedChildren.forEach(activity_id => {
            blocks.push({
              startTime: event.timestamp,
              level: threadLevels[thread_id].current,
              activity_id,
              beginning: event.phase,
            });
            threadLevels[thread_id].current++;
            threadLevels[thread_id].max = Math.max(
              threadLevels[thread_id].current,
              threadLevels[thread_id].max
            );
          });
          activity.suspendedChildren = [];
        }
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
          startMessage: event.message,
        });
        threadNonTerminatedBlocks[thread_id].push(event.activity.id);

        // if (threadStatuses[thread_id].status === 'suspended') {
        //   blocks = terminateBlock(
        //     blocks,
        //     event.activity.id,
        //     threadStatuses[thread_id].suspendedAt,
        //     'S',
        //     'Suspended because parent is suspended.'
        //   );
        // }

        threadLevels[thread_id].current++;
        threadLevels[thread_id].max = Math.max(
          threadLevels[thread_id].current,
          threadLevels[thread_id].max
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
          event.message
        );
        threadLevels[thread_id].current--;
        threadNonTerminatedBlocks = removeActivity(
          event.activity.id,
          thread_id,
          threadNonTerminatedBlocks
        );
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
    lastCategory_id = activity.categories.length > 0
      ? activity.categories[0]
      : null;

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
