// @flow
import * as React from 'react';

type Split = 'horizontal' | 'vertical';
type Primary = 'first' | 'second';

type Props = {
  children: React.Node,
  defaultSize?: number,
  minSize?: number,
  onChange?: (size: number) => mixed,
  primary?: Primary,
  size?: number,
  split: Split,
};

type State = {
  size: number,
};

// Keep this exported so overlays which sit above a pane can account for the
// divider in the same coordinate system as the pane layout.
export const SPLIT_PANE_HANDLE_SIZE = 6;

// The old react-split-pane package only supports React 16. This small native
// replacement preserves the two layouts this app uses while avoiding a
// document-wide drag overlay that can leave the app unresponsive.
class SplitPane extends React.Component<Props, State> {
  root: ?HTMLDivElement;
  dragging: boolean = false;

  state = {
    size: this.props.defaultSize || 0,
  };

  componentWillUnmount() {
    this.stopDragging();
  }

  setRoot = (root: ?HTMLDivElement) => {
    this.root = root;
  };

  getSize = () => (
    typeof this.props.size === 'number' ? this.props.size : this.state.size
  );

  getBounds = () => {
    if (!this.root) return null;

    const bounds = this.root.getBoundingClientRect();
    const horizontal = this.props.split === 'horizontal';
    const totalSize = (horizontal ? bounds.height : bounds.width) - SPLIT_PANE_HANDLE_SIZE;
    const minSize = Math.min(this.props.minSize || 0, totalSize / 2);

    return { bounds, minSize, totalSize };
  };

  changeSize = (size: number) => {
    if (typeof this.props.size !== 'number') {
      this.setState({ size });
    }
    if (this.props.onChange) this.props.onChange(size);
  };

  handleMouseMove = (event: MouseEvent) => {
    if (!this.dragging) return;

    const dimensions = this.getBounds();
    if (!dimensions) return;

    const { bounds, minSize, totalSize } = dimensions;
    const position = this.props.split === 'horizontal'
      ? event.clientY - bounds.top
      : event.clientX - bounds.left;
    const requestedSize = this.props.primary === 'second'
      ? totalSize - position
      : position;
    const size = Math.max(minSize, Math.min(requestedSize, totalSize - minSize));

    this.changeSize(size);
  };

  stopDragging = () => {
    this.dragging = false;
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.stopDragging);
  };

  startDragging = (event: SyntheticMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    event.preventDefault();
    this.dragging = true;
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.stopDragging);
  };

  render() {
    const children = React.Children.toArray(this.props.children);
    if (children.length !== 2) return null;

    const primary = this.props.primary || 'first';
    const size = this.getSize();
    const horizontal = this.props.split === 'horizontal';
    const sizeStyle = horizontal ? { height: `${size}px` } : { width: `${size}px` };
    const paneStyle = {
      flex: '1 1 0',
      minHeight: 0,
      minWidth: 0,
      overflow: 'hidden',
    };
    const primaryPaneStyle = {
      ...paneStyle,
      flex: `0 0 ${size}px`,
      ...sizeStyle,
    };

    return (
      <div
        ref={this.setRoot}
        style={{
          display: 'flex',
          flexDirection: horizontal ? 'column' : 'row',
          height: '100%',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div style={primary === 'first' ? primaryPaneStyle : paneStyle}>
          {children[0]}
        </div>
        <div
          aria-label={`Resize ${this.props.split} panes`}
          aria-orientation={horizontal ? 'horizontal' : 'vertical'}
          aria-valuenow={Math.round(size)}
          onMouseDown={this.startDragging}
          role="separator"
          style={{
            background: '#e9e9e9',
            cursor: horizontal ? 'row-resize' : 'col-resize',
            flex: `0 0 ${SPLIT_PANE_HANDLE_SIZE}px`,
            position: 'relative',
            userSelect: 'none',
            zIndex: 1,
          }}
        />
        <div style={primary === 'second' ? primaryPaneStyle : paneStyle}>
          {children[1]}
        </div>
      </div>
    );
  }
}

export default SplitPane;
