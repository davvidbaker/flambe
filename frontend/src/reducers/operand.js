import { FOCUS_ACTIVITY } from 'actions';

function operand(state = null, action) {
  switch (action.type) {
    case FOCUS_ACTIVITY:
      return {
        type: action.id ? 'activity' : null,
        id: action.id,
        thread_id: action.thread_id,
      };

    default:
      return state;
  }
}

export default operand;
