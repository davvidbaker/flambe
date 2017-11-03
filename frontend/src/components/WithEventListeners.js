// @flow

import React, { Component } from 'react';

type Props = {
  node: HTMLElement,
  eventListeners: [string, () => mixed][],
  children: () => Component<*>,
};

class WithEventListeners extends Component<Props> {
  // 🤔 should event listeners be bound in componentDidMount or constructor?
  // see https://reactjs.org/docs/react-component.html#constructor
  componentDidMount() {
    this.props.eventListeners.forEach(([evt, func]) => {
      this.props.node.addEventListener(evt, func);
    });
  }

  componentWillUnmount() {
    this.props.eventListeners.forEach(([evt, func]) => {
      this.props.node.removeEventListener(evt, func);
    });
  }

  render() {
    return this.props.children();
  }
}

export default WithEventListeners;
