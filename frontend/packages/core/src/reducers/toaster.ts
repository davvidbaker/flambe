import { TOAST_CREATE, TOAST_POP } from '../actions';

export interface Toast {
  message: string;
  type: string;
}

type ToastAction = {
  index?: number;
  message?: string;
  notificationType?: string;
  type: string;
};

function toaster(state: Toast[] = [], action: ToastAction): Toast[] {
  switch (action.type) {
    case TOAST_CREATE:
      return [...state, { type: action.notificationType ?? '', message: action.message ?? '' }];
    case TOAST_POP:
      return state.filter((_toast, index) => index !== action.index);
    default:
      return state;
  }
}

export default toaster;
