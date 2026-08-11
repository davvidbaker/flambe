import React, { Component, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  dialogLabel: string;
  message: string;
  onConfirm: () => void;
}

class DeleteButton extends Component<Props> {
  openDialog = (): void => {
    const { dialogLabel, message, onConfirm } = this.props;
    if (window.confirm(`${dialogLabel} Please confirm!\n\n${message}`)) onConfirm();
  };

  render(): ReactNode {
    return <button onClick={this.openDialog}>{this.props.children || 'Delete'}</button>;
  }
}

export default DeleteButton;
