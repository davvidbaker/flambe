import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import AppModal from '../components/AppModal';
import ApiTokensPanel from './ApiTokensPanel';
import { hideSettings as hideSettingsAction, setSetting, toggleSetting } from '../actions';
import type { SettingsState } from '../reducers/settings';
import { commitUrl, fetchBuildInfo, shortSha, type BuildInfo } from '../utilities/buildInfo';
import {
  SWYZZLE_IDLE_SECONDS_MAX,
  SWYZZLE_IDLE_SECONDS_MIN,
} from '../utilities/swyzzleIdle';
import { SWYZZLE_EFFECTS } from '../vendor/swyzzle';

type BooleanSettingKey = {
  [Key in keyof SettingsState]: SettingsState[Key] extends boolean ? Key : never;
}[keyof SettingsState];

type StringSettingKey = {
  [Key in keyof SettingsState]: SettingsState[Key] extends string ? Key : never;
}[keyof SettingsState];

type NumberSettingKey = {
  [Key in keyof SettingsState]: SettingsState[Key] extends number ? Key : never;
}[keyof SettingsState];

interface SelectSettingDefinition {
  copy: string;
  options: readonly string[];
  setting: StringSettingKey;
}

interface NumberSettingDefinition {
  copy: string;
  max: number;
  min: number;
  setting: NumberSettingKey;
}

interface SettingDefinition {
  copy: string;
  description?: string;
  setting: BooleanSettingKey;
  number?: NumberSettingDefinition;
  select?: SelectSettingDefinition;
  subsettings?: SettingDefinition[];
}

const SETTINGS: SettingDefinition[] = [
  {
    setting: 'attentionFlows',
    copy: 'Attention Flows',
  },
  {
    setting: 'attentionDrivenThreadOrder',
    copy: 'Attention Driven Thread Order',
    description: 'Threads are ordered by what was worked on most recently',
  },
  {
    setting: 'activityMute',
    copy: 'Mute Activities',
    description: 'Dim every activity except the focused one (⌘M / Ctrl+M).',
  },
  {
    setting: 'reactiveThreadHeight',
    copy: 'Reactive Thread Height',
    description:
      'The height of a thread dynamically adjusts its height depending on how many levels are in the visible window.',
  },
  {
    setting: 'suspendResumeFlows',
    copy: 'Suspend/Resume Flows',
    subsettings: [
      {
        copy: 'Only show flows for the focused  activity.',
        setting: 'suspendResumeFlowsOnlyForFocusedActivity',
        description:
          'This should be more performant than showing all the flows.',
      },
    ],
  },
  {
    setting: 'uniformBlockHeight',
    copy: 'Uniform Block Height',
    description: 'In collapsed threads, all blocks are the same height.',
  },
  {
    setting: 'darkerAsWeGoDown',
    copy: 'Darker as we go down',
    description: 'Shade nested activities darker at each deeper level.',
  },
  {
    setting: 'rightAlignTimelineText',
    copy: 'Right-align Timeline Text',
    description: 'Draw activity names against the right edge of each block.',
  },
  {
    setting: 'absoluteTimeLabels',
    copy: 'Absolute Time Labels',
    description:
      'Show clock times on the timeline axis instead of time ago. Granularity follows the visible zoom level.',
    subsettings: [
      {
        setting: 'twelveHourClock',
        copy: '12-hour clock',
        description: 'Use AM/PM instead of 24-hour time.',
      },
    ],
  },
];

const DEVELOPER_SETTINGS: SettingDefinition[] = [
  {
    setting: 'showActivityIds',
    copy: 'Show Activity IDs',
    description:
      'Label flame-chart blocks with activity id instead of name, for matching what you see to database events.',
  },
  {
    setting: 'swyzzle',
    copy: 'Swyzzle',
    description:
      'After the configured idle time, melt the flame chart. Move the pointer to stir it. Space or Escape clears it.',
    number: {
      copy: 'Idle seconds',
      setting: 'swyzzleIdleSeconds',
      min: SWYZZLE_IDLE_SECONDS_MIN,
      max: SWYZZLE_IDLE_SECONDS_MAX,
    },
    select: {
      copy: 'Shader',
      setting: 'swyzzleEffect',
      options: SWYZZLE_EFFECTS,
    },
  },
];

const Setting = styled.div`
  span {
    display: block;
    color: #999;
    font-size: 0.8em;
  }
  input {
    margin-left: 0;
  }
`;

const Subsetting = styled.div<{ $disabled: boolean }>`
  margin-left: 20px;

  color: ${props => (props.$disabled ? 'lightgrey' : 'inherit')};
`;

const ShaderSelect = styled.select`
  display: block;
  margin-top: 4px;
  font-size: 11px;
`;

const IdleSecondsInput = styled.input`
  display: block;
  margin-top: 4px;
  font-size: 11px;
  width: 4.5em;
`;

const Wrapper = styled.div`
  font-size: 11px;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    margin-bottom: 5px;
  }
`;

