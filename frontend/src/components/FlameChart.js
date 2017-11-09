// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
// flow-ignore
import pickBy from 'lodash/fp/pickBy';
// flow-ignore
import compose from 'lodash/fp/compose';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';

// ⚠️ abstract into parts of react-flame-chart
import HoverActivity from 'components/HoverActivity';
import FocusActivity from 'components/FocusActivity';

import { constrain, trimTextMiddle, deepArrayIsEqual } from 'utilities';
import { focusActivity, hoverActivity } from 'actions';
import { getTimeline } from 'reducers/timeline';
import { colors } from 'styles';

import type { Activity } from 'types/Activity';

type Props = {
  focusActivity: ?string => mixed,
  hoverActivity: ?string => mixed,
  showThreadDetail: number => mixed,
  activities?: { [id: string]: Activity },
  minTime?: number,
  maxTime?: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  topOffset: number,
  focusedActivity_id?: string,
  hoveredActivity_id?: string,
  categories: { id: string, name: string, color: string },
  threads: { name: string, id: number, rank: number }[],
  threadLevels: { id: { current: number, max: number } }[],
};

type State = {
  canvasWidth: number, // in pixels
  canvasHeight: number, // in pixels
  ratio: number, // window.devicePixelRatio (ie, it is 2 on my laptop, but 1 on my external monitor)
  hoverThreadEllipsis: number, // the id of the thread whose details ellipsis is being hovered
  offsets: {},
};

class FlameChart extends Component<Props, State> {
  ctx: CanvasRenderingContext2D;
  canvas: ?HTMLCanvasElement;
  minTextWidth: number;
  topOffset = 0;

  static textPadding = { x: 5, y: 13.5 };
  static foldedThreadHeight = 100;
  static threadHeaderHeight = 20;

  activityHeight = 20; // px
  state = {
    canvasWidth: 0,
    canvasHeight: 0,
    ratio: 1,
    offsets: {},
    hoverThreadEllipsis: null,
  };

  constructor(props) {
    super(props);
    const offsets = this.setOffsets(props.threads, props.threadLevels);
    this.state.offsets = offsets;
  }

  componentDidMount() {
    window.addEventListener('resize', this.setCanvasSize);
    if (this.canvas) {
      this.setCanvasSize();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      !deepArrayIsEqual(this.props.threads, nextProps.threads) ||
      !isEqual(this.props.threadLevels, nextProps.threadLevels)
    ) {
      console.log(
        'nextprops notequals',
        deepArrayIsEqual(this.props.threads, nextProps.threads),
        isEqual(this.props.threadLevels, nextProps.threadLevels)
      );
      console.log(this.props.threads, nextProps.threads);
      const offsets = this.setOffsets(
        nextProps.threads,
        nextProps.threadLevels
      );
      this.setState({ offsets });
    }
  }

  setOffsets = (threads, threadLevels) => {
    if (
      threads &&
      threadLevels &&
      threads.length === Object.keys(threadLevels).length
    ) {
      const offsets = {};

      threads.reduce((acc, thread, ind) => {
        const spacer = ind > 0 ? 4 : 0;
        offsets[thread.id] = acc + spacer; // FlameChart.foldedThreadHeight;
        const add =
          (this.activityHeight + 1) * threadLevels[thread.id].max +
          FlameChart.threadHeaderHeight;
        return acc + add + spacer;
      }, 0);

      return offsets;
    } return {};
  };

  setCanvasSize = () => {
    if (this.canvas) {
      const ratio = window.devicePixelRatio;
      this.canvas.width = this.canvas.clientWidth * ratio;
      this.canvas.height = this.canvas.clientHeight * ratio;

      this.ctx = this.canvas.getContext('2d');
      this.minTextWidth =
        FlameChart.textPadding.x + this.ctx.measureText('\u2026').textWidth;

      this.setState({
        ratio,
        canvasWidth: this.canvas.width,
        canvasHeight: this.canvas.height,
      });
    }
  };

