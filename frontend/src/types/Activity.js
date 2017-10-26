// @flow

import type { Thread } from './Thread';

type Activity = {
  startTime: number,
  endTime: number,
  level: number,
  name: string,
  description: string,
  thread: Thread,
  id: string,
  events: (?string)[], // just contains the ids
  categories: (?string)[] // just contains the ids
};

export type { Activity };
