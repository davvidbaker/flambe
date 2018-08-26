import React, { Component } from 'react';
import last from 'lodash/last';
import styled from 'styled-components';
import findLast from 'lodash/fp/findLast';
import sampleSize from 'lodash/sampleSize';
import range from 'lodash/range';
import pullAt from 'lodash/pullAt';
import Measure from 'react-measure';

import {
  getBlockTransform,
  timeToPixels,
  pixelsToTime,
  drawFutureWindow
} from '../utilities/timelineChart';
import { trimTextMiddle } from '../utilities';

const windowColor = '#48A2ED';
const tabColor = '#90BD71';

const ONE_MINUTE = 1000 * 60;
const CountsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min-content, 100px));
  font-size: 11px;
  visibility: ${props => (props.hidden ? 'hidden' : 'visible')};
`;
class TimeSeries extends Component {
  static textPadding = { x: 5, y: 13.5 };
  static chartPadding = { x: 0, y: 15 };
  blockHeight = 20;

  state = {
    mouseIsOver: false,
    hoverWindowCount: 0,
    hoverTabCount: 0,
    cursor: { x: 0, y: 0 },
    canvasWidth: null,
    canvasHeight: null
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (
      nextProps.tabs.length !== this.props.tabs.length ||
      nextProps.rightBoundaryTime !== this.props.rightBoundaryTime
    ) {
      return true;
    }
    if (JSON.stringify(nextState) !== JSON.stringify(this.state)) {
      return true;
    }

    return false;
  }

  chartHeight = () => this.state.canvasHeight - TimeSeries.chartPadding.y * 2;

  componentDidMount() {
    const ctx = this.canvas.getContext('2d');
    this.ctx = ctx;
    this.setCanvasSize({ width: 300, height: 150 });
  }

  setCanvasSize = ({ width, height }) => {
    this.setState({
      canvasWidth: width,
      canvasHeight: height
    });
    if (this.canvas) {
      this.ctx.font = '11px sans-serif';
      this.minTextWidth =
        TimeSeries.textPadding.x + this.ctx.measureText('\u2026').textWidth;
    }
  };

  onMouseEnter = () => {
    this.setState({ mouseIsOver: true });
  };

  onMouseLeave = () => {
    this.setState({ mouseIsOver: false });
  };

  onMouseMove = e => {
    const x = e.nativeEvent.offsetX;

    this.setState({
      cursor: { x, y: e.nativeEvent.offsetY }
    });

    const time = this.pixelsToTime(x);
    const closestPoint = this.props.tabs.find(({ timestamp }) => time < timestamp);
    if (closestPoint) {
      this.setState({
        hoverWindowCount: closestPoint.window_count || 0,
        hoverTabCount: closestPoint.count
      });
    }
  };
  render() {
    requestAnimationFrame(() => {
      this.draw();
    });

    return (
      <>
        <div style={{ width: '100%' }}>
          <Measure
            bounds
            onResize={contentRect => {
              /* 🤔 I feel like this shouldn't be necessary, but otherwise I get stuck in a render loop.bind.. */
              if (
                contentRect.bounds.width !== this.state.canvasWidth ||
                contentRect.bounds.height !== this.state.canvasHeight
              ) {
                this.setCanvasSize(contentRect.bounds);
              }
            }}
          >
            {({ measureRef }) => (
              <canvas
                ref={canvas => {
                  measureRef(canvas);
                  this.canvas = canvas;
                }}
                style={{
                  width: '100%',
                  height: '100%'
                }}
                height={
                  this.state.canvasHeight * window.devicePixelRatio || 300
                }
                width={this.state.canvasWidth * window.devicePixelRatio || 450}
                /* ⚠️ this hs got to be an antipattern to put this in render, right? */
                onMouseMove={this.onMouseMove}
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}
              />
            )}
          </Measure>
        </div>
        <CountsBar hidden={!this.state.mouseIsOver}>
          <div style={{ color: windowColor }}>
            windows: {this.state.hoverWindowCount}
          </div>
          <div style={{ color: tabColor }}>
            tabs: {this.state.hoverTabCount}
          </div>
        </CountsBar>
      </>
    );
  }

  draw() {
    if (this.canvas) {
      this.ctx.save();

      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // clear the canvas
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = 1;
      this.ctx.fillRect(0, 0, this.state.canvasWidth, this.state.canvasHeight);
      // this.ctx.globalAlpha = 1;

      drawFutureWindow(
        this.ctx,
        this.props.leftBoundaryTime,
        this.props.rightBoundaryTime,
        this.state.canvasWidth,
        this.state.canvasHeight
      );
      /* ⚠️ big perf hit happening here, mostly from tabs and search terms when there are a lot. I need to filter them so there's less shown on the screen at a single time */
      this.drawMantras();
      this.drawTabs();
      this.drawSearchTerms();

      this.ctx.scale(0.5, 0.5);
      this.ctx.restore();
    }
  }

  drawMantras() {
    this.ctx.globalAlpha = 1;
    this.props.mantras.forEach(({ name, timestamp }, i) => {
      const { blockX, blockY, blockWidth } = this.getBlockTransform(
        timestamp,
        this.props.mantras[i + 1]
          ? this.props.mantras[i + 1].timestamp - 1
          : Date.now(),
        0,
        this.blockHeight,
        0
      );

      // don't draw if bar is left or right of view
      if (blockX > this.state.canvasWidth || blockX + blockWidth <= 0) {
        return;
      }

      this.ctx.fillStyle = i % 2 ? '#fafafa' : '#fff';
      this.ctx.fillRect(blockX, 0, blockWidth, 100);

      const text = trimTextMiddle(this.ctx, name, blockWidth);

      this.ctx.fillStyle = '#000';
      this.ctx.fillText(text, blockX, blockY + 11);
    });
  }

  drawTabs() {
    const randomIndices = sampleSize(range(this.props.tabs.length), 100).sort((a, b) => (a < b ? -1 : 1));

    const tabsWithinTimeWindow = pullAt([...this.props.tabs], randomIndices);

    if (tabsWithinTimeWindow.length === 0) return;

    const tabsWithX = tabsWithinTimeWindow.map(({ timestamp, ...rest }) => ({
      ...rest,
      x: this.timeToPixels(timestamp)
    }));

    if (tabsWithX.length === 0) return;

    const maxTabs = tabsWithX.reduce(
      (acc, { count }) => Math.max(acc, count),
      0
    );
    const maxWindows = tabsWithX.reduce(
      (acc, { window_count }) => Math.max(acc, window_count || 0),
      0
    );

    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = tabColor;
    this.ctx.fillStyle = tabColor;
    this.ctx.beginPath();
    const firstTab = findLast(({ timestamp }) => timestamp < this.props.leftBoundaryTime)(this.props.tabs) || { count: 0 };

    this.ctx.moveTo(0, this.countToY(firstTab.count, maxTabs));
    tabsWithX.forEach(({ count, x }, i) => {
      this.ctx.lineTo(
        tabsWithX[i - 1] ? tabsWithX[i - 1].x : 0,
        this.countToY(count, maxTabs)
      );
      this.ctx.lineTo(x, this.countToY(count, maxTabs));
    });
    this.ctx.lineTo(
      this.timeToPixels(Date.now()),
      this.countToY(last(this.props.tabs).count, maxTabs)
    );
    this.ctx.stroke();

    if (this.state.mouseIsOver) {
      this.ctx.beginPath();
      this.ctx.arc(
        this.state.cursor.x, // this.pixelsToTime(this.state.cursor.x),
        this.countToY(this.state.hoverTabCount, maxTabs),
        2,
        0,
        2 * Math.PI
      );
      this.ctx.fill();
    }

    this.ctx.strokeStyle = windowColor;
    this.ctx.fillStyle = windowColor;
    this.ctx.beginPath();
    const firstWindow = findLast(({ timestamp }) => timestamp < this.props.leftBoundaryTime)(this.props.tabs) || { window_count: 0 };

    this.ctx.moveTo(0, this.countToY(firstWindow.window_count, maxWindows));
    tabsWithX.forEach(({ window_count: count, x }, i) => {
      this.ctx.lineTo(
        tabsWithX[i - 1] ? tabsWithX[i - 1].x : 0,
        this.countToY(count, maxWindows)
      );
      this.ctx.lineTo(x, this.countToY(count, maxWindows));
    });
    this.ctx.lineTo(
      this.timeToPixels(Date.now()),
      this.countToY(last(this.props.tabs).window_count, maxWindows)
    );
    this.ctx.stroke();

    if (this.state.mouseIsOver) {
      this.ctx.beginPath();
      this.ctx.arc(
        this.state.cursor.x,
        this.countToY(this.state.hoverWindowCount, maxWindows),
        2,
        0,
        2 * Math.PI
      );
      this.ctx.fill();
    }
  }

  pixelsToTime(x) {
    return pixelsToTime(
      x,
      this.props.leftBoundaryTime,
      this.props.rightBoundaryTime,
      this.state.canvasWidth
    );
  }

  timeToPixels(timestamp) {
    return timeToPixels(
      timestamp,
      this.props.leftBoundaryTime,
      this.props.rightBoundaryTime,
      this.state.canvasWidth
    );
  }

  getBlockTransform(startTime, endTime, level, blockHeight, offsetFromTop) {
    return getBlockTransform(
      startTime,
      endTime,
      level,
      blockHeight,
      offsetFromTop,
      this.props.leftBoundaryTime,
      this.props.rightBoundaryTime,
      this.state.canvasWidth
    );
  }

  countToY(count, maxCount) {
    const chartHeight = this.chartHeight();
    return (
      TimeSeries.chartPadding.y + chartHeight - (count * chartHeight) / maxCount
    );
  }

  drawSearchTerms() {
    this.props.searchTerms.forEach(({ timestamp, term }) => {
      const { blockX, blockY, blockWidth } = this.getBlockTransform(
        timestamp,
        timestamp + 10 * ONE_MINUTE,
        0,
        this.blockHeight,
        0
      );

      // don't draw bar if whole thing is this.left of view
      if (blockX + blockWidth <= 0) {
        return;
      }

      // don't draw bar if whole thing is this.right of view
      if (blockX > this.state.canvasWidth) {
        return;
      }

      let text = trimTextMiddle(
        this.ctx,
        term,
        blockWidth // - 2 * TimeSeries.textPadding.x
      );

      if (text.length === 0) {
        text = '🔎';
      }

      // this.ctx.fillRect(blockX, blockY, blockWidth, this.blockHeight);

      this.ctx.globalAlpha = 0.5;
      this.ctx.fillStyle = '#000';
      this.ctx.fillText(text, blockX, blockY + this.blockHeight + 25);
    });
  }
}

export default TimeSeries;
