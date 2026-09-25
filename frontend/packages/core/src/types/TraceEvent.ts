import type { Activity } from './Activity';
import type { EntityId } from './ids';

export type EventPhase =
  | 'B'
  | 'E'
  | 'J'
  | 'Q'
  | 'R'
  | 'S'
  | 'V'
  | 'X'
  | 'reducer_created'
  | 'reducer_decision'
  | 'reducer_incoming';

export interface TraceEvent {
  activity: Activity | null;
  id: EntityId;
  message?: string;
  phase: EventPhase;
  timestamp: number;
}
