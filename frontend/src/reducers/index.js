import timeline from './timeline';
import modifiers from './modifiers';
import user from './user';

function categories(state = [], action) {
  switch (action.type) {
    case 'SET_CATEGORIES':
      return action.categories;

    default:
      return state;
  }
}

export { timeline, modifiers, user, categories };
