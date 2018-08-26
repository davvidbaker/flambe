// @flow
/* ⚠️ Refactor to use Toggle */
import React, { Component } from 'react';

import Button from './Button';
import { PropsTable } from 'docz';

type State = {
  toggledOn: boolean,
};

type Props = {
  toggles: (toggles: func) => React.Component<*>,
  children: string,
  title: string,
  unstyled?: bllean,
};

class ToggleButton extends Component<Props, State> {
  state = {
    toggledOn: false,
  };

  constructor() {
    super();
  }

  toggle = () => {
    this.setState({
      toggledOn: !this.state.toggledOn,
    });
  };

  render() {
    const { unstyled, title, toggles, children } = this.props;

    return (
      <>
        <Button title={title} onClick={this.toggle} unstyled={unstyled}>
          {children}
        </Button>
        {this.state.toggledOn === true ? toggles(this.toggle) : null}
      </>
    );
  }
}

export default ToggleButton;
