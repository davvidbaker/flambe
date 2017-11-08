// @flow

import React, { Component } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import tinycolor from 'tinycolor2';

import { colors } from 'styles';
import Button from './Button';

const GREY = tinycolor(colors.text)
  .lighten(60)
  .toString();

// 🏋️ lift this whole thing up really
const ModalContent = styled.div`
  h2 {
    border-bottom: 1px solid #d6dadc;
    color: ${GREY};
    font-size: unset;
    font-weight: unset;
    line-height: 3rem;
    margin: 0 0.5em;
    padding: 0 1em;
    text-align: center;
  }

  .modal-body {
    padding: 0 0.5em 0.5em;

    p {
    }
  }
`;

type Props = {
  onConfirm: () => mixed,
  contentLabel: string,
  message: string,
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
        Delete
      </button>,
      <Modal
        key="modal"
        isOpen={this.state.modalIsOpen}
        contentLabel={this.props.contentLabel}
        onRequestClose={this.closeModal}
        onAfterOpen={this.focusConfirmButton}
        style={{
          content: {
            right: 'unset',
            bottom: 'unset',
            padding: 0,
            width: '300px',
          },
        }}
      >
        <ModalContent>
          <h2>{this.props.contentLabel}</h2>
          <div className="modal-body">
            <p>{this.props.message}</p>
            <Button
              additionalStyles={`
              background: ${colors.red};
              width: 100%;
              line-height: 2rem;
              font-size: unset;
              font-weight: bold;
              color: white;

              &:hover {
                background: ${tinycolor(colors.red)
    .darken(5)
    .toString()}
              }

              &:active {
                background: ${tinycolor(colors.red)
    .darken(10)
    .toString()}
              }
              `}
              innerRef={btn => {
                this.confirmButton = btn;
              }}
              onClick={() => {
                this.props.onConfirm();
                this.closeModal();
              }}
            >
              Delete
            </Button>
          </div>
        </ModalContent>
      </Modal>,
    ];
  }
}

export default DeleteButton;
