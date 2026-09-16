import { SETTING_SET, SETTING_TOGGLE } from '../actions';

export interface SettingsState {
  absoluteTimeLabels: boolean;
  twelveHourClock: boolean;
  activityMute: boolean;
  activityMuteOpacity: number;
  attentionDrivenThreadOrder: boolean;
  attentionFlows: boolean;
  /** Shade nested flame-chart blocks darker at each deeper level. */
  darkerAsWeGoDown: boolean;
  reactiveThreadHeight: boolean;
  /** Dev: paint activity ids on blocks instead of names. */
  showActivityIds: boolean;
  suspendResumeFlows: boolean;
  suspendResumeFlowsOnlyForFocusedActivity: boolean;
  uniformBlockHeight: boolean;
}

const defaultState: SettingsState = {
  absoluteTimeLabels: false,
  twelveHourClock: false,
  attentionDrivenThreadOrder: true,
  attentionFlows: false,
  darkerAsWeGoDown: true,
  activityMuteOpacity: 0.1,
  activityMute: false,
  reactiveThreadHeight: true,
  showActivityIds: false,
  suspendResumeFlows: true,
  suspendResumeFlowsOnlyForFocusedActivity: false,
  uniformBlockHeight: false,
};

type SettingsAction = { setting?: keyof SettingsState; type: string; value?: boolean };

function settings(state: SettingsState = defaultState, action: SettingsAction): SettingsState {
  const setting = action.setting;
  if (!setting || typeof state[setting] !== 'boolean') return state;

  if (action.type === SETTING_SET) {
    return { ...state, [setting]: Boolean(action.value) } as SettingsState;
  }

  if (action.type !== SETTING_TOGGLE) return state;
  return { ...state, [setting]: !state[setting] } as SettingsState;
}

export default settings;
