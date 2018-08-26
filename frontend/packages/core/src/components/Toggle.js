// @flow
import React, { Component } from 'react';

type Props = {
  children: (params: {
    on: boolean,
    setOn: func,
    setOff: func,
    toggle: func,
  }) => React.ComponentType<*>,
};

type State = {
  on: boolean,
};

class Toggle extends Component<Props, State> {
  state = { on: false };

  setOn = () => {
    this.setState({ on: true });
  };

  setOff = () => {
    this.setState({ on: true });
  };

  toggle = () => {
    this.setState(({ on }) => ({ on: !on }));
  };

  render() {
    const { setOn, setOff, toggle, state } = this;

    return this.props.children({
      on: state.on,
      setOn: setOn,
      setOff: setOff,
      toggle: toggle,
    });
  }
}

export default Toggle;
