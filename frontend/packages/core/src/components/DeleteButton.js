// @flow

import React, { Component } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import tinycolor from 'tinycolor2';
import {
  AlertDialog,
  AlertDialogLabel,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogContent,
} from '@reach/alert-dialog';

import '@reach/dialog/styles.css';

import { colors } from '../styles';
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
`;

type Props = {
  onConfirm: () => mixed,
  dialogLabel: string,
  message: string,
};

type State = {
  showingDialog: boolean,
};

class DeleteButton extends Component<Props, State> {
  state = {
    showingDialog: false,
  };

  constructor() {
    super();
    this.cancelRef = React.createRef();
  }

  openDialog = () => {
    this.setState({ showingDialog: true });
    console.log(`🔥  this.cancelRef.current`, this.cancelRef);
  };

  closeDialog = () => {
    this.setState({ showingDialog: false });
  };

  render() {
    return (
      <>
        <button key="button" onClick={this.openDialog}>
          Delete
        </button>
        {this.state.showingDialog && (
          <AlertDialog leastDestructiveRef={this.cancelRef}>
            <AlertDialogLabel>
              {this.props.dialogLabel} Please Confirm!
            </AlertDialogLabel>

            <AlertDialogDescription>
              {this.props.message}
            </AlertDialogDescription>
            <div className="modal-body">
              <Button
                additionalStyles={`
              background: ${colors.red};
              width: 100%;
              line-height: 2rem;
              font-size: unset;
              font-weight: bold;
              color: white;
              margin: 10px 0;

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
                  this.closeDialog();
                }}
              >
                Delete
              </Button>
              <div style={{ textAlign: 'center' }}>
                <Button
                  looksLikeButton
                  innerRef={this.cancelRef}
                  onClick={this.closeDialog}
                  //   additionalStyles={`
                  // background: white;
                  // `}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDialog>
        )}
      </>
    );
  }
}

export default DeleteButton;
