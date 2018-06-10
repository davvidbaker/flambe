import { TOAST_CREATE, TOAST_POP } from '../actions';

function toaster(
  state = [],
  action
) {
  switch (action.type) {
    case TOAST_CREATE:
      return [
        ...state,
        { type: action.notificationType, message: action.message },
      ];

    case TOAST_POP:
      return state.filter((_x, ind) => ind !== action.index);
    default:
      return state;
  }
}

export default toaster;
