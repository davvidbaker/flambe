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
import {
  formatObservationValue,
  groupObservationSeries,
  hoverSamples,
  nextLocalMidnight,
  observationScale,
  pathPoints,
  pickAxisSeries,
  sampleSeriesAtTime,
  valueToY,
  type HoverSample,
  type ObservationSeries,
} from '../utilities/observationSeries';
import type { Mantra, Observation, SearchTerm, TabCount } from '../reducers/user';

const windowColor = '#48A2ED';
const tabColor = '#90BD71';
const ONE_MINUTE = 1000 * 60;

const CountsBar = styled.div<{ $hidden: boolean }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min-content, 120px));
  font-size: 11px;
  visibility: ${({ $hidden }) => ($hidden ? 'hidden' : 'visible')};
`;

const Legend = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
  max-width: calc(100% - 12px);
  font: 11px sans-serif;

  button {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 6px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.88);
    color: #333;
    cursor: pointer;
    font: inherit;
  }

  button:hover, button:focus-visible {
    background: #fff;
  }
`;

const LegendPanel = styled.div`
  position: absolute;
  top: calc(100% + 3px);
  right: 0;
  box-sizing: border-box;
  width: min(260px, calc(100vw - 24px));
  max-height: 220px;
  overflow: auto;
  padding: 6px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);

  header { margin-bottom: 3px; color: #555; font-weight: 600; }
  div { display: flex; align-items: center; gap: 6px; min-height: 16px; }
  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

const LegendSwatch = styled.i<{ $color: string }>`
  flex: 0 0 12px;
  height: 0;
  border-top: 2px solid ${({ $color }) => $color};
