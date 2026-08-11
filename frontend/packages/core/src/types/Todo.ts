import type { EntityId } from './ids';

export interface Todo {
  categories?: EntityId[];
  description: string | null;
  id: EntityId;
  name: string;
}
