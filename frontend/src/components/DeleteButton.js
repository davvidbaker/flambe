// @flow

import React, { Component } from 'react';

// flow-ignore
import Modal from 'react-modal';

type Props = {
  onConfirm: () => mixed,
  children: string,
};

type State = {
  modalIsOpen: boolean,
};

class DeleteButton extends Component<Props, State> {
  state = {
    modalIsOpen: false,
  };

  openModal = () => {
    this.setState({ modalIsOpen: true });
  };

  closeModal = () => {
    this.setState({ modalIsOpen: false });
  };

  focusConfirmButton = () => {
    this.confirmButton.focus();
  };

  render() {
    return [
      <button key="button" onClick={this.openModal}>
        {this.props.children}
      </button>,
      <Modal
        key="modal"
        isOpen={this.state.modalIsOpen}
        contentLabel="confirm deletion"
        onRequestClose={this.closeModal}
        onAfterOpen={this.focusConfirmButton}
      >
        <button
          onClick={() => {
            this.props.onConfirm();
            this.closeModal();
          }}
          ref={btn => {
            this.confirmButton = btn;
          }}
        >
          Are you sure you want to delete this?
        </button>
        <em>You WILL NOT be able to undo this action.</em>
      </Modal>,
    ];
  }
}

export default DeleteButton;
