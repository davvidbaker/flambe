import {
  BLOCK_FOCUS,
  ACTIVITY_END,
  ACTIVITY_SUSPEND,
  ACTIVITY_RESUME,
} from 'actions';

function operand(state = null, action) {
  switch (action.type) {
    case BLOCK_FOCUS:
      return {
        type: action.index !== null ? 'activity' : null,
        activity_id: action.activity_id,
        activityStatus: action.activityStatus,
        thread_id: action.thread_id,
      };

    case ACTIVITY_END:
      return {
        ...state,
        activityStatus: 'complete',
      };

    case ACTIVITY_SUSPEND:
      return {
        ...state,
        activityStatus: 'suspended',
      };

    case ACTIVITY_RESUME:
      return {
        ...state,
        activityStatus: 'active',
      };

    default:
      return state;
  }
}

export default operand;