`;

interface Props {
  height?: string;
  mantras: Mantra[];
  observations?: Observation[];
  pan?: (...args: any[]) => unknown;
  searchTerms: SearchTerm[];
  tabs: TabCount[];
  zoom?: (...args: any[]) => unknown;
}

interface State {
  openLegendKind: string | null;
  mouseIsOver: boolean;
  hoverWindowCount: number;
  hoverTabCount: number;
  hoverObservations: HoverSample[];
  cursor: { x: number; y: number };
  canvasWidth: number;
  canvasHeight: number;
}

export class TimeSeries extends Component<Props, State> {
  static textPadding = { x: 5, y: 13.5 };
  static chartPadding = { x: 0, y: 15 };

  blockHeight = 20;
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  leftBoundaryTime = Date.now();
  rightBoundaryTime = Date.now() + 1000;
  width = 300;
  observationSeries: ObservationSeries[] = [];

  state: State = {
    openLegendKind: null,
    mouseIsOver: false,
    hoverWindowCount: 0,
    hoverTabCount: 0,
    hoverObservations: [],
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

  onMouseLeave = (): void => this.setState({ mouseIsOver: false, hoverObservations: [] });

  onMouseMove = (event: MouseEvent<HTMLCanvasElement>): void => {
    const { offsetX: x, offsetY: y } = event.nativeEvent;
    const time = this.pixelsToTime(x);
    const closestPoint = this.props.tabs.find(({ timestamp }) => time < timestamp);
    const series = groupObservationSeries(this.props.observations);

    this.setState({
      cursor: { x, y },
      hoverWindowCount: closestPoint?.window_count ?? 0,
      hoverTabCount: closestPoint?.count ?? 0,
      hoverObservations: hoverSamples(series, time),
    });
  };

  render() {
    const pixelRatio = window.devicePixelRatio || 1;
    const series = groupObservationSeries(this.props.observations);
    const groups = [...new Set(series.map(item => item.kind))].map(kind => ({
      kind,
      series: series.filter(item => item.kind === kind),
    }));
    const openGroup = groups.find(group => group.kind === this.state.openLegendKind);

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
        {series.length > 0 && (
          <Legend>
            {groups.map(({ kind, series: items }) => (
              <button
                key={kind}
                type="button"
                aria-expanded={this.state.openLegendKind === kind}
                aria-label={`${kind}: ${items.length} plotted series; ${this.state.openLegendKind === kind ? 'hide' : 'show'} legend`}
                onClick={() => this.setState(({ openLegendKind }) => ({
                  openLegendKind: openLegendKind === kind ? null : kind,
                }))}
              >
                <LegendSwatch $color={items[0].color} />
                {kind} {items.length > 1 ? items.length : ''} {this.state.openLegendKind === kind ? '▴' : '▾'}
              </button>
            ))}
            {openGroup && (
              <LegendPanel>
                <header>{openGroup.kind}{openGroup.series[0].unit ? ` (${openGroup.series[0].unit})` : ''}</header>
                {openGroup.series.map(item => (
                  <div key={item.key} title={item.label}>
                    <LegendSwatch $color={item.color} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </LegendPanel>
            )}
          </Legend>
        )}
        <CountsBar $hidden={!this.state.mouseIsOver}>
          <div style={{ color: windowColor }}>
            windows: {this.state.hoverWindowCount}
          </div>
          <div style={{ color: tabColor }}>
            tabs: {this.state.hoverTabCount}
          </div>
          {this.state.hoverObservations.map(sample => (
            <div key={sample.key} style={{ color: sample.color }}>
              {sample.label === sample.kind ? sample.kind : `${sample.kind} · ${sample.label}`}: {' '}
              {formatObservationValue(sample.value)}
              {sample.unit ? ` ${sample.unit}` : ''}
            </div>
          ))}
        </CountsBar>
      </div>
    );
  }

  draw(leftBoundaryTime: number, rightBoundaryTime: number, width: number): void {
    this.leftBoundaryTime = leftBoundaryTime;
    this.rightBoundaryTime = rightBoundaryTime;
    this.width = width;
    this.observationSeries = groupObservationSeries(this.props.observations);

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
    this.drawObservations();
    this.drawObservationAxis();
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

  seriesScale(series: ObservationSeries) {
    const points = pathPoints(series, this.leftBoundaryTime, this.rightBoundaryTime);
    const siblingValues = this.observationSeries
      .filter(candidate => candidate.kind === series.kind && candidate.unit === series.unit)
      .flatMap(candidate =>
        pathPoints(candidate, this.leftBoundaryTime, this.rightBoundaryTime).map(point => point.value),
      );
    return {
      points,
      scale: observationScale(siblingValues),
    };
  }

  axisSeries(): ObservationSeries | null {
    const { hoverObservations, mouseIsOver, cursor } = this.state;
    if (!mouseIsOver || hoverObservations.length <= 1) {
      return pickAxisSeries(this.observationSeries, mouseIsOver ? hoverObservations : []);
    }

    const chartHeight = this.chartHeight();
    const paddingY = TimeSeries.chartPadding.y;
    let best: ObservationSeries | null = null;
    let bestDist = Infinity;
    hoverObservations.forEach(sample => {
      const series = this.observationSeries.find(candidate => candidate.key === sample.key);
      if (!series) return;
      const { scale } = this.seriesScale(series);
      const y = valueToY(sample.value, scale.min, scale.max, chartHeight, paddingY);
      const dist = Math.abs(y - cursor.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = series;
      }
    });
    return best ?? this.observationSeries[0] ?? null;
  }

  drawObservations(): void {
    const { ctx } = this;
    if (!ctx) return;

    const chartHeight = this.chartHeight();
    const paddingY = TimeSeries.chartPadding.y;
    const cursorTime = this.pixelsToTime(this.state.cursor.x);

    this.observationSeries.forEach(series => {
      const { points, scale } = this.seriesScale(series);
      if (points.length === 0) return;

      const siblingCount = this.observationSeries.filter(
        candidate => candidate.kind === series.kind && candidate.unit === series.unit,
      ).length;
      ctx.globalAlpha = siblingCount > 1 ? 0.24 : 1;
      ctx.lineWidth = siblingCount > 1 ? 1.5 : 2;
      ctx.strokeStyle = series.color;
      ctx.fillStyle = series.color;
      ctx.beginPath();

      let previousY = 0;
      points.forEach((point, index) => {
        const x = Math.max(0, Math.min(this.width, this.timeToPixels(point.time)));
        const y = valueToY(point.value, scale.min, scale.max, chartHeight, paddingY);
        if (index === 0) {
          ctx.moveTo(point.time < this.leftBoundaryTime ? 0 : x, y);
        } else if (series.dated) {
          ctx.lineTo(x, previousY);
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        previousY = y;
      });

      if (series.dated) {
        const last = points[points.length - 1];
        const next = series.points.find(point => point.time > last.time);
        const holdEnd = Math.min(
          next?.time ?? nextLocalMidnight(last.time),
          this.rightBoundaryTime,
        );
        ctx.lineTo(Math.max(0, Math.min(this.width, this.timeToPixels(holdEnd))), previousY);
      }

      ctx.stroke();
      ctx.globalAlpha = 1;

      if (this.state.mouseIsOver) {
        const hoverValue = sampleSeriesAtTime(series, cursorTime);
        if (hoverValue !== null) {
          ctx.beginPath();
          ctx.arc(
            this.state.cursor.x,
            valueToY(hoverValue, scale.min, scale.max, chartHeight, paddingY),
            2,
            0,
            2 * Math.PI,
          );
          ctx.fill();
        }
      }
    });
  }

  drawObservationAxis(): void {
    const { ctx } = this;
    const series = this.axisSeries();
    if (!ctx || !series) return;

    const { points, scale } = this.seriesScale(series);
    if (points.length === 0) return;

    const chartHeight = this.chartHeight();
    const paddingY = TimeSeries.chartPadding.y;
    const tickX = 4;
    const labelX = 12;

    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = series.color;
    ctx.lineWidth = 1;

    const paintLabel = (text: string, x: number, y: number) => {
      const width = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.fillRect(x - 2, y - 7, width + 4, 14);
      ctx.fillStyle = series.color;
      ctx.fillText(text, x, y);
    };

    scale.ticks.forEach(tick => {
      const y = valueToY(tick, scale.min, scale.max, chartHeight, paddingY);
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(tickX, y);
      ctx.lineTo(tickX + 5, y);
      ctx.stroke();
      paintLabel(formatObservationValue(tick), labelX, y);
    });

    ctx.restore();
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
