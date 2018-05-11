import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Modal from 'react-modal';

import { hideSettings as hideSettingsAction, toggleSetting } from '../actions';

const SETTINGS = [
  {
    setting: 'reactiveThreadHeight',
    copy: 'Reactive Thread Height',
    description:
      'The height of a thread dynamically adjusts its height depending on how many levels are in the visible window.'
  },
  {
    setting: 'suspendResumeFlows',
    copy: 'Suspend/Resume Flows'
  }
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
  toggleSetting
}) => (
  <Modal
    isOpen={settingsVisible}
    appElement={window.root}
    onRequestClose={hideSettings}
  >
    <Wrapper>
      <h1>Settings</h1>
      <ul>
        {SETTINGS.map(({ setting, copy, description }) => (
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
            </Setting>
          </li>
        ))}
      </ul>
    </Wrapper>
  </Modal>
);

export default connect(
  state => ({
    settingsVisible: state.settingsVisible,
    settings: state.settings
  }),
  dispatch => ({
    hideSettings: () => dispatch(hideSettingsAction()),
    toggleSetting: setting => dispatch(toggleSetting(setting))
  })
)(Settings);
