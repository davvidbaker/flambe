import React, { Component, type ReactNode } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';

import { updateThread, deleteThread, hideThread } from '../actions';
import { getFilterExcludes, getTimeline, type TimelineState } from '../reducers/timeline';

import { InputFromButton } from './Button';
import DeleteButton from './DeleteButton';

import type { Activity } from '../types/Activity';

type Props = {
  canHide: boolean;
  updateThread: (id: number, updates: { name: string }) => unknown;
  deleteThread: (id: number) => unknown;
  hideThread: (id: number) => unknown;
  closeThreadDetail: () => void;
  activities: Activity[] | Record<string, Activity>;
  id: number | null;
  name?: string;
};

class ThreadDetail extends Component<Props> {
  updateName = (name: string): void => {
    if (this.props.id === null) return;
    this.props.updateThread(this.props.id, { name });
  };

  delete = (): void => {
    if (this.props.id === null) return;
    this.props.closeThreadDetail();
    this.props.deleteThread(this.props.id);
  };

  hide = (): void => {
    if (this.props.id === null || !this.props.canHide) return;
    this.props.closeThreadDetail();
    this.props.hideThread(this.props.id);
  };

  render(): ReactNode {
    const suspendedActivities = Object.values(this.props.activities).filter(
      activity => activity.thread_id === this.props.id && activity.status === 'suspended',
    );

    return (
      <Modal
        contentLabel="Thread Details"
        isOpen={!!this.props.id}
        shouldCloseOnOverlayClick
        onRequestClose={this.props.closeThreadDetail}
      >
        <h1>Thread Details</h1>
        <InputFromButton submit={this.updateName} placeholderIsDefaultValue>
          {this.props.name ?? ''}
        </InputFromButton>
        <button
          disabled={!this.props.canHide}
          onClick={this.hide}
          title={this.props.canHide ? undefined : 'Keep at least one thread visible'}
          type="button"
        >
          Hide thread
        </button>
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
  (state: { timeline: TimelineState }) => {
    const threads = getTimeline(state).threads ?? {};
    const hidden = new Set(getFilterExcludes(state).map(String));
    const visibleCount = Object.keys(threads).filter(id => !hidden.has(id)).length;
    return { canHide: visibleCount > 1 };
  },
  dispatch => ({
    updateThread: (id: number, updates: { name: string }) => dispatch(updateThread(id, updates)),
    deleteThread: (id: number) => dispatch(deleteThread(id)),
    hideThread: (id: number) => dispatch(hideThread(id)),
  }),
)(ThreadDetail);
