import React, { Component, type ReactNode } from 'react';
import WithEventListeners, { type EventListenerTuple } from './WithEventListeners';

interface Props { isOpen: boolean; children: () => ReactNode; onClose: () => void }

class Popup extends Component<Props> {
  render(): ReactNode {
    const { isOpen, onClose, children } = this.props;
    if (!isOpen) return null;
    const eventListeners: EventListenerTuple[] = [
      ['mousedown', event => {
        const clickedOnPopup = event.composedPath().some(element => element instanceof Element && element.classList.contains('popup'));
        if (!clickedOnPopup && this.props.isOpen) onClose();
      }],
      ['keydown', event => { if (event instanceof KeyboardEvent && (event.key === 'Enter' || event.key === 'Escape')) onClose(); }],
    ];
    return <WithEventListeners node={document} eventListeners={eventListeners}>{() =>
      <div onClick={event => { event.stopPropagation(); event.nativeEvent.stopPropagation(); }} className="popup" style={{ position: 'absolute' }}>{children()}</div>
    }</WithEventListeners>;
  }
}
export default Popup;
