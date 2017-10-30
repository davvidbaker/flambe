// @flow
import React, { Component } from 'react';
import styled from 'styled-components';

import WithEventListeners from 'components/WithEventListeners';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
`;

type Props = {
  isOpen: boolean,
  children: () => mixed,
  close: () => mixed,
  onClose: () => mixed,
};

class Popup extends Component<Props> {
  state = {};

  render() {
    const { isOpen, onClose, children } = this.props;
    return isOpen ? ( // flow-ignore
      <WithEventListeners
        node={document}
        eventListeners={[
          [
            'mousedown',
            evt => {
              // ⚠️ event.path might only work in chrome!
              let clickedOnPopup = false;
              evt.path.forEach(element => {
                if (element.classList && element.classList.contains('popup')) {
                  clickedOnPopup = true;
                }
              });
              if (!clickedOnPopup && this.props.isOpen) {
                this.props.onClose();
              } else {
                console.log('clicked on popup', evt);
              }
            },
          ],
          [
            'keydown',
            evt => {
              if (evt.key === 'Enter' || evt.key === 'Escape') {
                this.props.onClose();
              }
            },
          ],
        ]}
      >
        {() => (
          <div
            onClick={evt => {
              console.log('clicked on popup', evt);
              evt.stopPropagation();
              evt.nativeEvent.stopPropagation();
            }}
            key="popup"
            className="popup"
            style={{ position: 'absolute' }}
          >
            {children()}
          </div>
        )}
      </WithEventListeners>
    ) : null;
  }
}

export default Popup;
