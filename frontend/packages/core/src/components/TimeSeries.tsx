import React, { Component, type MouseEvent } from 'react';
import styled from 'styled-components';
import Measure, { type Bounds } from './Measure';
import {
  getBlockTransform,
  timeToPixels,
  pixelsToTime,
  drawFutureWindow,
} from '../utilities/timelineGeometry';
import { trimTextMiddle } from '../utilities';
import type { Mantra, SearchTerm, TabCount } from '../reducers/user';

const windowColor = '#48A2ED';
const tabColor = '#90BD71';
const ONE_MINUTE = 1000 * 60;

const CountsBar = styled.div<{ $hidden: boolean }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min-content, 100px));
  font-size: 11px;
  visibility: ${({ $hidden }) => ($hidden ? 'hidden' : 'visible')};
`;

interface Props {
  height?: string;
  mantras: Mantra[];
  pan?: (...args: unknown[]) => unknown;
  searchTerms: SearchTerm[];
  tabs: TabCount[];
  zoom?: (...args: unknown[]) => unknown;
}

interface State {
  mouseIsOver: boolean;
  hoverWindowCount: number;
  hoverTabCount: number;
  cursor: { x: number; y: number };
  canvasWidth: number;
  canvasHeight: number;
}

class TimeSeries extends Component<Props, State> {
  static textPadding = { x: 5, y: 13.5 };
  static chartPadding = { x: 0, y: 15 };

  blockHeight = 20;
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  leftBoundaryTime = Date.now();
  rightBoundaryTime = Date.now() + 1000;
  width = 300;

  state: State = {
    mouseIsOver: false,
    hoverWindowCount: 0,
    hoverTabCount: 0,
    cursor: { x: 0, y: 0 },
    canvasWidth: 300,
    canvasHeight: 150,
  };

  chartHeight = (): number =>
    Math.max(0, this.state.canvasHeight - TimeSeries.chartPadding.y * 2);

  componentDidMount(): void {
    this.ctx = this.canvas?.getContext('2d') ?? null;
    this.setCanvasSize({ width: 300, height: 150 });
  }

  componentDidUpdate(): void {
    this.draw(this.leftBoundaryTime, this.rightBoundaryTime, this.width);
  }

  setCanvasSize = ({ width, height }: Pick<Bounds, 'width' | 'height'>): void => {
    const canvasWidth = Math.max(1, width);
    const canvasHeight = Math.max(1, height);
    const pixelRatio = window.devicePixelRatio || 1;

    if (this.canvas) {
      this.canvas.width = Math.round(canvasWidth * pixelRatio);
      this.canvas.height = Math.round(canvasHeight * pixelRatio);
    }

    if (canvasWidth !== this.state.canvasWidth || canvasHeight !== this.state.canvasHeight) {
      this.setState({ canvasWidth, canvasHeight });
    }
  };

  onMouseEnter = (): void => this.setState({ mouseIsOver: true });

  onMouseLeave = (): void => this.setState({ mouseIsOver: false });

  onMouseMove = (event: MouseEvent<HTMLCanvasElement>): void => {
    const { offsetX: x, offsetY: y } = event.nativeEvent;
    const time = this.pixelsToTime(x);
    const closestPoint = this.props.tabs.find(({ timestamp }) => time < timestamp);

    this.setState({
      cursor: { x, y },
      hoverWindowCount: closestPoint?.window_count ?? 0,
      hoverTabCount: closestPoint?.count ?? 0,
    });
  };

  render() {
    const pixelRatio = window.devicePixelRatio || 1;

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Measure
          bounds
          onResize={({ bounds }) => {
            if (
              bounds.width !== this.state.canvasWidth ||
              bounds.height !== this.state.canvasHeight
            ) {
              this.setCanvasSize(bounds);
            }
          }}
        >
          {({ measureRef }) => (
            <canvas
              ref={canvas => {
                measureRef(canvas);
                this.canvas = canvas;
                this.ctx = canvas?.getContext('2d') ?? null;
              }}
              style={{ width: '100%', height: '100%' }}
              height={Math.round(this.state.canvasHeight * pixelRatio)}
              width={Math.round(this.state.canvasWidth * pixelRatio)}
              onMouseMove={this.onMouseMove}
              onMouseEnter={this.onMouseEnter}
              onMouseLeave={this.onMouseLeave}
            />
          )}
        </Measure>
        <CountsBar $hidden={!this.state.mouseIsOver}>
          <div style={{ color: windowColor }}>
            windows: {this.state.hoverWindowCount}
          </div>
          <div style={{ color: tabColor }}>
            tabs: {this.state.hoverTabCount}
          </div>
        </CountsBar>
      </div>
    );
  }

  draw(leftBoundaryTime: number, rightBoundaryTime: number, width: number): void {
    this.leftBoundaryTime = leftBoundaryTime;
    this.rightBoundaryTime = rightBoundaryTime;
    this.width = width;

    const { ctx } = this;
    if (!ctx || !this.canvas) return;

    const pixelRatio = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, width, this.state.canvasHeight);

    drawFutureWindow(
      ctx,
      leftBoundaryTime,
      rightBoundaryTime,
      width,
      this.state.canvasHeight,
    );
    this.drawMantras();
    this.drawTabs();
    this.drawSearchTerms();
    ctx.restore();
  }

  drawMantras(): void {
    const { ctx } = this;
    if (!ctx) return;
    ctx.globalAlpha = 1;

    this.props.mantras.forEach(({ name, timestamp }, index) => {
      const { blockX, blockY, blockWidth } = this.getBlockTransform(
        timestamp,
        this.props.mantras[index + 1]?.timestamp
          ? this.props.mantras[index + 1].timestamp - 1
          : Date.now(),
        0,
        this.blockHeight,
        0,
      );

      if (blockX > this.width || blockX + blockWidth <= 0) return;
      ctx.fillStyle = index % 2 ? '#fafafa' : '#fff';
      ctx.fillRect(blockX, 0, blockWidth, 100);
      ctx.fillStyle = '#000';
      ctx.fillText(trimTextMiddle(ctx, name, blockWidth), blockX, blockY + 11);
    });
  }

  drawTabs(): void {
    const { ctx } = this;
    const tabsWithinTimeWindow = this.props.tabs;
    if (!ctx || tabsWithinTimeWindow.length === 0) return;

    const tabsWithX = tabsWithinTimeWindow.map(({ timestamp, ...rest }) => ({
      ...rest,
      timestamp,
      x: this.timeToPixels(timestamp),
    }));
    const maxTabs = Math.max(0, ...tabsWithX.map(({ count }) => count));
    const maxWindows = Math.max(0, ...tabsWithX.map(({ window_count }) => window_count));
    const firstTab = [...this.props.tabs]
      .reverse()
      .find(({ timestamp }) => timestamp < this.leftBoundaryTime);
    const lastTab = tabsWithX[tabsWithX.length - 1];

    ctx.lineWidth = 1;
    ctx.strokeStyle = tabColor;
    ctx.fillStyle = tabColor;
    ctx.beginPath();
    ctx.moveTo(0, this.countToY(firstTab?.count ?? 0, maxTabs));
    tabsWithX.forEach(({ count, x }, index) => {
      ctx.lineTo(tabsWithX[index - 1]?.x ?? 0, this.countToY(count, maxTabs));
      ctx.lineTo(x, this.countToY(count, maxTabs));
    });
    ctx.lineTo(this.timeToPixels(Date.now()), this.countToY(lastTab.count, maxTabs));
    ctx.stroke();

    if (this.state.mouseIsOver) {
      ctx.beginPath();
      ctx.arc(this.state.cursor.x, this.countToY(this.state.hoverTabCount, maxTabs), 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    const firstWindow = [...this.props.tabs]
      .reverse()
      .find(({ timestamp }) => timestamp < this.leftBoundaryTime);
    ctx.strokeStyle = windowColor;
    ctx.fillStyle = windowColor;
    ctx.beginPath();
    ctx.moveTo(0, this.countToY(firstWindow?.window_count ?? 0, maxWindows));
    tabsWithX.forEach(({ window_count, x }, index) => {
      ctx.lineTo(tabsWithX[index - 1]?.x ?? 0, this.countToY(window_count, maxWindows));
      ctx.lineTo(x, this.countToY(window_count, maxWindows));
    });
    ctx.lineTo(this.timeToPixels(Date.now()), this.countToY(lastTab.window_count, maxWindows));
    ctx.stroke();

    if (this.state.mouseIsOver) {
      ctx.beginPath();
      ctx.arc(this.state.cursor.x, this.countToY(this.state.hoverWindowCount, maxWindows), 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  pixelsToTime(x: number): number {
    return pixelsToTime(x, this.leftBoundaryTime, this.rightBoundaryTime, this.width);
  }

  timeToPixels(timestamp: number): number {
    return timeToPixels(timestamp, this.leftBoundaryTime, this.rightBoundaryTime, this.width);
  }

  getBlockTransform(
    startTime: number,
    endTime: number,
    level: number,
    blockHeight: number,
    offsetFromTop: number,
  ) {
    return getBlockTransform(
      startTime,
      endTime,
      level,
      blockHeight,
      offsetFromTop,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      this.width,
    );
  }

  countToY(count: number, maxCount: number): number {
    const chartHeight = this.chartHeight();
    if (maxCount <= 0) return TimeSeries.chartPadding.y + chartHeight;
    return TimeSeries.chartPadding.y + chartHeight - (count * chartHeight) / maxCount;
  }

  drawSearchTerms(): void {
    const { ctx } = this;
    if (!ctx) return;

    this.props.searchTerms.forEach(({ timestamp, term }) => {
      const { blockX, blockY, blockWidth } = this.getBlockTransform(
        timestamp,
        timestamp + 10 * ONE_MINUTE,
        0,
        this.blockHeight,
        0,
      );

      if (blockX + blockWidth <= 0 || blockX > this.width) return;
      const trimmed = trimTextMiddle(ctx, term, blockWidth);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#000';
      ctx.fillText(trimmed || '🔎', blockX, blockY + this.blockHeight + 25);
    });
  }
}

export default TimeSeries;
