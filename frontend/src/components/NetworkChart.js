import React, { Component, Fragment } from 'react';
import last from 'lodash/last';
import styled from 'styled-components';
import findLast from 'lodash/fp/findLast';

import {
  setCanvasSize,
  getBlockTransform,
  timeToPixels,
  pixelsToTime
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
class NetworkChart extends Component {
  static textPadding = { x: 5, y: 13.5 };
  static chartPadding = { x: 0, y: 10 };
  blockHeight = 20;
  chartHeight = 50 - NetworkChart.chartPadding.y * 2;

  state = {
    mouseIsOver: false,
    hoverWindowCount: 0,
    hoverTabCount: 0,
    cursor: { x: 0, y: 0 },
    canvasWidth: null,
    canvasHeight: null,
    devicePixelRatio: 1
  };

  componentDidMount() {
    window.addEventListener('resize', this.setCanvasSize.bind(this));
    this.setCanvasSize();
  }

  setCanvasSize = () => {
    const { ctx, minTextWidth, state } = setCanvasSize(
      this.canvas,
      NetworkChart.textPadding
    );
    this.ctx = ctx;
    this.ctx.font = '11px sans-serif';
    this.minTextWidth = minTextWidth;
    this.setState(state, this.render);
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
    const closestPoint = this.props.tabs.find(
      ({ timestamp }) => time < timestamp
    );
    console.log('closesPoint', closestPoint);

    this.setState({
      hoverWindowCount: closestPoint.window_count || 0,
      hoverTabCount: closestPoint.count
    });
  };
  render() {
    this.draw();

    return (
      <Fragment>
        <canvas
          ref={canvas => {
            this.canvas = canvas;
          }}
          style={{
            width: `${this.state.canvasWidth}px` || '100%',
            height: `${this.state.canvasHeight}px` || '100%'
          }}
          height={this.state.canvasHeight * this.state.devicePixelRatio || 300}
          width={this.state.canvasWidth * this.state.devicePixelRatio || 450}
          /* ⚠️ this hs got to be an antipattern to put this in render, right? */
          onMouseMove={this.onMouseMove}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
        />
        <CountsBar hidden={!this.state.mouseIsOver}>
          <div style={{ color: windowColor }}>
            windows: {this.state.hoverWindowCount}
          </div>
          <div style={{ color: tabColor }}>
            tabs: {this.state.hoverTabCount}
          </div>
        </CountsBar>
      </Fragment>
    );
  }

  draw() {
    if (this.canvas) {
      this.ctx.save();

      this.ctx.scale(this.state.devicePixelRatio, this.state.devicePixelRatio);

      // clear the canvas
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = 1;
      this.ctx.fillRect(0, 0, this.state.canvasWidth, this.state.canvasHeight);
      // this.ctx.globalAlpha = 1;

      this.drawTabs();
      this.drawSearchTerms();

      this.ctx.scale(0.5, 0.5);
      this.ctx.restore();
    }
  }

  drawTabs() {
    const tabsWithinTimeWindow = this.props.tabs.filter(
      ({ timestamp }) =>
        timestamp > this.props.leftBoundaryTime &&
        timestamp < this.props.rightBoundaryTime
    );

    const tabsWithX = tabsWithinTimeWindow.map(({ timestamp, ...rest }) => ({
      ...rest,
      x: this.timeToPixels(timestamp)
    }));

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
    const firstTab = findLast(
      ({ timestamp }) => timestamp < this.props.leftBoundaryTime
    )(this.props.tabs) || { count: 0 };

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
    const firstWindow = findLast(
      ({ timestamp }) => timestamp < this.props.leftBoundaryTime
    )(this.props.tabs) || { window_count: 0 };

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

  countToY(count, maxCount) {
    return (
      NetworkChart.chartPadding.y +
      this.chartHeight -
      count * this.chartHeight / maxCount
    );
  }

  drawSearchTerms() {
    this.props.searchTerms.forEach(({ timestamp, term }) => {
      const { blockX, blockY, blockWidth } = getBlockTransform(
        timestamp,
        timestamp + 10 * ONE_MINUTE,
        0,
        this.blockHeight,
        0,
        this.props.leftBoundaryTime,
        this.props.rightBoundaryTime,
        this.state.canvasWidth
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
        blockWidth // - 2 * NetworkChart.textPadding.x
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

export default NetworkChart;
