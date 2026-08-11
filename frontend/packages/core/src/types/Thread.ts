import type { EntityId } from './ids';

export interface Thread {
  collapsed?: boolean;
  currentLevel?: number;
  id: EntityId;
  name: string;
  rank?: number;
}
