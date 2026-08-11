import React, { Component, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

type Split = 'horizontal' | 'vertical';
type Primary = 'first' | 'second';
interface Props { children: ReactNode; defaultSize?: number; minSize?: number; onChange?: (size: number) => void; primary?: Primary; size?: number; split: Split }
interface State { size: number }
export const SPLIT_PANE_HANDLE_SIZE = 6;

class SplitPane extends Component<Props, State> {
  root: HTMLDivElement | null = null;
  dragging = false;
  state: State = { size: this.props.defaultSize ?? 0 };

  componentWillUnmount(): void { this.stopDragging(); }
  setRoot = (root: HTMLDivElement | null): void => { this.root = root; };
  getSize = (): number => this.props.size ?? this.state.size;
  getBounds = () => {
    if (!this.root) return null;
    const bounds = this.root.getBoundingClientRect();
    const horizontal = this.props.split === 'horizontal';
    const totalSize = (horizontal ? bounds.height : bounds.width) - SPLIT_PANE_HANDLE_SIZE;
    return { bounds, minSize: Math.min(this.props.minSize ?? 0, totalSize / 2), totalSize };
  };
  changeSize = (size: number): void => { if (this.props.size === undefined) this.setState({ size }); this.props.onChange?.(size); };
  handleMouseMove = (event: MouseEvent): void => {
    if (!this.dragging) return;
    const dimensions = this.getBounds();
    if (!dimensions) return;
    const { bounds, minSize, totalSize } = dimensions;
    const position = this.props.split === 'horizontal' ? event.clientY - bounds.top : event.clientX - bounds.left;
    const requested = this.props.primary === 'second' ? totalSize - position : position;
    this.changeSize(Math.max(minSize, Math.min(requested, totalSize - minSize)));
  };
  stopDragging = (): void => { this.dragging = false; window.removeEventListener('mousemove', this.handleMouseMove); window.removeEventListener('mouseup', this.stopDragging); };
  startDragging = (event: ReactMouseEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return;
    event.preventDefault(); this.dragging = true;
    window.addEventListener('mousemove', this.handleMouseMove); window.addEventListener('mouseup', this.stopDragging);
  };
  render(): ReactNode {
    const children = React.Children.toArray(this.props.children);
    if (children.length !== 2) return null;
    const primary = this.props.primary ?? 'first'; const size = this.getSize(); const horizontal = this.props.split === 'horizontal';
    const paneStyle: React.CSSProperties = { flex: '1 1 0', minHeight: 0, minWidth: 0, overflow: 'hidden' };
    const primaryPaneStyle: React.CSSProperties = { ...paneStyle, flex: `0 0 ${size}px`, ...(horizontal ? { height: size } : { width: size }) };
    return <div ref={this.setRoot} style={{ display: 'flex', flexDirection: horizontal ? 'column' : 'row', height: '100%', overflow: 'hidden', width: '100%' }}>
      <div style={primary === 'first' ? primaryPaneStyle : paneStyle}>{children[0]}</div>
      <div aria-label={`Resize ${this.props.split} panes`} aria-orientation={horizontal ? 'horizontal' : 'vertical'} aria-valuenow={Math.round(size)} onMouseDown={this.startDragging} role="separator" style={{ background: '#e9e9e9', cursor: horizontal ? 'row-resize' : 'col-resize', flex: `0 0 ${SPLIT_PANE_HANDLE_SIZE}px`, position: 'relative', userSelect: 'none', zIndex: 1 }} />
      <div style={primary === 'second' ? primaryPaneStyle : paneStyle}>{children[1]}</div>
    </div>;
  }
}
export default SplitPane;
