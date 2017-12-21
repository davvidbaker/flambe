// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
// flow-ignore
import pickBy from 'lodash/fp/pickBy';
// flow-ignore
import compose from 'lodash/fp/compose';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import mapValues from 'lodash/mapValues';

// ⚠️ abstract into parts of react-flame-chart
import HoverActivity from 'components/HoverActivity';
import FocusActivity from 'components/FocusActivity';
import Tooltip from 'components/Tooltip';
import SAMPLE_SEARCH_DATA from 'constants/sampleSearchData';
// import SAMPLE_SEARCH_DATA from 'constants/sampleSearchData'
// import SAMPLE_SEARCH_DATA from 'constants/sampleSearchData'
// import SAMPLE_SEARCH_DATA from 'constants/sampleSearchData'
// import SAMPLE_SEARCH_DATA from 'constants/sampleSearchData'
// import SAMPLE_SEARCH_DATA from 'constants/sampleSearchData'
// import SAMPLE_SEARCH_DATA from 'constants/sampleSearchData'

import {
  constrain,
  trimTextMiddle,
  deepArrayIsEqual,
  shortEnglishHumanizer,
} from 'utilities';
import { focusBlock, hoverBlock } from 'actions';
import { getTimeline } from 'reducers/timeline';
import { colors } from 'styles';

import type { Activity } from 'types/Activity';

type Props = {
  hoverBlock: ?string => mixed,
  focusedBlockIndex?: string,
  leftBoundaryTime: number,
  maxTime?: number,
  minTime?: number,
  modifiers: { shift: boolean },
  hoveredBlockIndex?: string,
  rightBoundaryTime: number,
  threadLevels: { id: { current: number, max: number } }[],
  threads: { name: string, id: number, rank: number, minimized: boolean }[],
  topOffset: number,
  // functions
  activities?: { [id: string]: Activity },
  categories: { id: string, name: string, color: string },
  focusBlock: (id: number, thread_id: number) => mixed,
  showThreadDetail: (id: number) => mixed,
  toggleThread: (id: number, isMinimized: boolean) => mixed,
};

type State = {
  canvasWidth: number, // in pixels
  canvasHeight: number, // in pixels
  cursor: { x: number, y: number },
  devicePixelRatio: number, // window.devicePixelRatio (ie, it is 2 on my laptop, but 1 on my external monitor)
  hoverThreadEllipsis: number, // the id of the thread whose details ellipsis is being hovered
  measurement: { left: ?number, right: ?number },
  measuring: boolean,
  mousedown: boolean,
  mousedownX: number,
  offsets: {},
};

class FlameChart extends Component<Props, State> {
  ctx: CanvasRenderingContext2D;
  canvas: ?HTMLCanvasElement;
  tooltip: ?HTMLElement;
  minTextWidth: number;
  topOffset = 0;

  static textPadding = { x: 5, y: 13.5 };
  static foldedThreadHeight = 100;
  static threadHeaderHeight = 20;

  blockHeight = 20; // px
  state = {
    canvasWidth: null,
    canvasHeight: null,
    cursor: {
      x: 0,
      y: 0,
    },
    hoverThreadEllipsis: null,
    measurement: {
      left: null,
      right: null,
    },
    measuring: false,
    mousedown: false,
    mousedownX: null,
    offsets: {},
    ratio: 1,
  };

  constructor(props) {
    super(props);
    const offsets = this.setOffsets(props.threads, props.threadLevels);
    this.state.offsets = offsets;
  }