  hitTest = e => {
    const ts = this.pixelsToTime(e.nativeEvent.offsetX);
    const hitThread_id = this.pixelsToThread_id(e.nativeEvent.offsetY);
    const hitLevel = this.pixelsToLevel(e.nativeEvent.offsetY);

    console.log(hitLevel);

    const filterByTime = pickBy(
      activity =>
        ts > activity.startTime &&
        (ts < activity.endTime || activity.endTime === undefined)
    );

    const filterByLevel = pickBy(activity => activity.level === hitLevel);

    const filterByThread = pickBy(
      activity => activity.thread.id === hitThread_id
    );

    const hitActivities = compose(filterByTime, filterByLevel, filterByThread)(
      this.props.activities
    );

    /** 💁 this is the header (hitLevel === -1) */
    if (hitLevel === -1) {
      if (e.nativeEvent.offsetX > this.state.canvasWidth - 30) {
        return { type: 'thread_ellipsis', value: hitThread_id };
      }
    }

    if (Object.keys(hitActivities).length === 0) {
      return null;
    } else if (Object.keys(hitActivities).length !== 1) {
      throw new Error('multiple hits! something is wrong!', hitActivities);
    }

    const hitActivityKey: string = Object.keys(hitActivities)[0];

    return { type: 'activity_block', value: hitActivityKey };
  };

  onClick = e => {
    const hit = this.hitTest(e);
    if (hit) {
      switch (hit.type) {
        case 'thread_ellipsis':
          this.props.showThreadDetail(hit.value);
          break;

        case 'activity_block':
          this.props.focusActivity(hit.value);
          break;

        default:
      }
    } else {
      this.props.focusActivity(null);
    }
  };

  onMouseMove = e => {
    const hit = this.hitTest(e);
    if (hit) {
      switch (hit.type) {
        case 'thread_ellipsis':
          this.canvas.style.cursor = 'pointer';
          this.setState({
            hoverThreadEllipsis: hit.value,
          });
          break;

        case 'activity_block':
          this.props.hoverActivity(hit.value);
          this.canvas.style.cursor = 'default';
          this.setState({ hoverThreadEllipsis: null });
          break;

        default:
      }
    } else {
      this.props.hoverActivity(null);

      if (this.state.hoverThreadEllipsis) {
        this.canvas.style.cursor = 'default';
        this.setState({ hoverThreadEllipsis: null });
      }
    }
  };

  onWheel = (e: SyntheticWheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomCenterTime = this.pixelsToTime(e.nativeEvent.offsetX);

    // pan around if holding shift or scroll was mostly vertical
    if (this.props.shiftModifier || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      this.props.pan(e.deltaX, e.deltaY, this.state.canvasWidth);
      requestAnimationFrame(this.draw.bind(this));
    } else {
      this.props.zoom(
        e.deltaY,
        e.nativeEvent.offsetX,
        zoomCenterTime,
        this.state.canvasWidth
      );
      requestAnimationFrame(this.draw.bind(this));
    }
  };

  getBlockDetails = id => {
    const activity = this.props.activities && this.props.activities[id];

    if (activity) {
      const { barX, barY, barWidth } = this.getBarTransform(
        activity,
        this.activityHeight,
        this.topOffset + this.state.offsets[activity.thread.id]
      );

      return {
        barX,
        barY,
        barWidth,
      };
    }
  };

