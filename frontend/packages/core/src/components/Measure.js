// @flow
import * as React from 'react';

type Bounds = {
  width: number,
  height: number,
  top: number,
  right: number,
  bottom: number,
  left: number,
};

type Props = {
  children: ({ measureRef: (?HTMLElement) => void }) => React.Node,
  onResize: ({ bounds: Bounds }) => void,
};

type State = {
  measurementVersion: number,
};

// A native ResizeObserver version of react-measure's bounds-only API. In
// particular, do not measure from the ref callback: canvas dimensions are
// still being committed at that point. Match react-measure's mount and
// animation-frame timing so callers always receive CSS-pixel dimensions.
class Measure extends React.Component<Props, State> {
  element: ?HTMLElement;
  observer: ?ResizeObserver;
  animationFrame: ?number;
  window: ?window;
  mounted: boolean = false;

  state = {
    measurementVersion: 0,
  };

  componentDidMount() {
    this.mounted = true;
    this.startObserving();
  }

  startObserving = () => {
    if (!this.mounted || !this.element) return;

    this.window = this.element.ownerDocument.defaultView;
    const ResizeObserverClass = this.window && this.window.ResizeObserver;
    if (!ResizeObserverClass) return;

    if (!this.observer) {
      this.observer = new ResizeObserverClass(this.handleResize);
      this.reportBounds();
    }
    this.observer.observe(this.element);
  };

  componentWillUnmount() {
    if (this.animationFrame && this.window) {
      this.window.cancelAnimationFrame(this.animationFrame);
    }
    if (this.observer) this.observer.disconnect();
  }

  getBounds = (): ?Bounds => {
    if (!this.element) return null;

    const {
      width,
      height,
      top,
      right,
      bottom,
      left,
    } = this.element.getBoundingClientRect();
    return { width, height, top, right, bottom, left };
  };

  reportBounds = () => {
    const bounds = this.getBounds();
    if (bounds) this.props.onResize({ bounds });
  };

  handleResize = () => {
    const bounds = this.getBounds();
    if (!bounds) return;

    if (!this.window) return;
    if (this.animationFrame) this.window.cancelAnimationFrame(this.animationFrame);
    this.animationFrame = this.window.requestAnimationFrame(() => {
      this.animationFrame = null;
      if (!this.observer) return;

      // The chart keeps its drawing width on the instance rather than in
      // React state. Re-render the render-prop child, as react-measure did,
      // so its canvas bitmap dimensions pick up that newly measured width.
      this.setState(state => ({
        measurementVersion: state.measurementVersion + 1,
      }));
      this.props.onResize({ bounds });
    });
  };

  measureRef = (element: ?HTMLElement) => {
    if (element === this.element) return;

    if (this.observer && this.element) this.observer.unobserve(this.element);
    this.element = element;
    this.startObserving();
  };

  render() {
    return this.props.children({ measureRef: this.measureRef });
  }
}

export default Measure;
