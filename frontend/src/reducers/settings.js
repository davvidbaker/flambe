import { SETTING_TOGGLE } from '../actions';

const defaultState = {
  reactiveThreadHeight: true
};

function settings(state = defaultState, action) {
  switch (action.type) {
    case SETTING_TOGGLE:
      return { ...state, [action.setting]: !state[action.setting] };
    default:
      return state;
  }
}

export default settings;
