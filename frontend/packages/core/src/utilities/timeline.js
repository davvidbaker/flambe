// @flow
import {
  pipe,
  fromPairs,
  identity,
  filter,
  curry,
  mapValues,
  map,
} from 'lodash/fp';

/* ⚠️ should probably generalize this into smoething like filterObjectsByIdList  or by keyArray. There might even by a lodash method to do exactly this thing I'm doing.
*/
export const getFilteredThreads = (filterExcludes: number, threads: Threads) =>
  threads
  |> Object.entries
  |> (filterExcludes.length > 0
    ? filter(([id, t]) => !filterExcludes.includes(Number(id)))
    : identity)
  |> fromPairs;

export const loadSuspendedActivityCount = curry(
  (activities: Activities, threads: Threads) =>
    Object.entries(activities).reduce(
      (acc, [_id, activity]) =>
        activity.status === 'suspended' && acc[activity.thread_id]
          ? {
              ...acc,
              [activity.thread_id]: {
                ...acc[activity.thread_id],
                suspendedActivityCount:
                  acc[activity.thread_id].suspendedActivityCount + 1 || 1,
              },
            }
          : acc,
      mapValues(t => ({ ...t, suspendedActivityCount: 0 }))(threads),
    ),
);

export const getShamefulColor = (num: number) => `rgba(${num}, 0, 0, 0.5)`;

export const blocksForActivity = (
  activity_id: number,
  blocks: Block[],
): Block[] => blocks.filter(block => block.activity_id === activity_id);

export const blocksForActivityWithIndices = (
  activity_id: number,
  blocks: Block[],
): { [index: number]: Block } => {
  console.log(`🔥  blocks`, blocks);
  console.log(`🔥  activity_id`, activity_id);
  return (
    blocks
    |> Object.entries
    |> filter(([_key, val]) => Number(val.activity_id) === Number(activity_id))
    |> map(([key, val]) => [Number(key), val])
  );
};
