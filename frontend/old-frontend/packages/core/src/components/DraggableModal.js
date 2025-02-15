import React from 'react';
import Modal from 'react-modal';
import Draggable from 'react-draggable';
import styled from 'styled-components';

const styleOverrides = {
  overlay: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
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
  /* 👇 because of the drag handle */
  padding-top: 0px; 
  pointer-events: all;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  .handle {
    height: 10px;
    background: #ddd;
    border-bottom: 5px solid white;
    cursor: move;
    width: 200%;
    margin-left: -50%;
  }
`;

const DraggableModal = ({
  isOpen,
  children,
  onRequestClose,
  defaultPosition,
  onDragStop,
}) => {
  return (
    <Modal
      onRequestClose={onRequestClose}
      isOpen={isOpen}
      style={styleOverrides}
    >
      {/* <Draggable
        handle=".handle"
        defaultPosition={defaultPosition}
        onStop={onDragStop}
        bounds="body"
      > */}
        <ActualContent>
          <>
            <div className="handle" />
            {children}
          </>
        </ActualContent>
      {/* </Draggable> */}
    </Modal>
  );
};

export default DraggableModal;
