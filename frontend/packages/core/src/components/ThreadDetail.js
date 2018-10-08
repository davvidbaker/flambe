import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import filter from 'lodash/fp/filter';
import pipe from 'lodash/fp/pipe';

import { updateThread, deleteThread } from '../actions';

import { InputFromButton } from './Button';
import DeleteButton from './DeleteButton';

import type { Activity } from '../types/Activity';

type Props = {
  updateThread: (name: string) => mixed,
  deleteThread: (id: number) => mixed,
  closeThreadDetail: () => mixed,
  activities: Activity[],
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
    const suspendedActivities =
      this.props.activities
      |> filter(activity => activity.thread_id === this.props.id)
      |> filter(activity => activity.status === 'suspended');

    return (
      <Modal
        contentLabel="Thread Details"
        isOpen={!!this.props.id}
        shouldCloseOnOverlayClick
        onRequestClose={this.props.closeThreadDetail}
      >
        <h1>Thread Details</h1>
        <InputFromButton submit={this.updateName} placeholderIsDefaultValue>
          {this.props.name}
        </InputFromButton>
        <DeleteButton
          dialogLabel="Delete Thread?"
          message="All activities will be removed from the thread and lost forever. There is no undo."
          onConfirm={this.delete}
        />
        <h2>Suspended Activities</h2>
        <ul>
          {suspendedActivities.map(a => (
            <li key={a.name}>{a.name}</li>
          ))}
        </ul>
      </Modal>
    );
  }
}

export default connect(
  null,
  dispatch => ({
    updateThread: (id, updates) => dispatch(updateThread(id, updates)),
    deleteThread: (id: number) => dispatch(deleteThread(id)),
  }),
)(ThreadDetail);
