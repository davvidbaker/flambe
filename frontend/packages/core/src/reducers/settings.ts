import { SETTING_TOGGLE } from '../actions';

export interface SettingsState {
  activityMute: boolean;
  activityMuteOpacity: number;
  attentionDrivenThreadOrder: boolean;
  attentionFlows: boolean;
  reactiveThreadHeight: boolean;
  suspendResumeFlows: boolean;
  suspendResumeFlowsOnlyForFocusedActivity: boolean;
  uniformBlockHeight: boolean;
}

const defaultState: SettingsState = {
  attentionDrivenThreadOrder: true,
  attentionFlows: false,
  activityMuteOpacity: 0.1,
  activityMute: false,
  reactiveThreadHeight: true,
  suspendResumeFlows: true,
  suspendResumeFlowsOnlyForFocusedActivity: false,
  uniformBlockHeight: false,
};

type ToggleAction = { setting: keyof SettingsState; type: string };

function settings(state: SettingsState = defaultState, action: ToggleAction): SettingsState {
  if (action.type !== SETTING_TOGGLE) return state;
  const setting = action.setting;
  if (typeof state[setting] !== 'boolean') return state;
  return { ...state, [setting]: !state[setting] } as SettingsState;
}

export default settings;
