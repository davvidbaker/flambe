import { FOCUS_ACTIVITY } from 'actions';

function operand(state = null, action) {
  switch (action.type) {
    case FOCUS_ACTIVITY:
      return {
        type: 'activity',
        id: action.id,
      };

    default:
      return state;
  }
}

export default operand;
