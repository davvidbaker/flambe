// @flow

import type { Thread } from './Thread';

type TraceEvent = {
  timestamp: number,
  activity: {
    name: string,
    id: string,
    description: string,
    thread: Thread,
  },
  phase: 'B' | 'E',
  thread: string,
  id: string,
};

export type { TraceEvent };
