import { Component, type ReactNode } from 'react';

export interface Bounds {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
}

interface Props {
  bounds?: boolean;
  children: (props: { measureRef: (element: HTMLElement | null) => void }) => ReactNode;
  onResize: (contentRect: { bounds: Bounds }) => void;
}

interface State {
  measurementVersion: number;
}

type WindowWithResizeObserver = Window & {
  ResizeObserver?: typeof ResizeObserver;
};

// A native ResizeObserver version of react-measure's bounds-only API.
class Measure extends Component<Props, State> {
  element: HTMLElement | null = null;
  observer: ResizeObserver | null = null;
  animationFrame: number | null = null;
  view: Window | null = null;
  mounted = false;

  state: State = { measurementVersion: 0 };

  componentDidMount(): void {
    this.mounted = true;
    this.startObserving();
  }

  componentWillUnmount(): void {
    this.mounted = false;
    if (this.animationFrame !== null && this.view) this.view.cancelAnimationFrame(this.animationFrame);
    this.observer?.disconnect();
  }

  startObserving = (): void => {
    if (!this.mounted || !this.element) return;

    this.view = this.element.ownerDocument.defaultView;
    const ResizeObserverClass = (this.view as WindowWithResizeObserver | null)?.ResizeObserver;
    if (!ResizeObserverClass) return;

    let observer = this.observer;
    if (!observer) {
      observer = new ResizeObserverClass(this.handleResize);
      this.observer = observer;
      this.reportBounds();
    }
    observer.observe(this.element);
  };

  getBounds = (): Bounds | null => {
    if (!this.element) return null;
    const { width, height, top, right, bottom, left } = this.element.getBoundingClientRect();
    return { width, height, top, right, bottom, left };
  };

  reportBounds = (): void => {
    const bounds = this.getBounds();
    if (bounds) this.props.onResize({ bounds });
  };

  handleResize = (): void => {
    const bounds = this.getBounds();
    if (!bounds || !this.view) return;

    if (this.animationFrame !== null) this.view.cancelAnimationFrame(this.animationFrame);
    this.animationFrame = this.view.requestAnimationFrame(() => {
      this.animationFrame = null;
      if (!this.observer) return;
      this.setState(({ measurementVersion }) => ({ measurementVersion: measurementVersion + 1 }));
      this.props.onResize({ bounds });
    });
  };

  measureRef = (element: HTMLElement | null): void => {
    if (element === this.element) return;
    if (this.observer && this.element) this.observer.unobserve(this.element);
    this.element = element;
    this.startObserving();
  };

  render(): ReactNode {
    return this.props.children({ measureRef: this.measureRef });
  }
}

export default Measure;