const DeveloperPanel = styled.div`
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 4px;
  background: #f0f0f0;
  border: 1px solid #ddd;

  h2 {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #777;
  }

  li:last-child {
    margin-bottom: 0;
  }
`;

const VersionBlock = styled.div`
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #ddd;

  dt {
    margin: 0 0 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #777;
  }

  dd {
    margin: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    word-break: break-all;
  }

  a {
    color: inherit;
  }

  button {
    margin-left: 8px;
    font-size: 11px;
  }
`;

interface Props {
  hideSettings: () => unknown;
  settings: SettingsState;
  settingsVisible: boolean;
  setSetting: (setting: string, value: boolean | string | number) => unknown;
  toggleSetting: (setting: BooleanSettingKey) => unknown;
}

function renderSetting(
  { setting, copy, description, number, select, subsettings }: SettingDefinition,
  settings: SettingsState,
  toggleSetting: (setting: BooleanSettingKey) => unknown,
  setSettingValue: (setting: string, value: boolean | string | number) => unknown,
) {
  return (
    <li key={setting}>
      <Setting>
        <input
          checked={Boolean(settings[setting])}
          onChange={() => toggleSetting(setting)}
          type="checkbox"
          id={setting}
        />
        <label htmlFor={setting}>{copy}</label>
        <span>{description}</span>
        {number && (
          <Subsetting $disabled={!settings[setting]}>
            <label htmlFor={number.setting}>{number.copy}</label>
            <IdleSecondsInput
              id={number.setting}
              type="number"
              min={number.min}
              max={number.max}
              step={1}
              value={Number(settings[number.setting])}
              disabled={!settings[setting]}
              onChange={event => setSettingValue(number.setting, event.target.valueAsNumber)}
            />
          </Subsetting>
        )}
        {select && (
          <Subsetting $disabled={!settings[setting]}>
            <label htmlFor={select.setting}>{select.copy}</label>
            <ShaderSelect
              id={select.setting}
              value={String(settings[select.setting])}
              disabled={!settings[setting]}
              onChange={event => setSettingValue(select.setting, event.target.value)}
            >
              {select.options.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </ShaderSelect>
          </Subsetting>
        )}
        {subsettings &&
          subsettings.map(
            ({ copy: subCopy, description: subDescription, setting: subsetting }) => (
              <Setting key={subsetting}>
                <Subsetting $disabled={!settings[setting]}>
                  <input
                    checked={Boolean(settings[subsetting])}
                    onChange={() => toggleSetting(subsetting)}
                    type="checkbox"
                    id={subsetting}
                    disabled={!settings[setting]}
                  />
                  <label htmlFor={subsetting}>{subCopy}</label>
                  <span>{subDescription}</span>
                </Subsetting>
              </Setting>
            ),
          )}
      </Setting>
    </li>
  );
}

const Settings = ({
  settingsVisible,
  hideSettings,
  settings,
  setSetting: setSettingValue,
  toggleSetting,
}: Props) => {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);

  useEffect(() => {
    if (!settingsVisible) return;
    let cancelled = false;
    fetchBuildInfo()
      .then(info => {
        if (!cancelled) setBuildInfo(info);
      })
      .catch(() => {
        if (!cancelled) setBuildInfo({ git_sha: 'unknown' });
      });
    return () => {
      cancelled = true;
    };
  }, [settingsVisible]);

  const sha = buildInfo?.git_sha ?? '…';
  const url = buildInfo ? commitUrl(buildInfo.git_sha) : null;

  return (
    <AppModal
      isOpen={settingsVisible}
      onRequestClose={hideSettings}
    >
    <Wrapper>
      <h1 style={{ marginTop: 0 }}>Settings</h1>
      <ul>
        {SETTINGS.map(item => renderSetting(item, settings, toggleSetting, setSettingValue))}
      </ul>
      <DeveloperPanel>
        <h2>Developer</h2>
        <ul>
          {DEVELOPER_SETTINGS.map(item =>
            renderSetting(item, settings, toggleSetting, setSettingValue),
          )}
        </ul>
        <VersionBlock>
          <dt>Deployed commit</dt>
          <dd>
            {url ? (
              <a href={url} rel="noreferrer" target="_blank" title={sha}>
                {shortSha(sha)}
              </a>
            ) : (
              <span title={sha}>{shortSha(sha)}</span>
            )}
            {buildInfo && buildInfo.git_sha !== 'unknown' && (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(buildInfo.git_sha);
                }}
              >
                Copy SHA
              </button>
            )}
          </dd>
        </VersionBlock>
      </DeveloperPanel>
      <ApiTokensPanel />
    </Wrapper>
    </AppModal>
  );
};

export default connect(
  (state: { settingsVisible: boolean; settings: SettingsState }) => ({
    settingsVisible: state.settingsVisible,
    settings: state.settings,
  }),
  dispatch => ({
    hideSettings: () => dispatch(hideSettingsAction()),
    setSetting: (setting: string, value: boolean | string | number) =>
      dispatch(setSetting(setting, value)),
    toggleSetting: (setting: BooleanSettingKey) => dispatch(toggleSetting(setting)),
  }),
)(Settings);
