import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import AppModal from '../components/AppModal';
import ApiTokensPanel from './ApiTokensPanel';
import { hideSettings as hideSettingsAction, toggleSetting } from '../actions';
import type { SettingsState } from '../reducers/settings';

type BooleanSettingKey = {
  [Key in keyof SettingsState]: SettingsState[Key] extends boolean ? Key : never;
}[keyof SettingsState];

interface SettingDefinition {
  copy: string;
  description?: string;
  setting: BooleanSettingKey;
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

interface Props {
  hideSettings: () => unknown;
  settings: SettingsState;
  settingsVisible: boolean;
  toggleSetting: (setting: BooleanSettingKey) => unknown;
}

function renderSetting(
  { setting, copy, description, subsettings }: SettingDefinition,
  settings: SettingsState,
  toggleSetting: (setting: BooleanSettingKey) => unknown,
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
  toggleSetting,
}: Props) => (
  <AppModal
    isOpen={settingsVisible}
    onRequestClose={hideSettings}
  >
    <Wrapper>
      <h1 style={{ marginTop: 0 }}>Settings</h1>
      <ul>
        {SETTINGS.map(item => renderSetting(item, settings, toggleSetting))}
      </ul>
      <DeveloperPanel>
        <h2>Developer</h2>
        <ul>
          {DEVELOPER_SETTINGS.map(item => renderSetting(item, settings, toggleSetting))}
        </ul>
      </DeveloperPanel>
      <ApiTokensPanel />
    </Wrapper>
  </AppModal>
);

export default connect(
  (state: { settingsVisible: boolean; settings: SettingsState }) => ({
    settingsVisible: state.settingsVisible,
    settings: state.settings,
  }),
  dispatch => ({
    hideSettings: () => dispatch(hideSettingsAction()),
    toggleSetting: (setting: BooleanSettingKey) => dispatch(toggleSetting(setting)),
  }),
)(Settings);
