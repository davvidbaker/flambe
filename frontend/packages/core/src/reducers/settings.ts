import { SETTING_SET, SETTING_TOGGLE, USER_FETCH } from '../actions';
import {
  DEFAULT_SWYZZLE_EFFECT,
  resolveSwyzzleEffect,
  type SwyzzleEffect,
} from '../vendor/swyzzle';

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
  /** Dev: which Swyzzle shader to run; session-only like other developer settings. */
  swyzzleEffect: SwyzzleEffect;
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
  swyzzleEffect: DEFAULT_SWYZZLE_EFFECT,
  suspendResumeFlows: true,
  suspendResumeFlowsOnlyForFocusedActivity: false,
  uniformBlockHeight: false,
};

type SettingsAction = {
  setting?: keyof SettingsState;
  type: string;
  value?: boolean | string;
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
  if (!setting || !(setting in state)) return state;

  if (action.type === SETTING_SET) {
    if (setting === 'swyzzleEffect') {
      return { ...state, swyzzleEffect: resolveSwyzzleEffect(action.value) };
    }
    if (typeof state[setting] === 'boolean') {
      return { ...state, [setting]: Boolean(action.value) } as SettingsState;
    }
    return state;
  }

  if (action.type !== SETTING_TOGGLE) return state;
  if (typeof state[setting] !== 'boolean') return state;
  return { ...state, [setting]: !state[setting] } as SettingsState;
}

export default settings;
