import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Modal from 'react-modal';

import { hideSettings as hideSettingsAction } from '../actions';

const Settings = ({ settingsVisible, hideSettings }) => (
  <Modal
    isOpen={settingsVisible}
    appElement={window.root}
    onRequestClose={hideSettings}
  >
    <h1>Settings</h1>
    <div />
  </Modal>
);

export default connect(
  state => ({ settingsVisible: state.settingsVisible }),
  dispatch => ({
    hideSettings: () => dispatch(hideSettingsAction())
  })
)(Settings);
