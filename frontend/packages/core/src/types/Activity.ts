import type { EntityId } from './ids';
import type { Thread } from './Thread';

export type ActivityStatus =
  | 'active'
  | 'complete'
  | 'parent_suspended'
  | 'suspended';

export interface Activity {
  agent_id?: string | null;
  agent_name?: string | null;
  categories: EntityId[];
  description?: string | null;
  endTime?: number;
  events?: EntityId[];
  flavor?: 'question' | 'task';
  id: EntityId;
  level?: number;
  name?: string;
  parent_id?: EntityId | null;
  startTime?: number;
  status?: ActivityStatus;
  suspendedChildren?: EntityId[];
  thread?: Thread;
  thread_id?: EntityId;
  weight?: number;
}
