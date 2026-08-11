import type { EntityId } from '../types/ids';

import {
  BLOCK_FOCUS,
  ACTIVITY_END,
  ACTIVITY_SUSPEND,
  ACTIVITY_RESUME,
  ACTIVITY_RESURRECT,
} from '../actions';

export interface OperandState {
  activity_id?: EntityId;
  activityStatus?: string;
  thread_id?: EntityId;
  type: 'activity' | null;
}

type OperandAction = {
  activityStatus?: string;
  activity_id?: EntityId;
  index?: number | null;
  thread_id?: EntityId;
  type: string;
};

function operand(
  state: OperandState | null = null,
  action: OperandAction,
): OperandState | null {
  switch (action.type) {
    case BLOCK_FOCUS:
      return {
        type: action.index !== null ? 'activity' : null,
        activity_id: action.activity_id,
        activityStatus: action.activityStatus,
        thread_id: action.thread_id,
      };
    case ACTIVITY_END:
      return state ? { ...state, activityStatus: 'complete' } : state;
    case ACTIVITY_SUSPEND:
      return state ? { ...state, activityStatus: 'suspended' } : state;
    case ACTIVITY_RESURRECT:
    case ACTIVITY_RESUME:
      return state ? { ...state, activityStatus: 'active' } : state;
    default:
      return state;
  }
}

export default operand;
