import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';

import { updateThread, deleteThread } from 'actions';

import { InputFromButton } from './Button';
import DeleteButton from './DeleteButton';

type Props = {
  updateThread: (name: string) => mixed,
  deleteThread: (id: number) => mixed,
  closeThreadDetail: () => mixed,
  id: number,
  name: string,
};

class ThreadDetail extends Component<Props> {
  updateName = (name: string) => {
    this.props.updateThread(this.props.id, { name });
  };

  delete = () => {
    this.props.closeThreadDetail();
    this.props.deleteThread(this.props.id);
  };

  render() {
    return (
      <Modal
        contentLabel="Thread Details"
        isOpen={!!this.props.id}
        shouldCloseOnOverlayClick
        onRequestClose={this.props.closeThreadDetail}
      >
        <h1>Thread Details</h1>
        <InputFromButton submit={this.updateName}>
          {this.props.name}
        </InputFromButton>
        <DeleteButton
          contentLabel="Delete Thread?"
          message="All activities will be removed from the thread and lost forever. There is no undo."
          onConfirm={this.delete}
        />
      </Modal>
    );
  }
}

export default connect(null, dispatch => ({
  updateThread: (id, updates) => dispatch(updateThread(id, updates)),
  deleteThread: (id: number) => dispatch(deleteThread(id)),
}))(ThreadDetail);
