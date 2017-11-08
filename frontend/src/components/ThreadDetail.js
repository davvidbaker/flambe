import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';

import { updateThread } from 'actions';

import { InputFromButton } from './Button';

type Props = {
  updateThread: (name: string) => mixed,
  id: number,
  name: string,
};

class ThreadDetail extends Component<Props> {
  updateName = (name: string) => {
    this.props.updateThread(this.props.id, { name });
  };

  render() {
    return (
      <Modal contentLabel="Thread Details" isOpen>
        <h1>Thread Details</h1>
        <InputFromButton submit={this.updateName}>
          {this.props.name}
        </InputFromButton>
      </Modal>
    );
  }
}

export default connect(null, dispatch => ({
  updateThread: (id, updates) => dispatch(updateThread(id, updates)),
}))(ThreadDetail);
