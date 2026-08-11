import { Component, type ReactNode } from 'react';

export interface ToggleRenderProps {
  on: boolean;
  setOff: () => void;
  setOn: () => void;
  toggle: () => void;
}

interface Props {
  children: (props: ToggleRenderProps) => ReactNode;
}

interface State {
  on: boolean;
}

class Toggle extends Component<Props, State> {
  state: State = { on: false };

  setOn = (): void => this.setState({ on: true });

  setOff = (): void => this.setState({ on: false });

  toggle = (): void => this.setState(({ on }) => ({ on: !on }));

  render(): ReactNode {
    return this.props.children({
      on: this.state.on,
      setOff: this.setOff,
      setOn: this.setOn,
      toggle: this.toggle,
    });
  }
}

export default Toggle;
