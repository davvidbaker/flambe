import React, { type ReactNode } from 'react';
import Modal from 'react-modal';
import type { Styles } from 'react-modal';
import styled from 'styled-components';

const styleOverrides: Styles = {
  overlay: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  content: {
    bottom: "unset",
    overflow: "visible",
    padding: 0,
    border: "none",
    borderRadius: 0,
    position: "static",
    background: "none",
    pointerEvents: "none"
  }
};

const ActualContent = styled.div`
  border-radius: 4px;
  background: white;
  border: 1px solid rgb(204, 204, 204);
  padding: 10px;
  pointer-events: all;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2);
  overflow: auto;
  max-height: min(80vh, 640px);
  max-width: min(90vw, 420px);
`;

interface Props {
  children: ReactNode;
  isOpen: boolean;
  onRequestClose: () => unknown;
}

const AppModal = ({
  isOpen,
  children,
  onRequestClose,
}: Props) => {
  return (
    <Modal
      onRequestClose={onRequestClose}
      isOpen={isOpen}
      style={styleOverrides}
    >
      <ActualContent>
        {children}
      </ActualContent>
    </Modal>
  );
};

export default AppModal;
