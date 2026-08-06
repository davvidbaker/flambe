// @flow

import React, { Component } from 'react';

type Props = {
  onConfirm: () => mixed,
  dialogLabel: string,
  message: string,
};

class DeleteButton extends Component<Props> {
  openDialog = () => {
    const { dialogLabel, message, onConfirm } = this.props;
    if (window.confirm(`${dialogLabel} Please confirm!\n\n${message}`)) {
      onConfirm();
    }
  };

  render() {
    return (
      <button onClick={this.openDialog}>
        {this.props.children || 'Delete'}
      </button>
    );
  }
}

export default DeleteButton;
