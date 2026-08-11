import { Component, type ReactNode } from 'react';

export type EventListenerTuple = [string, EventListener];
interface Props { node: EventTarget; eventListeners: EventListenerTuple[]; children: () => ReactNode }

class WithEventListeners extends Component<Props> {
  componentDidMount(): void {
    this.props.eventListeners.forEach(([event, listener]) => this.props.node.addEventListener(event, listener));
  }
  componentWillUnmount(): void {
    this.props.eventListeners.forEach(([event, listener]) => this.props.node.removeEventListener(event, listener));
  }
  render(): ReactNode { return this.props.children(); }
}

export default WithEventListeners;
