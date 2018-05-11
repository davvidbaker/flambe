// @flow
// flow-ignore
import sortBy from "lodash/fp/sortBy";
import uniq from "lodash/uniq";
import last from "lodash/last";
import findLast from "lodash/fp/findLast";
import map from "lodash/fp/map";

import { findById } from "./";

import type { Activity } from "types/Activity";
import type { TraceEvent } from "types/TraceEvent";
import type { Thread } from "types/Thread";

export function lastActivityBlock(blocks, activity_id) {
  return last(blocks.filter(block => block.activity_id === activity_id));
}

export function removeActivity(activity_id, thread_id, threadOpenActivities) {
  /* ⚠️ threadObj is a bad name */
  return map(threadObj =>
    (threadObj.id === thread_id
      ? {
        ...threadObj,
        activities: threadObj.activities.filter(id => activity_id !== id)
      }
      : threadObj))(threadOpenActivities);
}

/** ⚠️ kinda sorta definitely mutates blocks array/maybe the objects inside, right? */
export function terminateBlock(
  blocks,
  activity_id,
  timestamp,
  phase,
  message = ""
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
  let threadLevels = [];
  let threadOpenActivities = [];
  // const threadStatuses = {};
  threads.forEach(thread => {
    threadLevels = [
      ...threadLevels,
      {
        id: thread.id,
        current: 0,
        max: 0
      }
    ];
    threadOpenActivities = [
      ...threadOpenActivities,
      { id: thread.id, activities: [] }
    ];
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
  let activities = [];
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

    activities = activities.find(({ id }) => id === event.activity.id)
      ? activities
      : [...activities, { id: event.activity.id }];

    const thread_id = event.activity.thread.id;

    if (!threadLevels.find(({ id }) => id === thread_id)) {
      threadLevels = [...threadLevels, { id: thread_id, current: 0, max: 0 }];
    }
    const threadLevel = threadLevels.find(({ id }) => id === thread_id);

    const activity: Activity = activities.find(({ id }) => id === event.activity.id);

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
        blocks = terminateBlock(
          blocks,
          event.activity.id,
          event.timestamp,
          event.phase,
          event.message
        );
        threadLevel.current--;
        activity.status = "suspended";

        threadOpenActivities = removeActivity(
          event.activity.id,
          thread_id,
          threadOpenActivities
        );
        findById(thread_id, threadOpenActivities).activities.forEach(activity_id => {
          if (
            findLast(block => block.activity_id === activity_id)(blocks)
              .startTime >=
              findLast(block => block.activity_id === event.activity.id)(blocks)
                .startTime &&
            findLast(block => block.activity_id === activity_id)(blocks).level >
              findLast(block => block.activity_id === event.activity.id)(blocks)
                .level
          ) {
            activity.suspendedChildren.push(activity_id);

            terminateBlock(
              blocks,
              activity_id,
              event.timestamp,
              event.phase,
              event.message
            );
            threadLevel.current--;
            // 👀 🙉 I AM FUTZING WITH THREAD OPEN ACTIVITIES (stop using id object thing) but I wanted to be reading about sofia abdalla and making find functionality and thnen making activities draggable (which needs some thought put into it but is totally a good idea) and then I was also writing about how whenever I want to do anything at all, I want to do everything.
            threadOpenActivities = threadOpenActivities.map(tOA =>
              (tOA.id === thread_id
                ? {
                  ...tOA,
                  activities: tOA.activities.filter(id => id !== activity_id)
                }
                : tOA));
          }
        });

        break;

      // X for Resurrect(s)
      case "X":
        blocks.push({
          startTime: event.timestamp,
          level: threadLevel.current,
          activity_id: event.activity.id,
          beginning: event.phase
        });
        threadLevel.current++;
        threadLevel.max = Math.max(threadLevel.current, threadLevel.max);
        activity.status = "active";
        break;

      // R for resume
      case "R":
        blocks.push({
          startTime: event.timestamp,
          level: threadLevel.current,
          activity_id: event.activity.id,
          beginning: event.phase,
          startMessage: event.message
        });
        threadLevel.current++;
        threadLevel.max = Math.max(threadLevel.current, threadLevel.max);

        if (activity.suspendedChildren.length > 0) {
          activity.suspendedChildren.forEach(activity_id => {
            blocks.push({
              startTime: event.timestamp,
              level: threadLevel.current,
              activity_id,
              beginning: event.phase
            });
            threadLevel.current++;
            threadLevel.max = Math.max(threadLevel.current, threadLevel.max);
            threadOpenActivities = threadOpenActivities.map(tOA =>
              (tOA.id === thread_id
                ? { ...tOA, activities: [...tOA.activities, activity_id] }
                : tOA));
          });
          activity.suspendedChildren = [];
          threadOpenActivities = threadOpenActivities.map(tOA =>
            (tOA.id === thread_id
              ? { ...tOA, activities: [...tOA.activities, event.activity.id] }
              : tOA));
        }
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
          startMessage: event.message
        });
        threadOpenActivities = threadOpenActivities.map(tOA =>
          (tOA.id === thread_id
            ? { ...tOA, activities: [...tOA.activities, event.activity.id] }
            : tOA));
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
        blocks = terminateBlock(
          blocks,
          event.activity.id,
          event.timestamp,
          event.phase,
          event.message
        );
        threadLevel.current--;
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
    threads
  };
}

export default processTrace;
