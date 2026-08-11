import type { Activity } from './Activity';
import type { EntityId } from './ids';

export type EventPhase = 'B' | 'E' | 'J' | 'Q' | 'R' | 'S' | 'V' | 'X';

export interface TraceEvent {
  activity: Activity | null;
  id: EntityId;
  message?: string;
  phase: EventPhase;
  timestamp: number;
}
