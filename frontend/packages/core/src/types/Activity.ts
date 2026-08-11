import type { EntityId } from './ids';
import type { Thread } from './Thread';

export type ActivityStatus =
  | 'active'
  | 'complete'
  | 'parent_suspended'
  | 'suspended';

export interface Activity {
  categories: EntityId[];
  description?: string | null;
  endTime?: number;
  events?: EntityId[];
  flavor?: 'question' | 'task';
  id: EntityId;
  level?: number;
  name?: string;
  startTime?: number;
  status?: ActivityStatus;
  suspendedChildren?: EntityId[];
  thread?: Thread;
  thread_id?: EntityId;
  weight?: number;
}
