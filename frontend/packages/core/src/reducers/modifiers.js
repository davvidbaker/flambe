// @flow

// modifying keys like shift, command, ctrl, etc

import { KEY_DOWN, KEY_UP } from 'actions';

const initState = {
  shift: false,
};

// flow-ignore
export const getModifiers = state => state.modifiers;

const modifiers = (
  state: { shift: boolean } = initState,
  action: { type: string, key: string }
) => {
  switch (action.type) {
    
    case KEY_DOWN:
      return {
        ...state,
        [action.key.toLowerCase()]: true
      }
    
      case KEY_UP:
      return {
        ...state,
        [action.key.toLowerCase()]: false
      }

    default:
      return state;
  }
};

export default modifiers;
