import { SETTING_SET, SETTING_TOGGLE, USER_FETCH } from '../actions';

export interface SettingsState {
  absoluteTimeLabels: boolean;
  twelveHourClock: boolean;
  activityMute: boolean;
  activityMuteOpacity: number;
  attentionDrivenThreadOrder: boolean;
  attentionFlows: boolean;
  /** Shade nested flame-chart blocks darker at each deeper level. */
  darkerAsWeGoDown: boolean;
  /** Draw activity names against the right edge of each flame-chart block. */
  rightAlignTimelineText: boolean;
  reactiveThreadHeight: boolean;
  /** Dev: paint activity ids on blocks instead of names. */
  showActivityIds: boolean;
  /** Dev: overlay the Swyzzle WebGL melt on the flame chart. */
  swyzzle: boolean;
  suspendResumeFlows: boolean;
  suspendResumeFlowsOnlyForFocusedActivity: boolean;
  uniformBlockHeight: boolean;
}

export const USER_SETTING_KEYS = ['rightAlignTimelineText'] as const;
export type UserSettingKey = (typeof USER_SETTING_KEYS)[number];

export function isUserSettingKey(setting: string): setting is UserSettingKey {
  return (USER_SETTING_KEYS as readonly string[]).includes(setting);
}

const defaultState: SettingsState = {
  absoluteTimeLabels: false,
  twelveHourClock: false,
  attentionDrivenThreadOrder: true,
  attentionFlows: false,
  darkerAsWeGoDown: true,
  rightAlignTimelineText: false,
  activityMuteOpacity: 0.1,
  activityMute: false,
  reactiveThreadHeight: true,
  showActivityIds: false,
  swyzzle: false,
  suspendResumeFlows: true,
  suspendResumeFlowsOnlyForFocusedActivity: false,
  uniformBlockHeight: false,
};

type SettingsAction = {
  setting?: keyof SettingsState;
  type: string;
  value?: boolean;
  data?: { settings?: Partial<Record<UserSettingKey, unknown>> };
};

function settings(state: SettingsState = defaultState, action: SettingsAction): SettingsState {
  if (action.type === `${USER_FETCH}_SUCCEEDED`) {
    const incoming = action.data?.settings?.rightAlignTimelineText;
    if (typeof incoming === 'boolean') {
      return { ...state, rightAlignTimelineText: incoming };
    }
    return state;
  }

  const setting = action.setting;
  if (!setting || typeof state[setting] !== 'boolean') return state;

  if (action.type === SETTING_SET) {
    return { ...state, [setting]: Boolean(action.value) } as SettingsState;
  }

  if (action.type !== SETTING_TOGGLE) return state;
  return { ...state, [setting]: !state[setting] } as SettingsState;
}

export default settings;
