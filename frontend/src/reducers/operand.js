import { BLOCK_FOCUS } from 'actions';

function operand(state = null, action) {
  switch (action.type) {
    case BLOCK_FOCUS:
      return {
        type: action.index !== null ? 'activity' : null,
        activity_id: action.activity_id,
        activityStatus: action.activityStatus,
        thread_id: action.thread_id,
      };

    default:
      return state;
  }
}

export default operand;
