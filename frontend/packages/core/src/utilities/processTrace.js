// @flow
// flow-ignore
import sortBy from "lodash/fp/sortBy";
import uniq from "lodash/uniq";
import last from "lodash/last";
import findLast from "lodash/fp/findLast";
import map from "lodash/fp/map";
import pipe from "lodash/fp/pipe";
import mapValues from "lodash/fp/mapValues";
import filter from "lodash/fp/filter";

import type { Activity } from "types/Activity";
import type { TraceEvent } from "types/TraceEvent";
import type { Thread } from "types/Thread";

export function lastActivityBlock(blocks, activity_id) {
  const block = pipe(filter(block => block.activity_id === activity_id), last)(blocks);
  if (!block.events) {
    debugger;
  }
  return block;
}

export function removeActivity(activity_id, thread_id, threadOpenActivities) {
  return {
    ...threadOpenActivities,
    [thread_id]: threadOpenActivities[thread_id].filter(act_id => act_id !== activity_id)
  };
}

function decrementThreadLevel(level) {
  return Math.max(0, level - 1);
}

function isChildActivity(activity_id, blocks, event) {
  return (
    findLast(block => block.activity_id === activity_id)(blocks).startTime >=
      findLast(block => block.activity_id === event.activity.id)(blocks)
        .startTime &&
    findLast(block => block.activity_id === activity_id)(blocks).level >
      findLast(block => block.activity_id === event.activity.id)(blocks).level
  );
}

/** ⚠️ kinda sorta definitely mutates blocks array/maybe the objects inside, right? */
/* 🤔 I think it is a safe assumption that a block can have at most two events. Right? */
export function terminateBlock(
  blocks,
  activity_id,
  timestamp,
  phase,
  message = "",
  event_id
) {
  const block = lastActivityBlock(blocks, activity_id);
  block.endTime = timestamp;
  block.ending = phase;
  block.endMessage = message;
  block.events.push(event_id);

  return blocks;
}

function pushToMaybeNullArray(arr, ...items) {
  if (arr) {
    return [...arr, ...items];
  }
  return [...items];
}

