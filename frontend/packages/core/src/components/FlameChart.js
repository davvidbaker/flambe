// @flow
import React, { Component } from "react";
import emojiRegex from "emoji-regex";
import { connect } from "react-redux";
/* 💁     👇 intentionally "maxx"  */
import maxx from "lodash/fp/max";
import map from "lodash/fp/map";
import pipe from "lodash/fp/pipe";
import pickBy from "lodash/fp/pickBy";
import sortBy from "lodash/fp/sortBy";
import reduce from "lodash/fp/reduce";
import filter from "lodash/fp/filter";
import entries from "lodash/fp/entries";
import compose from "lodash/fp/compose";
import isEqual from "lodash/isEqual";
import reverse from "lodash/fp/reverse";
import zipWith from "lodash/fp/zipWith";
import identity from "lodash/fp/identity";
import mapValues from "lodash/fp/mapValues";
import isUndefined from "lodash/isUndefined";

import {
  setCanvasSize,
  pixelsToTime,
  timeToPixels,
  getBlockTransform,
  getBlockY,
  drawFutureWindow,
  isVisible
} from "../utilities/timelineChart";
/* 🔮  abstract into parts of react-flame-chart? */
import FocusActivity from "./FocusActivity";
import Tooltip from "./Tooltip";

import {
  constrain,
  trimTextMiddle,
  deepArrayIsEqual,
  shortEnglishHumanizer
} from "utilities";
import { focusBlock, hoverBlock } from "actions";
import { getTimeline } from "reducers/timeline";
import { colors } from "styles";

import type { Activity } from "types/Activity";
import type { Category as CategoryType } from "types/Category";

const reduceWithIndices = reduce.convert({ cap: false });

const SUSPENDED = 0;

function activityByBlockIndex(blocks, index) {
  if (index === null || isUndefined(index)) return null;
  if (!blocks[Number(index)]) return null;
  return blocks[Number(index)].activity_id;
}

type Props = {
  hoverBlock: (?string) => mixed,
  focusedBlockIndex?: string,
  leftBoundaryTime: number,
  maxTime?: number,
  minTime?: number,
  modifiers: { shift: boolean },
  hoveredBlockIndex?: string,
  rightBoundaryTime: number,
  threadLevels: { id: { current: number, max: number } }[],
  threads: { name: string, id: number, rank: number, collapsed: boolean }[],
  topOffset: number,
  // functions
  activities?: { [id: string]: Activity },
  categories: CategoryType[],
  focusBlock: (id: number, thread_id: number) => mixed,
  showThreadDetail: (id: number) => mixed,
  showSuspendResumeFlows: boolean,
  toggleThread: (id: number, isCollapsed: boolean) => mixed
};