  render() {
    const focusedActivityBlock = this.getBlockDetails(
      this.canvas && this.props.activities && this.props.focusedActivity_id
    );
    const hoveredActivityBlock = this.getBlockDetails(
      this.canvas && this.props.activities && this.props.hoveredActivity_id
    );

    this.draw();

    // flow-ignore
    return (
      <div
        style={{
          height: '50%',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvas => {
            this.canvas = canvas;
          }}
          onMouseMove={this.onMouseMove}
          onClick={this.onClick}
          onWheel={this.onWheel}
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        {/* Probably want to lift FocusActivty and HoverActivity up so updating it doesn't cause entire re-render... */}
        {this.canvas && [
          focusedActivityBlock &&
            <FocusActivity
              key="focused"
              visible={Boolean(this.props.focusedActivity_id)}
              x={focusedActivityBlock.barX}
              y={focusedActivityBlock.barY}
              width={focusedActivityBlock.barWidth || 400}
              height={this.activityHeight}
            />,
          hoveredActivityBlock &&
            <HoverActivity
              key="hovered"
              visible={Boolean(this.props.hoveredActivity_id)}
              x={hoveredActivityBlock.barX}
              y={hoveredActivityBlock.barY}
              width={hoveredActivityBlock.barWidth || 400}
              height={this.activityHeight}
            />,
        ]}
      </div>
    );
  }

  draw() {
    if (this.canvas) {
      this.ctx.save();

      this.ctx.scale(this.state.ratio, this.state.ratio);

      // clear the canvas
      this.ctx.fillStyle = colors.background;
      // this.ctx.globalAlpha = 0.5;
      this.ctx.fillRect(0, 0, this.state.canvasWidth, this.state.canvasHeight);
      // this.ctx.globalAlpha = 1;

      // draw vertical bars
      this.drawGrid(this.ctx);

      this.ctx.font = '11px sans-serif';

      if (this.props.activities) {
        Object.values(this.props.activities).forEach(activity => {
          // marky.mark(`name ${activity.name}`);
          // 👇 I called it a transform for lack of a better term, even though it doesn't tell you everything a transform usually does
          const { barX, barY, barWidth } = this.getBarTransform(
            activity,
            this.activityHeight,
            this.topOffset + this.state.offsets[activity.thread.id]
          );

          // don't draw bar if whole thing is this.left of view
          if (barX + barWidth < 0) {
            return;
          }

          // don't draw bar if whole thing is this.right of view
          if (barX > this.state.canvasWidth) {
            return;
          }

          this.ctx.fillStyle = colors.flames.main;

          /** 💁 sometimes the categories array contains null or undefined... probably shouldn't but 🤷‍ */
          if (activity.categories.length > 0 && activity.categories[0]) {
            // ⚠️ don't always just show the color belonging to category 0... need a better way
            const cat = this.props.categories.find(
              element => element.id === activity.categories[0]
            );
            if (cat) {
              this.ctx.fillStyle = cat.color;
            }
          }
          this.ctx.fillRect(barX, barY, barWidth, this.activityHeight);

          // don't even think about drawing text if bar is too small
          if (barWidth < this.minTextWidth) {
            return;
          }
          // marky.mark(`text ${activity.name}`);
          const { textWidth } = this.ctx.measureText(activity.name);

          if (textWidth + FlameChart.textPadding.x > barWidth) {
            return;
          }

          // ⚠️ chrome devtools caches the text widths for perf. If I notice that becoming an issue, I will look into doing the same.
          /** ⚠️ Emoji's need fixing in here. */
          const text = trimTextMiddle(
            this.ctx,
            activity.name || '',
            barWidth - 2 * FlameChart.textPadding.x
          );

          this.ctx.fillStyle = colors.text;
          this.ctx.fillText(
            text,
            barX + FlameChart.textPadding.x,
            barY + FlameChart.textPadding.y
          );
          // marky.stop(`text ${activity.name}`);

          // marky.stop(`name ${activity.name}`);
        });
      }
      this.drawFutureWindow(this.ctx);
      this.drawThreadHeaders(this.ctx);

      this.ctx.restore();
    }
  }

  /**
   * @param {number} timestamp (UTC) 
   * @memberof FlameChart
   * @returns {number} returns x coordinate of timestamp on canvas
   */
  timeToPixels(timestamp: number) {
    return (
      (timestamp - this.props.leftBoundaryTime) *
      (this.state.canvasWidth / this.state.ratio) /
      (this.props.rightBoundaryTime - this.props.leftBoundaryTime)
    );
  }

  pixelsToTime(x) {
    if (this.canvas) {
      return (
        this.props.leftBoundaryTime +
        x *
          (this.props.rightBoundaryTime - this.props.leftBoundaryTime) /
          (this.state.canvasWidth / this.state.ratio)
      );
    }
  }

  pixelsToThread_id(y: number): number {
    const reverseOffsets = sortBy(this.state.offsets).reverse();
    let i = 0;
    while (y < reverseOffsets[i]) {
      i++;
    }
    /** 💁 fucking reverse mutates in javascript */
    return [...this.props.threads].reverse()[i].id;
  }

  pixelsToLevel(y: number): number {
    const reverseOffsets = sortBy(this.state.offsets).reverse();
    let i = 0;
    while (y < reverseOffsets[i]) {
      i++;
    }

    const distFromBottomOfThreadHeader =
      y - (reverseOffsets[i] + FlameChart.threadHeaderHeight);

    return Math.floor(distFromBottomOfThreadHeader / (1 + this.activityHeight));
  }

  drawThreadHeaders(ctx) {
    ctx.fillStyle = colors.text;
    ctx.globalAlpha = 1;
    this.props.threads.forEach(thread => {
      ctx.fillText(
        thread.name,
        FlameChart.textPadding.x,
        this.state.offsets[thread.id] + FlameChart.textPadding.y
      );

      ctx.save();
      ctx.fillStyle = this.state.hoverThreadEllipsis === thread.id
        ? '#000000'
        : '#dddddd';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(
          this.state.canvasWidth - 30 + 6 * i,
          this.state.offsets[thread.id] + 10,
          2,
          0,
          360
        );
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // ⚠️ TODO vertical grid
  drawGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = '#e7e7e7';

    ctx.beginPath();
    Object.values(this.state.offsets).forEach((threadOffset, ind) => {
      if (ind > 0) {
        this.hLine(ctx, threadOffset - 2);
      }
    });
    ctx.stroke();

    // ctx.moveTo(100, 100);
    ctx.moveTo(100, 100);
    // this.vLine(ctx, Math.random() * 1000);
    ctx.restore();
  }

  hLine(ctx, y) {
    ctx.moveTo(0, y);
    ctx.lineTo(this.state.canvasWidth, y);
  }

  vLine(ctx, x, length = this.state.canvasHeight) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, length);
    ctx.stroke();
  }

  drawFutureWindow(ctx) {
    // ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#B6C8E8';
    ctx.strokeStyle = '#7B9EDE';
    const now = Date.now();

    if (now < this.props.rightBoundaryTime) {
      const nowPixels = this.timeToPixels(now);
      ctx.fillRect(
        nowPixels,
        0,
        this.state.canvasWidth - nowPixels + 10,
        this.state.canvasHeight
      );
      ctx.strokeRect(
        nowPixels,
        0,
        this.state.canvasWidth - nowPixels + 10,
        this.state.canvasHeight
      );
    }
    // ctx.restore();
  }

  getBarTransform(
    { startTime, endTime, level }: Activity,
    barHeight: number,
    offsetFromTop: number
  ): { barX: number, barY: number, barWidth: number } {
    if (endTime == null) {
      endTime = this.props.rightBoundaryTime;
    }

    const barX = this.timeToPixels(
      startTime > this.props.leftBoundaryTime
        ? startTime
        : this.props.leftBoundaryTime
    );
    const barY =
      FlameChart.threadHeaderHeight + level * (1 + barHeight) + offsetFromTop; // 👈 the + 1 is a margin
    const barWidth = this.timeToPixels(endTime) - barX;

    return { barX, barY, barWidth };
  }
}

export default // flow-ignore
connect(
  state => ({
    focusedActivity_id: getTimeline(state).focusedActivity_id,
    hoveredActivity_id: getTimeline(state).hoveredActivity_id,
  }),
  dispatch => ({
    focusActivity: id => dispatch(focusActivity(id)),
    hoverActivity: id => dispatch(hoverActivity(id)),
  })
)(FlameChart);