  componentDidMount() {
    window.addEventListener('resize', this.setCanvasSize.bind(this));
    this.setCanvasSize();
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
        const add = thread.minimized
          ? FlameChart.threadHeaderHeight
          : (this.blockHeight + 1) * threadLevels[thread.id].max +
              FlameChart.threadHeaderHeight;
        return acc + add + spacer;
      }, 0);

      return offsets;
    }
    return {};
  };

  setCanvasSize = () => {
    if (this.canvas) {
      const header = document.querySelector('header');
      const devicePixelRatio = window.devicePixelRatio;
      // this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
      // this.canvas.height = this.canvas.clientHeight * devicePixelRatio;

      this.ctx = this.canvas.getContext('2d');
      this.minTextWidth =
        FlameChart.textPadding.x + this.ctx.measureText('\u2026').textWidth;

      this.setState(
        {
          devicePixelRatio,
          canvasWidth: window.innerWidth * devicePixelRatio,
          canvasHeight: window.innerHeight * devicePixelRatio -
            header.clientHeight,
        },
        this.render
      );
    }
  };

  hitTest = e => {
    const ts = this.pixelsToTime(e.nativeEvent.offsetX);
    const hitThread_id = this.pixelsToThread_id(e.nativeEvent.offsetY);
    const hitLevel = this.pixelsToLevel(e.nativeEvent.offsetY);

    const filterByTime = pickBy(
      block =>
        ts > block.startTime &&
        (ts < block.endTime || block.endTime === undefined)
    );

    const filterByLevel = pickBy(block => block.level === hitLevel);

    const filterByThread = pickBy(
      block =>
        this.props.activities[block.activity_id].thread.id === hitThread_id
    );

    const hitBlocks = compose(filterByTime, filterByLevel, filterByThread)(
      this.props.blocks
    );

    /** 💁 this is the header (hitLevel === -1) */
    if (hitLevel === -1) {
      if (
        e.nativeEvent.offsetX >
        this.state.canvasWidth / this.state.devicePixelRatio - 30
      ) {
        return { type: 'thread_ellipsis', value: hitThread_id };
      }
      return { type: 'thread_header', value: hitThread_id };
    }

    if (Object.keys(hitBlocks).length === 0) {
      return null;
    } else if (Object.keys(hitBlocks).length !== 1) {
      throw new Error('multiple hits! something is wrong!', hitBlocks);
    }

    const hitBlock = Object.entries(hitBlocks)[0];
    return { type: 'block', value: hitBlock };
  };

  onClick = e => {
    const hit = this.hitTest(e);
    if (hit) {
      switch (hit.type) {
        case 'thread_ellipsis':
          this.props.showThreadDetail(hit.value);
          break;
        case 'thread_header':
          console.log('hit thread header', hit.value);
          this.props.toggleThread(
            hit.value,
            this.props.threads.find(thread => thread.id === hit.value).minimized
          );
          break;
        /** 💁 hit.value is array like [key, val] */
        case 'block':
          const block = this.props.blocks[hit.value[0]];
          const activity = this.props.activities[block.activity_id];
          this.props.focusBlock({
            index: hit.value[0],
            activity_id: block.activity_id,
            activityStatus: activity.status,
            thread_id: activity.thread.id,
          });
          break;

        default:
      }
    } else {
      this.props.focusBlock({
        index: null,
        activity_id: null,
        activityStatus: null,
        thread_id: null,
      });
    }
  };

  onTouchMove = e => {
    const touch = e.touches[0];

    if (this.lastTouch) {
      this.props.pan(
        this.lastTouch.x - touch.screenX,
        0,
        this.state.canvasWidth
      );
      requestAnimationFrame(this.draw.bind(this));
    }

    this.lastTouch = { x: touch.screenX, y: touch.screenY };

    // this.setState({
    //   cursor: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY },
    // });

    // const hit = this.hitTest(e);
    // if (hit) {
    //   switch (hit.type) {
    //     case 'thread_ellipsis':
    //       this.canvas.style.cursor = 'pointer';
    //       this.setState({
    //         hoverThreadEllipsis: hit.value,
    //       });
    //       break;
    //     /** 💁 hit.value is array like [key, val] */
    //     case 'block':
    //       this.props.hoverBlock(hit.value[0]);
    //       this.canvas.style.cursor = 'default';
    //       this.setState({ hoverThreadEllipsis: null });
    //       break;

    //     default:
    //   }
    // } else {
    //   this.props.hoverBlock(null);

    //   if (this.state.hoverThreadEllipsis) {
    //     this.canvas.style.cursor = 'default';
    //     this.setState({ hoverThreadEllipsis: null });
    //   }
    // }

    // if (this.state.measuring) {
    //   const eTimeX = this.pixelsToTime(e.nativeEvent.offsetX);
    //   if (this.state.mousedown) {
    //     if (eTimeX < this.state.mousedownX) {
    //       this.setState({
    //         measurement: {
    //           left: eTimeX,
    //           right: this.state.mousedownX,
    //         },
    //       });
    //     } else {
    //       this.setState({
    //         measurement: {
    //           left: this.state.mousedownX,
    //           right: eTimeX,
    //         },
    //       });
    //     }
    //   } else {
    //     this.setState({ measurement: { left: eTimeX, right: null } });
    //   }
    // } else {
    //   this.setState({ measurement: { left: null, right: null } });
    // }
  };
  onTouchStart = e => {
    this.lastTouch = null;
  };

  onMouseMove = e => {
    console.log('onMousemMove');
    this.setState({
      cursor: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY },
    });

    const hit = this.hitTest(e);
    if (hit) {
      switch (hit.type) {
        case 'thread_ellipsis':
          this.canvas.style.cursor = 'pointer';
          this.setState({
            hoverThreadEllipsis: hit.value,
          });
          break;
        case 'thread_header':
          this.canvas.style.cursor = 'pointer';
          break;
        /** 💁 hit.value is array like [key, val] */
        case 'block':
          this.props.hoverBlock(hit.value[0]);
          this.canvas.style.cursor = 'default';
          this.setState({ hoverThreadEllipsis: null });
          break;

        default:
          this.canvas.style.cursor = 'default';
          break;
      }
    } else {
      this.props.hoverBlock(null);
      this.canvas.style.cursor = 'default';

      if (this.state.hoverThreadEllipsis) {
        this.setState({ hoverThreadEllipsis: null });
      }
    }

    if (this.state.measuring) {
      const eTimeX = this.pixelsToTime(e.nativeEvent.offsetX);
      if (this.state.mousedown) {
        if (eTimeX < this.state.mousedownX) {
          this.setState({
            measurement: {
              left: eTimeX,
              right: this.state.mousedownX,
            },
          });
        } else {
          this.setState({
            measurement: {
              left: this.state.mousedownX,
              right: eTimeX,
            },
          });
        }
      } else {
        this.setState({ measurement: { left: eTimeX, right: null } });
      }
    } else {
      this.setState({ measurement: { left: null, right: null } });
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

  getBlockDetails = blockIndex => {
    if (blockIndex !== null && blockIndex !== undefined) {
      const block = this.props.blocks[blockIndex];
      if (!block) return false;
      const activity =
        this.props.activities && this.props.activities[block.activity_id];

      if (this.props.threads.find(thread => thread.id === activity.thread.id).minimized) return false;
      
      const { blockX, blockY, blockWidth } = this.getBlockTransform(
        block,
        this.blockHeight,
        this.topOffset + this.state.offsets[activity.thread.id]
      );

      const { startMessage, endMessage, ending } = block;

      return {
        blockWidth,
        blockX,
        blockY,
        startMessage,
        ending,
        endMessage,
      };
    }
  };

  onMouseDown = e => {
    const eTimeX = this.pixelsToTime(e.nativeEvent.offsetX);
    this.setState({ mousedown: true, mousedownX: eTimeX });
    if (this.props.modifiers.shift) {
      this.setState({
        measuring: true,
        measurement: {
          left: eTimeX,
          right: eTimeX,
        },
      });
    }
  };

  onMouseUp = () => {
    this.setState({ mousedown: false, measuring: false, mousedownX: null });
  };

  render() {
    const focusedBlock = this.getBlockDetails(
      this.canvas && this.props.activities && this.props.focusedBlockIndex
    );
    const hoveredBlock = this.getBlockDetails(
      this.canvas && this.props.activities && this.props.hoveredBlockIndex
    );

    const hoveredActivity = hoveredBlock
      ? this.props.activities[
        this.props.blocks[this.props.hoveredBlockIndex].activity_id
      ]
      : null;

    this.draw();

    // flow-ignore
    return (
      <div
        style={{
          height: '100%',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvas => {
            this.canvas = canvas;
          }}
          onMouseMove={this.onMouseMove}
          onTouchMove={this.onTouchMove}
          onTouchStart={this.onTouchStart}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onClick={this.onClick}
          onDrag={this.onDrag}
          onWheel={this.onWheel}
          style={{
            width: `${this.state.canvasWidth}px` || '100%',
            height: `${this.state.canvasHeight}px` || '100%',
          }}
          height={this.state.canvasHeight * this.state.devicePixelRatio || 300}
          width={this.state.canvasWidth * this.state.devicePixelRatio || 450}
        />

        {/* Probably want to lift FocusActivty and HoverActivity up so updating it doesn't cause entire re-render... */}
        {this.canvas && [
          focusedBlock &&
            <FocusActivity
              key="focused"
              visible={this.props.focusedBlockIndex !== null}
              x={focusedBlock.blockX}
              y={focusedBlock.blockY}
              width={focusedBlock.blockWidth || 400}
              height={this.blockHeight}
            />,
          hoveredBlock &&
            <HoverActivity
              key="hovered"
              visible={Boolean(this.props.hoveredBlockIndex !== null)}
              x={hoveredBlock.blockX}
              y={hoveredBlock.blockY}
              width={hoveredBlock.blockWidth || 400}
              height={this.blockHeight}
            />,

          <Tooltip
            ending={hoveredBlock ? hoveredBlock.ending : null}
            endMessage={hoveredBlock ? hoveredBlock.endMessage : null}
            key="tooltip"
            name={hoveredActivity ? hoveredActivity.name : null}
            startMessage={hoveredBlock ? hoveredBlock.startmessage : null}
            tooltipRef={t => {
              this.tooltip = t;
            }}
            {...this.calcTooltipOffset()}
          />,
        ]}
      </div>
    );
  }

  calcTooltipOffset() {
    marky.mark('calctooltip');
    /** borrowed directly from ChromeDevTools */
    if (this.tooltip) {
      const tooltipWidth = this.tooltip.clientWidth;
      const tooltipHeight = this.tooltip.clientHeight;

      const parentWidth = this.tooltip.parentElement.clientWidth;
      const parentHeight = this.tooltip.parentElement.clientHeight;

      let x,
        y;
      for (let quadrant = 0; quadrant < 4; ++quadrant) {
        const dx = quadrant & 2 ? -10 - tooltipWidth : 10;
        const dy = quadrant & 1 ? -6 - tooltipHeight : 6;
        x = constrain(this.state.cursor.x + dx, 0, parentWidth - tooltipWidth);
        y = constrain(
          this.state.cursor.y + dy,
          0,
          parentHeight - tooltipHeight
        );
        if (
          x >= this.state.cursor.x ||
          this.state.cursor.x >= x + tooltipWidth ||
          y >= this.state.cursor.y ||
          this.state.cursor.y >= y + tooltipHeight
        ) {
          break;
        }
      }

      marky.stop('calctooltip');

      return {
        left: `${x}px`,
        top: `${y}px`,
      };
    }
  }

  draw() {
    if (this.canvas) {
      this.ctx.save();

      this.ctx.scale(this.state.devicePixelRatio, this.state.devicePixelRatio);

      // clear the canvas
      this.ctx.fillStyle = colors.background;
      // this.ctx.globalAlpha = 0.5;
      this.ctx.fillRect(0, 0, this.state.canvasWidth, this.state.canvasHeight);
      // this.ctx.globalAlpha = 1;

      // draw vertical bars
      this.drawGrid(this.ctx);

      if (this.props.blocks) {
        // Object.values(this.props.activities).forEach(activity => {
        for (let i = 0; i < this.props.blocks.length; i++) {
          const block = this.props.blocks[i];
          const activity = this.props.activities[block.activity_id];
          if (!activity) console.log('block missing activity 😲', block);
          this.ctx.font = `${block.endTime ? '' : 'bold'} 11px sans-serif`;
          // marky.mark(`name ${activity.name}`);

            this.drawBlock(block, activity);
         
        }
      }
      this.drawFutureWindow(this.ctx);
      this.drawThreadHeaders(this.ctx);
      this.drawMeasurementWindow(this.ctx, this.state.measurement);

      this.ctx.scale(0.5, 0.5);
      this.ctx.restore();
    }
  }

  drawMinimizedBlock(block, activity) {
    this.ctx.globalAlpha = 0.1;
  }

  drawBlock(block, activity) {
    const minimized = (this.props.threads.find(thread => thread.id === activity.thread.id).minimized)
     // 👇 I called it a transform for lack of a better term, even though it doesn't tell you everything a transform usually does
     const { blockX, blockY, blockWidth } = this.getBlockTransform(
      minimized ? {...block, level: -1 } : block,
      this.blockHeight,
      (minimized ? 1 : 0) + this.topOffset + this.state.offsets[activity.thread.id]
    );

    // don't draw bar if whole thing is this.left of view
    if (blockX + blockWidth < 0) {
      return;
    }

    // don't draw bar if whole thing is this.right of view
    if (blockX > this.state.canvasWidth) {
      return;
    }
    
    this.ctx.globalAlpha = minimized ? 0.2 : 1;
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
    this.ctx.fillRect(blockX, blockY, blockWidth, this.blockHeight);

    // don't even think about drawing text if bar is too small
    if (blockWidth < this.minTextWidth) {
      return;
    }
    // marky.mark(`text ${activity.name}`);
    const { textWidth } = this.ctx.measureText(activity.name);

    if (textWidth + FlameChart.textPadding.x > blockWidth) {
      return;
    }

    if (minimized) return;
    // ⚠️ chrome devtools caches the text widths for perf. If I notice that becoming an issue, I will look into doing the same.
    /** ⚠️ Emoji's need fixing in here. */
    const text = trimTextMiddle(
      this.ctx,
      activity.name || '',
      blockWidth - 2 * FlameChart.textPadding.x
    );

    this.ctx.fillStyle = colors.text;
    this.ctx.fillText(
      text,
      blockX + FlameChart.textPadding.x,
      blockY + FlameChart.textPadding.y
    );

    // visually denote a resumed activity
    if (block.beginning === 'R') {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(blockX - 1, blockY);
      const jagDepth = constrain(blockWidth / 5, 5, 15);
      for (let j = 0; j < 6; j++) {
        this.ctx.lineTo(
          blockX + (j % 2 ? jagDepth : -1),
          blockY + j * this.blockHeight / 6
        );
      }
      this.ctx.lineTo(blockX - 1, blockY + this.blockHeight);
      this.ctx.fill();
    }

    // visually denote suspended activity
    if (block.ending === 'S') {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(blockX + blockWidth + 1, blockY);
      const jagDepth = constrain(blockWidth / 5, 5, 15);
      for (let j = 0; j < 6; j++) {
        this.ctx.lineTo(
          blockX + blockWidth - (j % 2 ? jagDepth : -1),
          blockY + j * this.blockHeight / 6
        );
      }
      this.ctx.lineTo(blockX + blockWidth + 1, blockY + this.blockHeight);
      this.ctx.fill();
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
      (this.state.canvasWidth / this.state.devicePixelRatio) /
      (this.props.rightBoundaryTime - this.props.leftBoundaryTime)
    );
  }

  pixelsToTime(x) {
    if (this.canvas) {
      return (
        this.props.leftBoundaryTime +
        x *
          (this.props.rightBoundaryTime - this.props.leftBoundaryTime) /
          (this.state.canvasWidth / this.state.devicePixelRatio)
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

    return Math.floor(distFromBottomOfThreadHeader / (1 + this.blockHeight));
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
          this.state.canvasWidth / this.state.devicePixelRatio - 30 + 6 * i,
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

  drawMeasurementWindow(ctx, measurement) {
    const { left, right } = mapValues(measurement, val =>
      this.timeToPixels(val)
    );
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#377C9C';
    ctx.fillStyle = '#377C9C';
    if (left && (right === null || typeof right === 'undefined')) {
      this.vLine(ctx, left);
    } else if (left && right) {
      ctx.globalAlpha = 0.2;
      ctx.fillRect(left, 0, right - left, this.state.canvasHeight);
      ctx.globalAlpha = 1;

      this.vLine(ctx, left);
      this.vLine(ctx, right);

      const txt = shortEnglishHumanizer(measurement.right - measurement.left);
      const txtWidth = ctx.measureText(txt).width;
      const txtX = right - left > txtWidth
        ? left + (right - left - txtWidth) / 2
        : left;
      this.ctx.fillStyle = colors.text;
      ctx.fillText(
        txt,
        txtX,
        this.state.canvasHeight / this.state.devicePixelRatio -
          (FlameChart.textPadding.y - 11)
      );
    }
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

  getBlockTransform(
    { startTime, endTime, level }: Activity,
    blockHeight: number,
    offsetFromTop: number
  ): { blockX: number, blockY: number, blockWidth: number } {
    if (endTime == null) {
      endTime = this.props.rightBoundaryTime;
    }

    const blockX = this.timeToPixels(
      startTime > this.props.leftBoundaryTime
        ? startTime
        : this.props.leftBoundaryTime
    );
    const blockY =
      FlameChart.threadHeaderHeight + level * (1 + blockHeight) + offsetFromTop; // 👈 the + 1 is a margin
    const blockWidth = this.timeToPixels(endTime) - blockX;

    return { blockX, blockY, blockWidth };
  }
}

export default // flow-ignore
connect(
  state => ({
    focusedBlockIndex: getTimeline(state).focusedBlockIndex,
    hoveredBlockIndex: getTimeline(state).hoveredBlockIndex,
  }),
  dispatch => ({
    focusBlock: ({ index, activity_id, activityStatus, thread_id }) =>
      dispatch(focusBlock({ index, activity_id, activityStatus, thread_id })),
    hoverBlock: index => dispatch(hoverBlock(index)),
  })
)(FlameChart);
