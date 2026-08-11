import React, { Component, type ReactNode } from 'react';

import Button from './Button';

interface Props {
  children: ReactNode;
  title: string;
  toggles: (toggle: () => void) => ReactNode;
  unstyled?: boolean;
}

interface State {
  toggledOn: boolean;
}

class ToggleButton extends Component<Props, State> {
  state: State = { toggledOn: false };

  toggle = (): void => {
    this.setState(({ toggledOn }) => ({ toggledOn: !toggledOn }));
  };

  render(): ReactNode {
    const { unstyled, title, toggles, children } = this.props;

    return (
      <>
        <Button title={title} onClick={this.toggle} unstyled={unstyled}>
          {children}
        </Button>
        {this.state.toggledOn ? toggles(this.toggle) : null}
      </>
    );
  }
}

export default ToggleButton;
