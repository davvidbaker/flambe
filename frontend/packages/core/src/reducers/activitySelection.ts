import { BLOCK_FOCUS, TRACE_SELECT, LOG_OUT } from '../actions';
import type { EntityId } from '../types/ids';

export const ACTIVITIES_SELECT = 'ACTIVITIES_SELECT';
export const ACTIVITIES_BULK_MOVE = 'ACTIVITIES_BULK_MOVE';
export const ACTIVITIES_BULK_DELETE = 'ACTIVITIES_BULK_DELETE';
export const selectActivities = (ids: EntityId[]) => ({ type: ACTIVITIES_SELECT, ids });

export default function activitySelection(
  state: string[] = [],
  action: { type: string; ids?: EntityId[] },
): string[] {
  switch (action.type) {
    case ACTIVITIES_SELECT:
      return [...new Set((action.ids ?? []).map(String))];
    case BLOCK_FOCUS:
    case TRACE_SELECT:
    case LOG_OUT:
      return [];
    default:
      return state;
  }
}