function processTrace(trace: TraceEvent[], threads: Thread[]) {
  console.log("trace", trace);
  const threadsObject = {};
  let threadLevels = {};
  let threadOpenActivities = {};
  // const threadStatuses = {};
  threads.forEach(thread => {
    threadsObject[thread.id] = thread;
    threadLevels = {
      ...threadLevels,
      [thread.id]: { current: 0, max: 0 }
    };

    threadOpenActivities = {
      ...threadOpenActivities,
      [thread.id]: []
    };
  });

  if (!trace || trace.length <= 0) {
    return {
      min: Date.now(),
      max: Date.now() + 1000, // arbitrary
      activities: {},
      threadLevels,
      threads
    };
  }

  // 👇 The trace from the database is not necessarily ordered.
  const orderedTrace: TraceEvent[] = sortBy((event: TraceEvent) => event.timestamp)(trace);

  // ⚠️ maybe one day don't have this redundancy.
  // Activities on client are slightly different than how they are stored on server. On client, activities have fields for their start and end times, while activities on server do not. Originally I was calling them entries on the client, but I stopped because the confusion around that being a keyword for objects in javascript. (Object.entries()...).
  // 1 "activity" is made up of 1 or more blocks which happen from suspending and resuming the activity
  let activities = {};
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

    activities = {
      ...activities,
      [event.activity.id]: activities[event.activity.id] || {}
    };

    const thread_id = event.activity.thread.id;

    threadLevels = {
      ...threadLevels,
      [thread_id]: threadLevels[thread_id] || { current: 0, max: 0 }
    };

    const threadLevel = threadLevels[thread_id];

    const activity = activities[event.activity.id];

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
      case "S":
        // if an activity was already suspended, we shouldn't have a suspend event for it, but in case we because data was corrupt or altered...
        if (
          activities[event.activity.id].status === "suspended" ||
          activities[event.activity.id].status === "parent_suspended"
        ) {
          break;
        }

        blocks = terminateBlock(
          blocks,
          event.activity.id,
          event.timestamp,
          event.phase,
          event.message,
          event.id
        );

        threadLevel.current = decrementThreadLevel(threadLevel.current);

        activity.status = "suspended";

        threadOpenActivities = removeActivity(
          event.activity.id,
          thread_id,
          threadOpenActivities
        );
        threadOpenActivities[thread_id].forEach(activity_id => {
          if (isChildActivity(activity_id, blocks, event)) {
            activity.suspendedChildren.push(activity_id);

            activities[activity_id].status = "parent_suspended";

            terminateBlock(
              blocks,
              activity_id,
              event.timestamp,
              event.phase,
              event.message
            );
            threadLevel.current--;
            threadLevel.current = Math.max(0, threadLevel.current);
            threadOpenActivities = removeActivity(
              activity_id,
              thread_id,
              threadOpenActivities
            );
          }
        });

        break;

      // X for Resurrect(s)
      case "X":
        blocks.push({
          startTime: event.timestamp,
          level: threadLevel.current,
          activity_id: event.activity.id,
          beginning: event.phase,
          events: [event.id]
        });
        threadLevel.current++;
        threadLevel.max = Math.max(threadLevel.current, threadLevel.max);
        activity.status = "active";
        break;

      // R for resume
      case "R":
        // NOW I am making it so you can't really resume a task whose parent was suspended. The parent has to be resumed.

        if (activities[event.activity.id].status === "parent_suspended") {
          break;
        }

        blocks.push({
          startTime: event.timestamp,
          level: threadLevel.current,
          activity_id: event.activity.id,
          beginning: event.phase,
          startMessage: event.message,
          events: [event.id]
        });
        threadLevel.current++;
        threadLevel.max = Math.max(threadLevel.current, threadLevel.max);

        if (activity.suspendedChildren.length > 0) {
          activity.suspendedChildren.forEach(activity_id => {
            activities[activity_id].status = "active";
            blocks.push({
              startTime: event.timestamp,
              level: threadLevel.current,
              activity_id,
              beginning: event.phase,
              events: [event.id]
            });
            threadLevel.current++;
            threadLevel.max = Math.max(threadLevel.current, threadLevel.max);
            threadOpenActivities = {
              ...threadOpenActivities,
              [thread_id]: [...threadOpenActivities[thread_id], activity_id]
            };
          });
        }
        activity.suspendedChildren = [];
        threadOpenActivities = {
          ...threadOpenActivities,
          [thread_id]: [...threadOpenActivities[thread_id], event.activity.id]
        };
        activity.status = "active";
        break;
      // B for begin, Q for question
      case "Q":
      case "B":
        activity.startTime = event.timestamp; // 👈 do i need this?
        activity.status = "active";
        activity.name = event.activity.name;
        activity.description = event.activity.description;
        activity.thread_id = event.activity.thread.id;
        activity.flavor = event.phase === "Q" ? "question" : "task";
        blocks.push({
          startTime: event.timestamp,
          level: threadLevel.current,
          activity_id: event.activity.id,
          beginning: event.phase,
          startMessage: event.message,
          events: [event.id]
        });
        threadOpenActivities = {
          ...threadOpenActivities,
          [thread_id]: [...threadOpenActivities[thread_id], event.activity.id]
        };
        // if (threadStatuses[thread_id].status === 'suspended') {
        //   blocks = terminateBlock(
        //     blocks,
        //     event.activity.id,
        //     threadStatuses[thread_id].suspendedAt,
        //     'S',
        //     'Suspended because parent is suspended.'
        //   );
        // }

        threadLevel.current++;
        threadLevel.max = Math.max(threadLevel.current, threadLevel.max);
        break;
      // E for End, J for Reject, V for Resolve
      case "E":
      case "J":
      case "V":
        activity.endTime = event.timestamp;
        activity.ending = event.phase; // ⚠️ need the message!
        activity.status = "complete";
        /* ⚠️ bad name */
        const openActs = threadOpenActivities[thread_id].map(act_id => activities[thread_id]);
        /* ⚠️ mutation */
        openActs.forEach((act, ind) => {
          const act_id = threadOpenActivities[thread_id][ind];
          if (act_id && isChildActivity(act_id, blocks, event)) {
            blocks = terminateBlock(
              blocks,
              act_id,
              event.timestamp,
              event.phase,
              event.message,
              event.id
            );
            threadLevel.current = decrementThreadLevel(threadLevel.current);

            act.status = "complete";
            threadOpenActivities = removeActivity(
              act_id,
              thread_id,
              threadOpenActivities
            );
          }
        });

        blocks = terminateBlock(
          blocks,
          event.activity.id,
          event.timestamp,
          event.phase,
          event.message,
          event.id
        );
        threadLevel.current = decrementThreadLevel(threadLevel.current);
        threadOpenActivities = removeActivity(
          event.activity.id,
          thread_id,
          threadOpenActivities
        );
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
    lastCategory_id =
      activity.categories.length > 0 ? activity.categories[0] : null;

    if (ind === orderedTrace.length - 1) {
      lastThread_id = activity.thread_id;
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
    threads: threadsObject,
    events: trace
  };
}

export default processTrace;
