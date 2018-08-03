import { SETTING_TOGGLE } from '../actions';

const defaultState = {
  attentionDrivenThreadOrder: true,
  attentionFlows: false,
  /* 💁 TODO make this adjustable */
  activityMuteOpacity: 0.1,
  activityMute: false,
  reactiveThreadHeight: true,
  suspendResumeFlows: true,
  uniformBlockHeight: false,
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
