import { SETTING_SET, SETTING_TOGGLE, USER_FETCH } from '../actions';
import {
  clampSwyzzleIdleSeconds,
  SWYZZLE_IDLE_SECONDS_DEFAULT,
} from '../utilities/swyzzleIdle';
import {
  DEFAULT_SWYZZLE_EFFECT,
  resolveSwyzzleEffect,
  type SwyzzleEffect,
} from '../vendor/swyzzle';
import {
  clampPresetZoomDuration,
  loadPresetZoomSettings,
  normalizePresetZoomCurve,
  serializePresetZoomCurve,
} from '../utilities/presetZoomSettings';

export interface SettingsState {
  absoluteTimeLabels: boolean;
  twelveHourClock: boolean;
  activityMute: boolean;
  activityMuteOpacity: number;
  attentionDrivenThreadOrder: boolean;
  attentionFlows: boolean;
  presetPanCurve: string;
  presetZoomCurve: string;
  presetZoomCurvesLinked: boolean;
  presetZoomDurationMs: number;
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
  /** Dev: idle seconds before the Swyzzle overlay appears; session-only. */
  swyzzleIdleSeconds: number;
  suspendResumeFlows: boolean;
  suspendResumeFlowsOnlyForFocusedActivity: boolean;
  uniformBlockHeight: boolean;
}

export const USER_SETTING_KEYS = ['rightAlignTimelineText'] as const;
export type UserSettingKey = (typeof USER_SETTING_KEYS)[number];

export function isUserSettingKey(setting: string): setting is UserSettingKey {
  return (USER_SETTING_KEYS as readonly string[]).includes(setting);
}

const presetZoom = loadPresetZoomSettings();

const defaultState: SettingsState = {
  absoluteTimeLabels: false,
  twelveHourClock: false,
  attentionDrivenThreadOrder: true,
  attentionFlows: false,
  presetPanCurve: serializePresetZoomCurve(presetZoom.panCurve),
  presetZoomCurve: serializePresetZoomCurve(presetZoom.zoomCurve),
  presetZoomCurvesLinked: presetZoom.curvesLinked,
  presetZoomDurationMs: presetZoom.durationMs,
  darkerAsWeGoDown: true,
  rightAlignTimelineText: false,
  activityMuteOpacity: 0.1,
  activityMute: false,
  reactiveThreadHeight: true,
  showActivityIds: false,
  swyzzle: false,
  swyzzleEffect: DEFAULT_SWYZZLE_EFFECT,
  swyzzleIdleSeconds: SWYZZLE_IDLE_SECONDS_DEFAULT,
  suspendResumeFlows: true,
  suspendResumeFlowsOnlyForFocusedActivity: false,
  uniformBlockHeight: false,
};

type SettingsAction = {
  setting?: keyof SettingsState;
  type: string;
  value?: boolean | string | number;
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
    if (setting === 'swyzzleIdleSeconds') {
      return { ...state, swyzzleIdleSeconds: clampSwyzzleIdleSeconds(action.value) };
    }
    if (setting === 'presetZoomDurationMs') {
      return { ...state, presetZoomDurationMs: clampPresetZoomDuration(action.value) };
    }
    if (
      (setting === 'presetPanCurve' || setting === 'presetZoomCurve')
      && typeof action.value === 'string'
    ) {
      try {
        return {
          ...state,
          [setting]: serializePresetZoomCurve(
            normalizePresetZoomCurve(JSON.parse(action.value)),
          ),
        };
      } catch {
        return state;
      }
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
