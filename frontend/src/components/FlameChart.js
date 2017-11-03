// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
// flow-ignore
import pickBy from 'lodash/fp/pickBy';
// flow-ignore
import compose from 'lodash/fp/compose';
import isEqual from 'lodash/isEqual';

// ⚠️ abstract into parts of react-flame-chart
import HoverActivity from 'components/HoverActivity';
import FocusActivity from 'components/FocusActivity';

import { constrain, trimTextMiddle } from 'utilities';
import { focusActivity, hoverActivity } from 'actions';
import { getTimeline } from 'reducers/timeline';
import { colors } from 'styles';

import type { Activity } from 'types/Activity';

type Props = {
  activities?: { [id: string]: Activity },
  minTime?: number,
  maxTime?: number,
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  topOffset: number,
  focusActivity: (?string) => mixed,
  hoverActivity: (?string) => mixed,
  focusedActivityId?: string,
  hoveredActivityId?: string,
  categories: { id: string, name: string, color: string },
  threads: { name: string, id: number, rank: number }[],
};

type State = {
  canvasWidth: number, // in pixels
  canvasHeight: number, // in pixels
  ratio: number, // window.devicePixelRatio (ie, it is 2 on my laptop, but 1 on my external monitor)
  offsets: {},
};

class FlameChart extends Component<Props, State> {
  ctx: CanvasRenderingContext2D;
  canvas: ?HTMLCanvasElement;
  minTextWidth: number;

  topOffset = 0;

  static textPadding = { x: 5, y: 13.5 };
  static foldedThreadHeight = 100;

  activityHeight = 20; // px
  state = {
    canvasWidth: 0,
    canvasHeight: 0,
    ratio: 1,
    offsets: {},
  };

  constructor(props) {
    super(props);

    if (props.threads) {
      const offsets = {};
      props.threads.forEach(thread => {
        offsets[thread.id] = thread.rank * FlameChart.foldedThreadHeight;
      });
      this.state.offsets = offsets;
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.setCanvasSize);
    if (this.canvas) {
      this.setCanvasSize();
    }
  }

  componentDidReceiveProps(nextProps) {
    if (!isEqual(this.props.threads, nextProps.threads)) {
      console.log('nextprop threads notequals', nextProps.threads);
      const offsets = {};
      nextProps.threads.forEach(thread => {
        offsets[thread.id] = thread.rank * FlameChart.foldedThreadHeight;
      });
      debugger;
      this.setState({ offsets });
    }
  }

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
    const hitLevel = this.pixelsToLevel(e.nativeEvent.offsetY);

    const filterByTime = pickBy(
      activity =>
        ts > activity.startTime &&
        (ts < activity.endTime || activity.endTime === undefined),
    );

    const filterByLevel = pickBy(activity => activity.level === hitLevel);

    const hitActivities = compose(filterByTime, filterByLevel)(
      this.props.activities,
    );

    if (Object.keys(hitActivities).length === 0) {
      // TODO this.props.highlightActivity(null);
      return null;
    } else if (Object.keys(hitActivities).length !== 1) {
      throw new Error('multiple hits! something is wrong!', hitActivities);
    }

    const hitActivityKey: string = Object.keys(hitActivities)[0];
    // const hitActivity: Activity = hitActivities[hitActivityKey];
    // const { startTime, endTime, level } = hitActivity;
    // const { barX, barY, barWidth } = this.getBarTransform(
    //   hitActivity,
    //   this.activityHeight,
    //   this.topOffset
    // );

    // console.log('hitActivity', hitActivity.name);

    return hitActivityKey;
  };

  onClick = e => {
    const hitActivityKey = this.hitTest(e);
    if (hitActivityKey) {
      this.props.focusActivity(hitActivityKey);
    } else {
      this.props.focusActivity(null);
    }
  };

  onMouseMove = e => {
    const hitActivityKey = this.hitTest(e);
    if (hitActivityKey) {
      this.props.hoverActivity(hitActivityKey);
    } else {
      this.props.hoverActivity(null);
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
        this.state.canvasWidth,
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
        this.topOffset + this.state.offsets[activity.thread.id],
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
      this.canvas && this.props.activities && this.props.focusedActivityId,
    );
    const hoveredActivityBlock = this.getBlockDetails(
      this.canvas && this.props.activities && this.props.hoveredActivityId,
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
          focusedActivityBlock && (
            <FocusActivity
              key="focused"
              visible={Boolean(this.props.focusedActivityId)}
              x={focusedActivityBlock.barX}
              y={focusedActivityBlock.barY}
              width={focusedActivityBlock.barWidth || 400}
              height={this.activityHeight}
            />
          ),
          hoveredActivityBlock && (
            <HoverActivity
              key="hovered"
              visible={Boolean(this.props.hoveredActivityId)}
              x={hoveredActivityBlock.barX}
              y={hoveredActivityBlock.barY}
              width={hoveredActivityBlock.barWidth || 400}
              height={this.activityHeight}
            />
          ),
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
            this.topOffset + this.state.offsets[activity.thread.id],
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
              element => element.id === activity.categories[0],
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
            // debugger
            return;
          }

          // ⚠️ chrome devtools caches the text widths for perf. If I notice that becoming an issue, I will look into doing the same.
          /** ⚠️ Emoji's need fixing in here. */
          const text = trimTextMiddle(
            this.ctx,
            activity.name || '',
            barWidth - 2 * FlameChart.textPadding.x,
          );

          this.ctx.fillStyle = colors.text;
          this.ctx.fillText(
            text,
            barX + FlameChart.textPadding.x,
            barY + FlameChart.textPadding.y,
          );
          // marky.stop(`text ${activity.name}`);

          // marky.stop(`name ${activity.name}`);
        });
      }
      this.drawFutureWindow(this.ctx);
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

  // GETTING TRICKY and DONT WANT TO THINK ABOUT IT RIGHT NOW!
  LOOK AT ME
  pixelsToLevel(y: number): number {
    return Math.floor(y / (1 + this.activityHeight));
  }
  // ⚠️ TODO
  drawGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = '#e7e7e7';
    // ctx.moveTo(100, 100);
    ctx.moveTo(100, 100);
    // this.vLine(ctx, Math.random() * 1000);
    ctx.restore();
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
        this.state.canvasHeight,
      );
      ctx.strokeRect(
        nowPixels,
        0,
        this.state.canvasWidth - nowPixels + 10,
        this.state.canvasHeight,
      );
    }
    // ctx.restore();
  }

  getBarTransform(
    { startTime, endTime, level }: Activity,
    barHeight: number,
    offsetFromTop: number,
  ): { barX: number, barY: number, barWidth: number } {
    if (endTime == null) {
      endTime = this.props.rightBoundaryTime;
    }

    const barX = this.timeToPixels(
      startTime > this.props.leftBoundaryTime
        ? startTime
        : this.props.leftBoundaryTime,
    );
    const barY = level * (1 + barHeight) + offsetFromTop; // 👈 the + 1 is a margin
    const barWidth = this.timeToPixels(endTime) - barX;

    return { barX, barY, barWidth };
  }
}

export default // flow-ignore
connect(
  state => ({
    focusedActivityId: getTimeline(state).focusedActivityId,
    hoveredActivityId: getTimeline(state).hoveredActivityId,
  }),
  dispatch => ({
    focusActivity: id => dispatch(focusActivity(id)),
    hoverActivity: id => dispatch(hoverActivity(id)),
  }),
)(FlameChart);
