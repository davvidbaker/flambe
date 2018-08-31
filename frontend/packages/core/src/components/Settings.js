import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import DraggableModal from '../components/DraggableModal';
import { hideSettings as hideSettingsAction, toggleSetting } from '../actions';

const SETTINGS = [
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

const Subsetting = styled.div`
  margin-left: 20px;

  color: ${props => (props.disabled ? 'lightgrey' : 'auto')};
`;

const Wrapper = styled.div`
  font-size: 11px;

  ul {
    list-style: none;
    padding: 0;
  }
  li {
    margin-bottom: 5px;
  }
`;

const Settings = ({
  settingsVisible,
  hideSettings,
  settings,
  toggleSetting,
}) => (
  <DraggableModal
    isOpen={settingsVisible}
    onRequestClose={hideSettings}
    onDragStop={(e, { x, y }) => {
      window.localStorage.setItem('settingsPositionX', x);
      window.localStorage.setItem('settingsPositionY', y);
    }}
    defaultPosition={{
      x: Number(window.localStorage.getItem('settingsPositionX')),
      y: Number(window.localStorage.getItem('settingsPositionY')),
    }}
  >
    <Wrapper>
      <h1 style={{ marginTop: 0 }}>Settings</h1>
      <ul>
        {SETTINGS.map(({ setting, copy, description, subsettings }) => (
          <li key={setting}>
            <Setting>
              <input
                checked={settings[setting]}
                onChange={() => toggleSetting(setting)}
                type="checkbox"
                id={setting}
              />
              <label htmlFor={setting}>{copy}</label>
              <span>{description}</span>
              {subsettings &&
                subsettings.map(
                  ({ copy, description, setting: subsetting }) => (
                    <Setting key={subsetting}>
                      <Subsetting disabled={!settings[setting]}>
                        <input
                          checked={settings[subsetting]}
                          onChange={() => toggleSetting(subsetting)}
                          type="checkbox"
                          id={subsetting}
                          disabled={!settings[setting]}
                        />
                        <label htmlFor={subsetting}>{copy}</label>
                        <span>{description}</span>
                      </Subsetting>
                    </Setting>
                  ),
                )}
            </Setting>
          </li>
        ))}
      </ul>
    </Wrapper>
  </DraggableModal>
);

export default connect(
  state => ({
    settingsVisible: state.settingsVisible,
    settings: state.settings,
  }),
  dispatch => ({
    hideSettings: () => dispatch(hideSettingsAction()),
    toggleSetting: setting => dispatch(toggleSetting(setting)),
  }),
)(Settings);
