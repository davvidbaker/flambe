import { SETTING_TOGGLE } from '../actions';

export interface SettingsState {
  absoluteTimeLabels: boolean;
  twelveHourClock: boolean;
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
  absoluteTimeLabels: false,
  twelveHourClock: false,
  attentionDrivenThreadOrder: true,
  attentionFlows: false,
  activityMuteOpacity: 0.1,
  activityMute: false,
  reactiveThreadHeight: true,
  suspendResumeFlows: true,
  suspendResumeFlowsOnlyForFocusedActivity: false,
  uniformBlockHeight: false,
};

type ToggleAction = { setting?: keyof SettingsState; type: string };

function settings(state: SettingsState = defaultState, action: ToggleAction): SettingsState {
  if (action.type !== SETTING_TOGGLE) return state;
  const setting = action.setting;
  if (!setting) return state;
  if (typeof state[setting] !== 'boolean') return state;
  return { ...state, [setting]: !state[setting] } as SettingsState;
}

export default settings;
