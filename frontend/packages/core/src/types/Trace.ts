import type { EntityId } from './ids';

export interface Trace {
  filterExcludes?: EntityId[];
  id: EntityId;
  name: string;
}
