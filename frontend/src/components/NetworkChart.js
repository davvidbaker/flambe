import React, { Component } from 'react';
import last from 'lodash/last';
import findLast from 'lodash/fp/findLast';

import {
  setCanvasSize,
  getBlockTransform,
  timeToPixels
} from '../utilities/timelineChart';
import { trimTextMiddle } from '../utilities';

const ONE_MINUTE = 1000 * 60;
class NetworkChart extends Component {
  static textPadding = { x: 5, y: 13.5 };
  blockHeight = 20;
  chartHeight = 50;

  state = {
    canvasWidth: null,
    canvasHeight: null,
    devicePixelRatio: 1
  };

  componentDidMount() {
    window.addEventListener('resize', this.setCanvasSize);
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

  render() {
    this.draw();

    return (
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
      />
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

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#90BD71';
    this.ctx.beginPath();
    const firstTab = findLast(
      ({ timestamp }) => timestamp < this.props.leftBoundaryTime
    )(this.props.tabs) || { count: 0 };

    this.ctx.moveTo(0, this.countToY(firstTab.count, maxTabs));
    tabsWithX.forEach(({ count, x }) => {
      this.ctx.lineTo(x, this.countToY(count, maxTabs));
    });
    this.ctx.lineTo(
      this.timeToPixels(Date.now()),
      this.countToY(last(this.props.tabs).count, maxTabs)
    );
    this.ctx.stroke();

    this.ctx.strokeStyle = '#48A2ED';
    this.ctx.beginPath();
    const firstWindow = findLast(
      ({ timestamp }) => timestamp < this.props.leftBoundaryTime
    )(this.props.tabs) || { count: 0 };

    this.ctx.moveTo(0, this.countToY(firstWindow.count, maxWindows));
    tabsWithX.forEach(({ window_count: count, x }) => {
      this.ctx.lineTo(x, this.countToY(count, maxWindows));
    });
    this.ctx.lineTo(
      this.timeToPixels(Date.now()),
      this.countToY(last(this.props.tabs).count, maxWindows)
    );
    this.ctx.stroke();
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
    return this.chartHeight - count * this.chartHeight / maxCount;
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
      this.ctx.fillText(text, blockX, blockY + this.blockHeight);
    });
  }
}

export default NetworkChart;
