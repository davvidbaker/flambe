import { TODOS_TOGGLE } from 'actions';

import timeline from './timeline';
import modifiers from './modifiers';
import user from './user';
import operand from './operand';

function todosVisible(state = false, action) {
  switch (action.type) {
    case TODOS_TOGGLE:
      return action.bool;
    default:
      return state;
  }
}

export { timeline, modifiers, user, operand, todosVisible };