type State = {
  canvasWidth: number, // in pixels
  canvasHeight: number, // in pixels
  cursor: { x: number, y: number },
  devicePixelRatio: number, // window.devicePixelRatio (ie, it is 2 on my laptop, but 1 on my external monitor)
  hoverThreadEllipsis: number | null, // the id of the thread whose details ellipsis is being hovered
  measurement: { left: ?number, right: ?number },
  measuring: boolean,
  mousedown: boolean,
  mousedownX: number,
  offsets: {},
  threadStatuses: {}
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
      y: 0
    },
    hoverThreadEllipsis: null,
    measurement: {
      left: null,
      right: null
    },
    measuring: false,
    draggingThread: null,
    resizing: false,
    resizingBlock: null,
    mousedown: false,
    mousedownX: null,
    offsets: {},
    ratio: 1
  };

  constructor(props) {
    super(props);

    this.state.offsets = this.setOffsets(props.threads, props.threadLevels);

    this.threadStatuses = {};
    Object.keys(props.threads).forEach(({ id }) => {
      id = Number(id);
      this.threadStatuses[id] = {
        status: "ok",
        suspendedActivity: { startTime: null, endTime: null }
      };
    });
  }

  componentDidMount() {
    window.addEventListener("resize", this.setCanvasSize.bind(this));
    this.setCanvasSize();
  }

  componentWillReceiveProps(nextProps) {
    // ⚠️ probably bad for perf
    if (
      !deepArrayIsEqual(
        Object.entries(this.props.threads),
        Object.entries(nextProps.threads)
      ) ||
      !isEqual(this.props.threadLevels, nextProps.threadLevels)
    ) {
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
      Object.keys(threads).length === Object.keys(threadLevels).length
    ) {
      const offsets = {};

      this.threadsSortedByRank = pipe(
        entries,
        sortBy(([_id, { rank }]) => rank),
        map(([key, val]) => [Number(key), val])
      )(threads);

      reduceWithIndices((acc, [thread_id, thread], ind) => {
        thread_id = Number(thread_id);
        const spacer = ind > 0 ? 4 : 0;
        offsets[thread_id] = acc + spacer; // FlameChart.foldedThreadHeight;
        const max =
          (threadLevels[thread_id] && threadLevels[thread_id].max) || 0;
        const add = thread.collapsed
          ? FlameChart.threadHeaderHeight
          : (this.blockHeight + 1) * max + FlameChart.threadHeaderHeight;
        return acc + add + spacer;
      }, 0)(this.threadsSortedByRank);

      return offsets;
    }
    return {};
  };

  setCanvasSize = () => {
    if (this.canvas) {
      const { ctx, minTextWidth, state } = setCanvasSize(
        this.canvas,
        FlameChart.textPadding,
        true
      );
      this.ctx = ctx;
      this.minTextWidth = minTextWidth;
      this.setState(state, this.render);
    }
  };

  hitTest = event => {
    const ts = this.pixelsToTime(event.nativeEvent.offsetX);
    const hitThreadPosition = this.pixelsToThreadPosition(event.nativeEvent.offsetY);
    const hitThread_id = this.threadsSortedByRank[hitThreadPosition][0];

    const hitLevel = this.pixelsToLevel(event.nativeEvent.offsetY);

    const filterByTime = pickBy(block =>
      ts > block.startTime &&
        (ts < block.endTime || block.endTime === undefined));

    const filterByLevel = pickBy(block => block.level === hitLevel);

    const filterByThread = pickBy(block =>
      this.props.activities[block.activity_id].thread_id === hitThread_id);

    const hitBlocks = compose(filterByTime, filterByLevel, filterByThread)(this.props.blocks);

    /** 💁 this is the header (hitLevel === -1) */
    if (hitLevel === -1) {
      if (event.nativeEvent.offsetX > this.state.canvasWidth - 30) {
        return { type: "thread_ellipsis", value: hitThread_id };
      }
      return { type: "thread_header", value: hitThread_id };
    }

    if (Object.keys(hitBlocks).length === 0) {
      return null;
    } else if (Object.keys(hitBlocks).length !== 1) {
      console.error("multiple hits! something is wrong!", hitBlocks);
    }

    const hitBlock = Object.entries(hitBlocks)[0];

    if (
      event.nativeEvent.offsetX > 10 &&
      event.nativeEvent.offsetX < this.state.canvasWidth - 10
    ) {
      const startX = this.timeToPixels(hitBlock[1].startTime);
      const endX =
        hitBlock[1].endTime && this.timeToPixels(hitBlock[1].endTime);
        
      /* 💁 don't resize if block is too small */
      if (endX - startX > 20) {
        if (event.nativeEvent.offsetX - startX < 10) {
          return { type: "block_edge_left", value: hitBlock };
        }
        if (endX && endX - event.nativeEvent.offsetX < 10) {
          return {
            type: "block_edge_right",
            value: hitBlock
          };
        }
      }
    }
    return { type: "block", value: hitBlock };
  };

  onContextMenu = e => {
    e.preventDefault();
    console.log("oncontext menu e", e);
  };

  onClick = e => {
    const hit = this.hitTest(e);

    if (hit) {
      console.log("hit", hit);
      switch (hit.type) {
        case "thread_ellipsis":
          console.log("hit.value", hit.value);
          this.props.showThreadDetail(hit.value);
          break;
        case "thread_header":
          this.props.toggleThread(
            hit.value,
            this.props.threads[hit.value].collapsed
          );
          break;
        /** 💁 hit.value is array like [key, val] */
        case "block":
          const block = this.props.blocks[hit.value[0]];
          const activity = this.props.activities[block.activity_id];
          this.props.focusBlock({
            index: hit.value[0],
            activity_id: block.activity_id,
            activityStatus: activity.status,
            thread_id: activity.thread_id
          });
          break;

        default:
      }
    } else {
      this.props.focusBlock({
        index: null,
        activity_id: null,
        activityStatus: null,
        thread_id: null
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
  };

  onTouchStart = e => {
    this.lastTouch = null;
  };

  onMouseMove = e => {
    this.setState({
      cursor: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }
    });

    if (this.state.resizing) {
    } else {
      const hit = this.hitTest(e);
      if (hit) {
        switch (hit.type) {
          case "thread_ellipsis":
            this.canvas.style.cursor = "pointer";
            this.props.hoverBlock(null);
            this.setState({
              hoverThreadEllipsis: hit.value
            });
            break;
          case "thread_header":
            this.canvas.style.cursor = "pointer";
            this.props.hoverBlock(null);
            this.setState({ hoverThreadEllipsis: null });
            break;
          /** 💁 hit.value is array like [key, val] */
          case "block":
            this.props.hoverBlock(hit.value[0]);
            this.canvas.style.cursor = "default";
            this.setState({ hoverThreadEllipsis: null });
            break;
          case "block_edge_left":
            this.props.hoverBlock(null);
            this.canvas.style.cursor = "w-resize";
            break;
          case "block_edge_right":
            this.props.hoverBlock(null);
            this.canvas.style.cursor = "e-resize";
            break;

          default:
            this.canvas.style.cursor = "default";
            break;
        }
      } else {
        this.props.hoverBlock(null);
        this.canvas.style.cursor = "default";

        if (this.state.hoverThreadEllipsis) {
          this.setState({ hoverThreadEllipsis: null });
        }
      }
    }

    if (this.state.measuring) {
      const eTimeX = this.pixelsToTime(e.nativeEvent.offsetX);
      if (this.state.mousedown) {
        if (eTimeX < this.state.mousedownX) {
          this.setState({
            measurement: {
              left: eTimeX,
              right: this.state.mousedownX
            }
          });
        } else {
          this.setState({
            measurement: {
              left: this.state.mousedownX,
              right: eTimeX
            }
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

      if (this.threadCollapsed(activity.thread_id)) {
        return false;
      }

      const { startTime, endTime, level } = block;
      const { blockX, blockY, blockWidth } = this.getBlockTransform(
        startTime,
        endTime,
        level,
        this.blockHeight,
        this.topOffset +
          this.state.offsets[activity.thread_id] +
          FlameChart.threadHeaderHeight
      );

      const { startMessage, endMessage, ending } = block;

      // ⚠️ ahead rough draft
      const activityBlocks = this.props.blocks.filter(b => block.activity_id === b.activity_id);

      const otherActivityBlocks = this.props.blocks.filter((b, index) =>
        block.activity_id === b.activity_id && Number(blockIndex) !== index);

      const otherMessages = otherActivityBlocks.map(({ startMessage, endMessage }) => ({ startMessage, endMessage }));

      return {
        blockWidth,
        blockX,
        blockY,
        startMessage,
        ending,
        endMessage,
        otherMessages
      };
    }
  };

  onMouseDown = e => {
    // e.preventDefault();
    const eTimeX = this.pixelsToTime(e.nativeEvent.offsetX);
    this.setState({ mousedown: true, mousedownX: eTimeX });
    if (this.props.modifiers.shift) {
      this.setState({
        measuring: true,
        measurement: {
          left: eTimeX,
          right: eTimeX
        }
      });
    } else {
      const hit = this.hitTest(e);
      if (hit) {
        if (hit.type.includes("block_edge")) {
          this.setState({
            resizing: hit.type.match(/edge_(.*)$/)[1],
            resizingBlock: hit.value
          });
          this.canvasCapture = this.captureCanvas();
        } else if (hit.type === "thread_header") {
          /* 💁  hit.value is the thread id */
          const thread_id = hit.value;
          this.setState({ draggingThread: thread_id });
          this.canvasCapture = this.captureCanvas();
          this.otherThreadCaptures = pipe(
            map(({ id }) => id),
            filter(id => id !== thread_id),
            map(id => ({ id, capture: this.captureThread(id) }))
          )(this.props.threads);
          this.threadCapture = this.captureThread(thread_id);
        }
      }
    }
  };

  onMouseUp = () => {
    if (this.state.resizing) {
      /* ⚠️ should do like an adjust activity thing that updates redux blocks */
      this.props.updateEvent(
        this.state.resizingBlock[1].events[
          this.state.resizing === "left" ? 0 : 1
        ],
        {
          timestamp_integer: Math.floor(this.pixelsToTime(this.state.cursor.x))
        }
      );
      // this.state.resizingBlock[1].activity_id, {
      //   updates: {
      //     [this.state.resizing === 'left'
      //       ? 'startTime'
      //       : 'endTime']: this.pixelsToTime(this.state.cursor.x),
      //   },
      // });
    } else if (this.state.draggingThread) {
      // this.props.updateThreadRank()
    }

    this.setState({
      mousedown: false,
      measuring: false,
      mousedownX: null,
      draggingThread: null,
      resizing: false,
      resizingBlock: null
    });
  };

  render() {
    this.maxThreadLevels = pipe(map(({ max }) => max), maxx)(this.props.threadLevels);
    const focusedBlock = this.getBlockDetails(this.canvas && this.props.activities && this.props.focusedBlockIndex);
    const hoveredBlock = this.getBlockDetails(this.canvas && this.props.activities && this.props.hoveredBlockIndex);

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
          height: "100%",
          position: "relative"
        }}
      >
        <canvas
          ref={canvas => {
            this.canvas = canvas;
          }}
          onClick={this.onClick}
          onContextMenu={this.onContextMenu}
          onDrag={this.onDrag}
          onMouseMove={this.onMouseMove}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onTouchMove={this.onTouchMove}
          onTouchStart={this.onTouchStart}
          onWheel={this.onWheel}
          style={{
            width: `${this.state.canvasWidth}px` || "100%",
            height: `${this.state.canvasHeight}px` || "100%"
          }}
          height={this.state.canvasHeight * this.state.devicePixelRatio || 300}
          width={this.state.canvasWidth * this.state.devicePixelRatio || 450}
        />

        {/* Probably want to lift FocusActivty and HoverActivity up so updating it doesn't cause entire re-render... */}
        {this.canvas && [
          focusedBlock && (
            <FocusActivity
              key="focused"
              visible={this.props.focusedBlockIndex !== null}
              x={focusedBlock.blockX}
              y={focusedBlock.blockY}
              width={focusedBlock.blockWidth || 400}
              height={this.blockHeight}
            />
          ),

          <Tooltip
            ending={hoveredBlock ? hoveredBlock.ending : null}
            endMessage={hoveredBlock ? hoveredBlock.endMessage : null}
            key="tooltip"
            name={hoveredActivity ? hoveredActivity.name : null}
            startMessage={hoveredBlock ? hoveredBlock.startmessage : null}
            otherMessages={hoveredBlock ? hoveredBlock.otherMessages : null}
            tooltipRef={t => {
              this.tooltip = t;
            }}
            {...this.calcTooltipOffset()}
          />
        ]}
      </div>
    );
  }

  captureThread(id) {
    const y = this.state.offsets[id];

    return this.ctx.getImageData(
      0,
      this.state.offsets[id] * this.state.devicePixelRatio,
      this.state.canvasWidth * this.state.devicePixelRatio,
      /* ⚠️ wrong */
      ((this.state.offsets[id + 1] || this.state.canvasHeight) - y) *
        this.state.devicePixelRatio
    );
  }

  calcTooltipOffset() {
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

      return {
        left: `${x}px`,
        top: `${y}px`
      };
    }
  }

  captureCanvas() {
    return this.ctx.getImageData(
      0,
      0,
      this.state.canvasWidth * this.state.devicePixelRatio,
      this.state.canvasHeight * this.state.devicePixelRatio
    );
  }

  clearCanvas() {
    // clear the canvas
    this.ctx.fillStyle = colors.background;
    // this.ctx.globalAlpha = 0.5;
    this.ctx.fillRect(0, 0, this.state.canvasWidth, this.state.canvasHeight);
  }

  draw() {
    if (this.canvas) {
      this.ctx.save();

      this.ctx.scale(this.state.devicePixelRatio, this.state.devicePixelRatio);

      this.clearCanvas();
      if (this.state.resizing) {
        if (this.canvasCapture) {
          this.ctx.putImageData(this.canvasCapture, 0, 0);
          this.ctx.globalAlpha = 0.4;
          this.ctx.fillRect(
            0,
            0,
            this.state.canvasWidth,
            this.state.canvasHeight
          );
        }
        this.drawBlock(
          {
            ...this.state.resizingBlock[1],
            ...(this.state.resizing === "left"
              ? { startTime: this.pixelsToTime(this.state.cursor.x) }
              : { endTime: this.pixelsToTime(this.state.cursor.x) })
          },
          this.props.activities[this.state.resizingBlock[1].activity_id]
        );
        // this.ctx.fillRect(this.state.cursor.x, this.state.cursor.y, 20, 20 );
      } else if (this.state.draggingThread !== null) {
        this.drawDraggingThreads();
      } else {
        this.hoverActivity_id = activityByBlockIndex(
          this.props.blocks,
          this.props.hoveredBlockIndex
        );
        this.focusActivity_id = activityByBlockIndex(
          this.props.blocks,
          this.props.focusedBlockIndex
        );
        // this.props.hoveredBlockIndex
        //   ? this.props.blocks[Number(this.props.hoveredBlockIndex)].activity_id
        //   : null;

        // draw vertical bars
        this.drawGrid(this.ctx);
        if (this.props.blocks) {
          this.drawBlocks();
        }
        this.drawFutureWindow();
        this.drawThreadHeaders(this.ctx);
        this.drawAttention(this.ctx);
        if (this.props.showSuspendResumeFlows) {
          this.drawSuspendResumeFlows();
        }

        /* 🔮 USE A SETTING */
        if (true) {
          // this.drawLimbo(this.ctx);
        }
        this.drawMeasurementWindow(this.ctx, this.state.measurement);
      }
      this.ctx.scale(0.5, 0.5);
      this.ctx.restore();
    }
  }

  drawDraggingThreads() {
    this.otherThreadCaptures.forEach(({ id, capture }) => {
      this.ctx.putImageData(
        capture,
        0,
        this.state.offsets[id] * this.state.devicePixelRatio
      );
    });
    this.ctx.fillStyle = "#dadada";
    const y = this.state.offsets[this.state.draggingThread];
    this.ctx.fillRect(
      0,
      y,
      this.state.canvasWidth * this.state.devicePixelRatio,
      this.state.offsets[this.state.draggingThread + 1] - y
    );
    this.ctx.putImageData(
      this.threadCapture,
      0,
      this.state.cursor.y * this.state.devicePixelRatio
    );
  }

  drawLimbo(ctx) {
    // ⚠️️️️/ ⚠️️️️/ ⚠️️️️/ ⚠️️️️/ ⚠️️️️ WIP
    // this.props.activities
    const suspendedActivities = pickBy(({ status }) => status === "suspended")(this.props.activities);

    Object.values(suspendedActivities).forEach((activity, i) => {
      this.drawBlock(
        {
          startTime: Date.now(),
          endTime: this.props.rightBoundaryTime,
          level: i
        },
        activity
      );
    });
  }

  drawFutureWindow() {
    return drawFutureWindow(
      this.ctx,
      this.props.leftBoundaryTime,
      this.props.rightBoundaryTime,
      this.state.canvasWidth,
      this.state.canvasHeight
    );
  }

  drawBlocks() {
    for (let i = 0; i < this.props.blocks.length; i++) {
      const block = this.props.blocks[i];
      const activity = this.props.activities[block.activity_id];
      if (!activity) console.log("block missing activity 😲", block);
      this.ctx.font = `${block.endTime ? "" : "bold"} 11px sans-serif`;

      if (activity) {
        this.drawBlock(block, activity, i);
      }
    }
  }

  isVisible(block) {
    return isVisible(
      block,
      this.props.leftBoundaryTime,
      this.props.rightBoundaryTime
    );
  }

  drawSuspendResumeFlows() {
    this.ctx.globalCompositeOperation = "source-over";

    /* ⚠️ terrible code ahead */
    /* ⚠️ not actually filtering blocks on by those within window because couldn't easily think of how to then draw flows to blocks that need to flow back to them... */
    // const onScreenBlocks = filter(this.isVisible.bind(this))(this.props.blocks);
    const onScreenBlocks = this.props.blocks;
    const onScreenBlocksByActivity = reduce(
      (acc, block) => ({
        ...acc,
        [block.activity_id]: [
          ...(acc[block.activity_id] ? acc[block.activity_id] : []),
          {
            ...block,
            thread_id: this.props.activities[block.activity_id].thread_id,
            cat: this.props.categories.find(element =>
              element.id ===
                this.props.activities[block.activity_id].categories[0])
          }
        ]
      }),
      {}
    )(onScreenBlocks);

    const onScreenBlocksByActivityWithMultipleBlocks = filter(blocks => blocks.length > 1)(onScreenBlocksByActivity);

    onScreenBlocksByActivityWithMultipleBlocks.forEach(arrayOfBlocks => {
      arrayOfBlocks.forEach((block, i) => {
        if (i === 0) return;
        if (this.threadCollapsed(block.thread_id)) return;
        const prevBlock = arrayOfBlocks[i - 1];
        const block1Width =
          this.timeToPixels(prevBlock.endTime) -
          this.timeToPixels(prevBlock.startTime);
        const block2Width =
          this.timeToPixels(block.endTime || Date.now()) -
          this.timeToPixels(block.startTime);

        const x1 = this.timeToPixels(prevBlock.endTime);
        const y1 =
          getBlockY(
            arrayOfBlocks[i - 1].level + 1,
            this.blockHeight,
            this.topOffset
          ) +
          this.topOffset +
          this.state.offsets[block.thread_id] -
          1;
        const x2 = this.timeToPixels(block.startTime);
        const y2 =
          getBlockY(block.level + 1, this.blockHeight, this.topOffset) +
          this.state.offsets[block.thread_id] +
          this.topOffset -
          1;

        const aThird = (x2 - x1) / 3;

        this.ctx.globalAlpha =
          block.activity_id === this.hoverActivity_id ||
          block.activity_id === this.focusActivity_id
            ? 0.8
            : 0.1;
        this.ctx.strokeStyle = block.cat
          ? block.cat.color_background
          : colors.flames.main;
        this.ctx.lineWidth = this.blockHeight;
        // this.ctx.fillStyle = 'black';
        // this.ctx.fillRect(blockX, blockY, blockWidth, this.blockHeight);
        this.ctx.beginPath();
        this.ctx.moveTo(
          x1 - constrain(block1Width, 0, 5),
          y1 + this.blockHeight / 2
        ); // blockY + this.blockHeight / 2);
        const halfwayY = y1 + this.blockHeight / 2 + (y2 - y1) / 2;

        /* this.ctx.bezierCurveTo(
          x1 + aThird,
          y1 + this.blockHeight / 2,
          x1 + aThird,
          halfwayY, // this.topOffset + this.state.offsets[block.thread_id],
          x1 + (x2 - x1) / 2,
          // this.topOffset + this.state.offsets[block.thread_id],
          halfwayY
        );
        this.ctx.bezierCurveTo(
          x2 - aThird,
          halfwayY, // this.topOffset + this.state.offsets[block.thread_id],
          x2 - aThird,
          y2 + this.blockHeight / 2,
          x2 + constrain(block2Width, 0, 5),
          y2 + this.blockHeight / 2
        ); */

        this.ctx.bezierCurveTo(
          x1 + aThird,
          y1 + this.blockHeight / 2,
          x2 - aThird,
          y2 + this.blockHeight / 2,
          x2 + constrain(block2Width, 0, 5),
          y2 + this.blockHeight / 2
        );
        this.ctx.stroke();
      });
    });
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

  drawBlock(block, activity) {
    const collapsed = this.threadCollapsed(activity.thread_id);

    const { startTime, endTime, level } = block;
    const { blockX, blockY, blockWidth } = this.getBlockTransform(
      startTime,
      endTime,
      collapsed ? -1 : level,
      this.blockHeight,
      (collapsed ? 1 : 0) +
        this.topOffset +
        this.state.offsets[activity.thread_id] +
        FlameChart.threadHeaderHeight
    );

    // don't draw bar if whole thing is this.left of view
    if (blockX + blockWidth < 0) {
      return;
    }

    // don't draw bar if whole thing is this.right of view
    if (blockX > this.state.canvasWidth) {
      return;
    }

    this.ctx.globalAlpha = collapsed ? 0.4 : 1;
    this.ctx.fillStyle = colors.flames.main;

    /** 💁 sometimes the categories array contains null or undefined... probably shouldn't but 🤷‍ */
    if (activity.categories.length > 0 && activity.categories[0]) {
      // ⚠️ don't always just show the color belonging to category 0... need a better way
      const cat = this.props.categories.find(element => element.id === activity.categories[0]);
      if (cat) {
        this.ctx.fillStyle = cat.color_background;
      }
    }

    const adjustedBlockHeight =
      this.blockHeight /
      (this.props.uniformBlockHeight
        ? this.maxThreadLevels
        : this.props.threadLevels[activity.thread_id].max);
    this.ctx.fillRect(
      blockX,
      collapsed ? blockY + block.level * adjustedBlockHeight : blockY,
      blockWidth,
      collapsed ? adjustedBlockHeight : this.blockHeight
    );

    // don't even think about drawing text if bar is too small
    if (blockWidth < this.minTextWidth) {
      return;
    }
    const { textWidth } = this.ctx.measureText(activity.name);

    if (textWidth + FlameChart.textPadding.x > blockWidth) {
      return;
    }

    if (collapsed) return;
    // ⚠️ chrome devtools caches the text widths for perf. If I notice that becoming an issue, I will look into doing the same.
    /** ⚠️ Emoji's need fixing in here. */
    const text = trimTextMiddle(
      this.ctx,
      activity.name || "",
      blockWidth - 2 * FlameChart.textPadding.x
    );

    /* ⚠️ this is redundant, we do it up above. need to refactor a little */
    /** 💁 sometimes the categories array contains null or undefined... probably shouldn't but 🤷‍ */
    if (activity.categories.length > 0 && activity.categories[0]) {
      // ⚠️ don't always just show the color belonging to category 0... need a better way
      const cat = this.props.categories.find(element => element.id === activity.categories[0]);
      if (cat) {
        this.ctx.fillStyle = cat.color_text || "#000000";
      }
    } else {
      this.ctx.fillStyle = colors.text;
    }
    this.ctx.fillText(
      text,
      blockX + FlameChart.textPadding.x,
      blockY + FlameChart.textPadding.y
    );

    // visually denote a resumed activity
    if (block.beginning === "R") {
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.moveTo(blockX - 1, blockY);
      const jagDepth = constrain(blockWidth / 5, 2, 5);
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
    if (block.ending === "S") {
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.moveTo(blockX + blockWidth + 1, blockY);
      const jagDepth = constrain(blockWidth / 5, 2, 5);
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

  threadCollapsed(thread_id) {
    const collapsed = this.props.threads[thread_id]?.collapsed;
    return collapsed || false;
  }

  pixelsToThreadPosition(y: number): number {
    const reverseOffsets = pipe(sortBy(identity), reverse)(this.state.offsets);
    let i = 0;
    while (y < reverseOffsets[i]) {
      i++;
    }
    const thread_id = reverse(Object.keys(this.props.threads))[i];
    return Number(thread_id) - 1 || 0;
  }

  pixelsToLevel(y: number): number {
    const reverseOffsets = pipe(sortBy(identity), reverse)(this.state.offsets);
    let i = 0;
    while (y < reverseOffsets[i]) {
      i++;
    }

    const distFromBottomOfThreadHeader =
      y - (reverseOffsets[i] + FlameChart.threadHeaderHeight);

    return Math.floor(distFromBottomOfThreadHeader / (1 + this.blockHeight));
  }

  drawThreadHeaders(ctx) {
    ctx.globalAlpha = 1;
    Object.entries(this.props.threads).forEach(([thread_id, thread]) => {
      thread_id = Number(thread_id);
      const regex = emojiRegex();
      let match;

      /* eslint-disable */
      /* 🤔 🤯 HOW THE HELL IS CANVAS SO DARN FAST? */
      /* 🔮 memoize this/cache these results. Which is the term I am looking for? I think memoize, but caching makes some sense also. Caching isn't straight wrong. */
      let emoji = [];
      while ((match = regex.exec(thread.name))) {
        emoji.push(match[0]);
      }

      ctx.globalAlpha = 0.75;
      ctx.fillStyle = 'white';
      const { width, height } = ctx.measureText(thread.name);
      ctx.fillRect(
        0,
        this.state.offsets[thread_id],
        width + 25,
        this.blockHeight
      );

      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 1;
      ctx.font = 'bold 18px sans-serif';

      ctx.fillText(
        emoji.toString(),
        FlameChart.textPadding.x - 2,
        this.state.offsets[thread_id] + FlameChart.textPadding.y + 3
      );

      /* eslint-enable */
      ctx.font = "bold 11px sans-serif";

      ctx.fillText(
        thread.name,
        FlameChart.textPadding.x + 20,
        this.state.offsets[thread_id] + FlameChart.textPadding.y
      );

      ctx.measureText(thread.name);

      ctx.save();

      if (this.props.currentAttention === thread_id) {
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(
          this.state.canvasWidth - 7.5,
          this.state.offsets[thread_id] + 10,
          2,
          0,
          360
        );
        ctx.fill();
      }
      ctx.fillStyle =
        this.state.hoverThreadEllipsis === thread_id ? "#000000" : "#dddddd";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(
          this.state.canvasWidth - 30 + 6 * i,
          this.state.offsets[thread_id] + 10,
          2,
          0,
          360
        );
        ctx.fill();
      }
      ctx.restore();
    });
  }

  /* 💁 ⚠️ Not as in "The explosion outside drew my attention". */
  drawAttention(ctx) {
    this.props.attentionShifts.forEach(({ thread_id, timestamp }, ind) => {
      const y = this.state.offsets[thread_id];
      const x = this.timeToPixels(timestamp);

      const x2 =
        ind < this.props.attentionShifts.length - 1
          ? this.timeToPixels(this.props.attentionShifts[ind + 1].timestamp)
          : this.timeToPixels(this.props.rightBoundaryTime);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y);
      ctx.moveTo(x2, y);

      /* ⚠️  bad code ahead */
      const x3 = this.timeToPixels(ind < this.props.attentionShifts.length - 2
        ? this.props.attentionShifts[ind + 2].timestamp
        : x2);

      const width = Math.min(10, Math.min(Math.abs(x2 - x), Math.abs(x3 - x2)));

      if (this.props.showAttentionFlows) {
        // ctx.globalAlpha = 0.2;
        // ctx.globalCompositeOperation = 'difference';
        if (ind < this.props.attentionShifts.length - 1) {
          this.drawAttentionFlow(
            ctx,
            x2,
            y,
            this.state.offsets[this.props.attentionShifts[ind + 1].thread_id],
            width
          );
        }
        // debugger;
      }

      ctx.strokeStyle = "red"; // 'mediumseagreen';
      ctx.stroke();
    });
  }

  drawAttentionFlow(ctx, x, y1, y2, width) {
    const midpoint = (a, b) => (a + b) / 2;

    const startVertex = [x, y1];
    const middleVertex = [x, midpoint(y1, y2)]; // midpoint(y1, y2)];
    const endVertex = [x, y2];

    const add = (arr1, arr2) => zipWith((a, b) => a + b, arr1, arr2);
    ctx.bezierCurveTo(
      ...add(startVertex, [width, 0]),
      // ...add(middleVertex, [20, 0]),
      ...middleVertex,
      ...middleVertex
    );
    // ctx.bezierCurveTo(...startVertex, ...startVertex, ...middleVertex);

    // const controlPoint1 = add(middleVertex, [2, 0]);
    ctx.bezierCurveTo(
      ...middleVertex,

      // ...add(middleVertex, [-20, 0]),
      ...add(endVertex, [-width, 0]),
      ...endVertex
    );
  }

  // ⚠️ TODO vertical grid
  drawGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = "#e7e7e7";
    ctx.fillStyle = "#e7e7e7";

    ctx.beginPath();
    Object.values(this.state.offsets).forEach((threadOffset, ind) => {
      if (ind > 0) {
        this.hLine(ctx, threadOffset - 2);
      }
    });
    ctx.stroke();

    // ctx.moveTo(100, 100);
    // 60 to 160
    const spacing =
      60 +
      (0.0001 * (this.props.rightBoundaryTime - this.props.leftBoundaryTime)) %
        100;
    for (let x = spacing; x < this.state.canvasWidth; x += spacing) {
      const time = this.pixelsToTime(x);
      if (time < Date.now()) {
        ctx.fillText(
          shortEnglishHumanizer(Date.now() - time),
          x + FlameChart.textPadding.x,
          11
        );
        this.vLine(ctx, x);
      }
    }

    ctx.restore();
  }

  drawMeasurementWindow(ctx, measurement) {
    const { left, right } = mapValues(
      val => this.timeToPixels(val),
      measurement
    );
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#377C9C";
    ctx.fillStyle = "#377C9C";
    if (left && (right === null || typeof right === "undefined")) {
      this.vLine(ctx, left);
    } else if (left && right) {
      ctx.globalAlpha = 0.2;
      ctx.fillRect(left, 0, right - left, this.state.canvasHeight);
      ctx.globalAlpha = 1;

      this.vLine(ctx, left);
      this.vLine(ctx, right);

      const txt = shortEnglishHumanizer(measurement.right - measurement.left);
      const txtWidth = ctx.measureText(txt).width;
      const txtX =
        right - left > txtWidth ? left + (right - left - txtWidth) / 2 : left;
      this.ctx.fillStyle = colors.text;
      ctx.fillText(
        txt,
        txtX,
        this.state.canvasHeight - (FlameChart.textPadding.y - 11)
      );
    }
    ctx.restore();
  }

  hLine(ctx, y) {
    ctx.moveTo(0, y);
    ctx.lineTo(this.state.canvasWidth * this.state.devicePixelRatio, y);
  }

  vLine(ctx, x, length = this.state.canvasHeight) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, length);
    ctx.stroke();
  }

  timeToPixels(timestamp) {
    return timeToPixels(
      timestamp,
      this.props.leftBoundaryTime,
      this.props.rightBoundaryTime,
      this.state.canvasWidth
    );
  }

  pixelsToTime(x) {
    return pixelsToTime(
      x,
      this.props.leftBoundaryTime,
      this.props.rightBoundaryTime,
      this.state.canvasWidth
    );
  }
}

export default // flow-ignore
connect(
  state => ({
    focusedBlockIndex: getTimeline(state).focusedBlockIndex,
    hoveredBlockIndex: getTimeline(state).hoveredBlockIndex
  }),
  dispatch => ({
    focusBlock: ({
      index, activity_id, activityStatus, thread_id
    }) =>
      dispatch(focusBlock({
        index,
        activity_id,
        activityStatus,
        thread_id
      })),
    hoverBlock: index => dispatch(hoverBlock(index))
  })
)(FlameChart);