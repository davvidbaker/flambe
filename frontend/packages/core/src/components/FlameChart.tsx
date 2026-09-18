import React, { Component, type MouseEvent } from 'react';
import { connect, type ConnectedProps } from 'react-redux';
import emojiRegex from 'emoji-regex';
import styled from 'styled-components';
/* 💁     👇 intentionally "maxx"  */
import Measure, { type Bounds } from './Measure';
import { shade } from 'polished';

import {
  drawFutureWindow,
  getBlockTransform,
  getBlockY,
  isVisible,
  pixelsToTime,
  sortThreadsByRank,
  timeToPixels,
  visibleThreadLevels,
} from '../utilities/timelineGeometry';
import { clampTopOffset } from '../utilities/pan';
import { getShamefulColor } from '../utilities/timeline';
import {
  actorAccentColor,
  blockLayoutKey,
  coalesceActorLaneChrome,
  fitActorLaneLabel,
  projectActorLaneLayout,
  selectActorFlameSegments,
  type ActorLaneLayout,
} from '../utilities/actorFlames';

/* 🔮  abstract into parts of react-flame-chart? */

import {
  constrain,
  trimTextMiddle,
  deepArrayIsEqual,
  formatTimelineTickLabel,
  shortEnglishHumanizer,
} from '../utilities';
import {
  isCoarsePointer,
  isHoverNone,
  isNarrowViewport,
  shouldOpenActivityDetailsOnSelect,
} from '../utilities/activityDetailGesture';
import { showActivityDetails } from '../actions';
import { colors, timelineActivityCanvasFont } from '../styles';
import type { RootState } from '../rootReducer';
import type { EntityId } from '../types/ids';
import type { Category } from '../types/Category';
import type { Thread } from '../types/Thread';
import type { AttentionShift } from '../reducers/user';
import type { ProcessedActivity, ThreadLevel, TraceBlock } from '../utilities/processTrace';
import type { FlameBlockDetails } from '../types/FlameChartHandle';

const Wrapper = styled.div`
  height: 100%;
  position: absolute;
  width: 100%;

  canvas:last-of-type {
    position: absolute;
  }
`;

function activityByBlockIndex(blocks: TraceBlock[], index?: number | null): EntityId | null {
  if (index === null || index === undefined) return null;
  if (!blocks[Number(index)]) return null;
  return blocks[Number(index)].activity_id;
}

interface ChartThread extends Thread { suspendedActivityCount?: number }
interface DividerData {
  offsets: Array<{ position: number; time?: number }>;
  gridSliceTime?: number;
}
interface Measurement { left: number | null; right: number | null }
type BlockEntry = [string, TraceBlock];
type ResizeDirection = 'left' | 'right';
type Hit =
  | { type: 'thread_ellipsis' | 'thread_header'; value: number }
  | { type: 'block' | 'block_edge_left' | 'block_edge_right'; value: BlockEntry };

interface OwnProps {
  activities: Record<string, ProcessedActivity>;
  attentionShifts: AttentionShift[];
  blocks: TraceBlock[];
  categories: Category[];
  currentAttention: EntityId | null;
  focusBlock: (input: { index: number | null; activity_id: EntityId | null; activityStatus?: string | null; thread_id: EntityId | null }) => unknown;
  focusedBlockIndex?: number | null;
  hoverBlock: (index: number | string | null) => unknown;
  hoveredBlockIndex?: number | null;
  modifiers: { shift: boolean };
  pan?: (...args: any[]) => unknown;
  showThreadDetail: (id: EntityId) => unknown;
  threadLevels: Record<string, ThreadLevel>;
  threads: Record<string, ChartThread>;
  toggleThread: (id: EntityId, isCollapsed?: boolean) => unknown;
  topOffset?: number;
  updateEvent: (id: EntityId, updates: Record<string, unknown>) => unknown;
  zoom?: (...args: any[]) => unknown;
}

const connector = connect((state: RootState) => ({
  absoluteTimeLabels: state.settings.absoluteTimeLabels,
  twelveHourClock: state.settings.twelveHourClock,
  activityMute: state.settings.activityMute,
  activityMuteOpacity: state.settings.activityMuteOpacity,
  uniformBlockHeight: state.settings.uniformBlockHeight,
  darkerAsWeGoDown: state.settings.darkerAsWeGoDown,
  rightAlignTimelineText: state.settings.rightAlignTimelineText,
  reactiveThreadHeight: state.settings.reactiveThreadHeight,
  showActivityIds: state.settings.showActivityIds,
  showAttentionFlows: state.settings.attentionFlows,
  showSuspendResumeFlows: state.settings.suspendResumeFlows,
  showSuspendResumeFlowsOnlyForFocusedActivity:
    state.settings.suspendResumeFlowsOnlyForFocusedActivity,
}), {
  showActivityDetails,
}, null, { forwardRef: true });

type Props = OwnProps & ConnectedProps<typeof connector>;
interface State { canvasHeight: number }

export class FlameChart extends Component<Props, State> {
  ctx!: CanvasRenderingContext2D;
  canvas!: HTMLCanvasElement;
  tooltip: HTMLElement | null = null;
  minTextWidth = 0;

  static textPadding = { x: 5, y: 13.5 };

  static foldedThreadHeight = 100;

  static threadHeaderHeight = 20;

  /** Fixed gutter left of a flame's first block for rail + agent label. See ADR-005. */
  static actorLaneGutter = 18;

  /** Extra inset per nesting depth so delegated lanes tuck under parents. */
  static actorLaneDepthInset = 6;

  /** Vertical inset for nested lane chrome so it doesn't sit flush on the parent row. */
  static actorLaneNestedPad = 2;

  state = {
    canvasHeight: 150,
  };

  blockHeight = 20; // px

  cursor = {
    x: 0,
    y: 0,
  };

  draggingThread: number | null = null;

  hoverThreadEllipsis: number | null = null;

  mousedown = false;

  mousedownX: number | null = null;

  measuring = false;

  measurement: Measurement = {
    left: null,
    right: null,
  };

  offsets: Record<string, number> = {};

  otherThreadCaptures: Array<{ id: number; capture: ImageData }> = [];

  resizing: ResizeDirection | false = false;

  resizingBlock: BlockEntry | null = null;

  requestedTopOffset = 0;
  appliedTopOffset = 0;
  maxTopOffset = 0;
  contentHeight = 0;

  width = 300;
  leftBoundaryTime = Date.now();
  rightBoundaryTime = Date.now() + 1000;
  dividersData: DividerData = { offsets: [] };
  threadLevels: Record<string, ThreadLevel> = {};
  threadsSortedByRank: Array<[number, ChartThread]> = [];
  maxThreadLevels = 0;
  threadStatuses: Record<string, unknown> = {};
  canvasCapture: ImageData | null = null;
  threadCapture: ImageData | null = null;
  hoverActivity_id: EntityId | null = null;
  focusActivity_id: EntityId | null = null;
  actorLaneLayout: ActorLaneLayout | null = null;

  constructor(props: Props) {
    super(props);

    this.threadStatuses = {};
    Object.values(props.threads).forEach(({ id }) => {
      this.threadStatuses[id] = {
        status: 'ok',
        suspendedActivity: { startTime: null, endTime: null },
      };
    });

  }

  componentDidMount() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;

    this.setCanvasSize({ width: 300, height: 150 });
  }

  shouldComponentUpdate(_nextProps: Props, _nextState: State): boolean {
    return false;
  }

  // avoiding react state for some stuff
  setFlamechartState = (state: Record<string, unknown>): void => {
    Object.entries(state).forEach(([key, val]) => {
      (this as unknown as Record<string, unknown>)[key] = val;
    });
  };

  setOffsets = (
    threads: Record<string, ChartThread>,
    threadLevels: Record<string, ThreadLevel>,
  ): Record<string, number> => {
    if (
      threads
      && threadLevels
      && Object.keys(threads).length === Object.keys(threadLevels).length
    ) {
      const offsets: Record<string, number> = {};

      this.threadsSortedByRank = sortThreadsByRank(threads) || [];

      let contentHeight = 0;
      this.threadsSortedByRank.reduce((acc, [thread_id, thread], ind) => {
        const spacer = ind > 0 ? 4 : 0;
        offsets[thread_id] = acc + spacer; // FlameChart.foldedThreadHeight;
        const max = (threadLevels[thread_id] && threadLevels[thread_id].max) || 0;
        const add = thread.collapsed
          ? FlameChart.threadHeaderHeight
          : (this.blockHeight + 1) * max + FlameChart.threadHeaderHeight;
        const next = acc + add + spacer;
        contentHeight = next;
        return next;
      }, 0);

      this.contentHeight = contentHeight;
      this.maxTopOffset = Math.max(0, contentHeight - (this.state.canvasHeight || 0));
      this.appliedTopOffset = clampTopOffset(this.requestedTopOffset, this.maxTopOffset);
      if (this.appliedTopOffset === 0) return offsets;
      return Object.fromEntries(
        Object.entries(offsets).map(([id, y]) => [id, y - this.appliedTopOffset]),
      );
    }
    this.contentHeight = 0;
    this.maxTopOffset = 0;
    this.appliedTopOffset = 0;
    return {};
  };

  setCanvasSize = ({ width, height }: Pick<Bounds, 'width' | 'height'>): void => {
    this.width = width;
    const pixelRatio = window.devicePixelRatio || 1;
    if (this.canvas) {
      this.canvas.width = Math.round(width * pixelRatio);
      this.canvas.height = Math.round(height * pixelRatio);
    }
    this.setState({
      canvasHeight: height,
    });
    if (this.canvas && this.ctx) {
      this.minTextWidth = FlameChart.textPadding.x + this.ctx.measureText('\u2026').width;
    }
    if (
      this.ctx
      && this.dividersData
      && Number.isFinite(this.leftBoundaryTime)
      && Number.isFinite(this.rightBoundaryTime)
      && this.width > 0
    ) {
      this.draw(this.leftBoundaryTime, this.rightBoundaryTime, this.width, this.dividersData);
    }
  };

  hitTest = (event: MouseEvent<HTMLCanvasElement>): Hit | null => {
    const mouseX = event.nativeEvent.offsetX;
    const mouseY = event.nativeEvent.offsetY;
    // A user can click as soon as the trace request updates props, before the
    // next animation-frame draw has rebuilt the canvas geometry. Recreate the
    // header offsets here so the hit test always agrees with the current data.
    this.ensureActorLaneLayout();
    const threadIds = Object.keys(this.props.threads || {});
    const hasLevelForEveryThread = (levels: Record<string, ThreadLevel>) =>
      Object.keys(levels || {}).length === threadIds.length;
    const currentThreadLevels = hasLevelForEveryThread(this.threadLevels)
      ? this.threadLevels
      : hasLevelForEveryThread(this.props.threadLevels)
        ? this.threadLevelsFromLayout(this.props.threadLevels)
        : this.threadLevelsFromLayout(
          threadIds.reduce<Record<string, ThreadLevel>>(
            (levels, threadId) => ({ ...levels, [threadId]: { current: 0, max: 0 } }),
            {},
          ),
        );
    this.threadLevels = currentThreadLevels;
    this.offsets = this.setOffsets(this.props.threads, currentThreadLevels);
    const ts = this.pixelsToTime(mouseX);
    const hitThread_id = this.pixelsToThreadId(mouseY);
    const hitThreadOffset = hitThread_id === null
      ? null
      : this.offsets[hitThread_id];
    const hitThreadHeader = hitThreadOffset !== null
      && mouseY >= hitThreadOffset
      && mouseY < hitThreadOffset + FlameChart.threadHeaderHeight;

    const hitLevel = this.pixelsToLevel(mouseY);

    if (hitThreadHeader) {
      // The rendered dots are centered at width - 30, -24, and -18 with a
      // two-pixel radius. Keep the click target around that group instead of
      // treating the whole right side of the header as the ellipsis.
      const ellipsisLeft = this.width - 34;
      const ellipsisRight = this.width - 14;
      if (mouseX >= ellipsisLeft && mouseX <= ellipsisRight) {
        return { type: 'thread_ellipsis', value: hitThread_id as number };
      }
      return { type: 'thread_header', value: hitThread_id as number };
    }

    const hitBlocks = this.props.blocks
      .map((block, index): BlockEntry => [String(index), block])
      .filter(([, block]) => ts > block.startTime
        && (block.endTime === undefined || ts < block.endTime))
      .filter(([, block]) => this.displayRowForBlock(block) === hitLevel)
      .filter(([, block]) =>
        this.props.activities[String(block.activity_id)]?.thread_id === hitThread_id);

    if (hitBlocks.length === 0) {
      return null;
    }
    if (hitBlocks.length !== 1) {
      console.error('multiple hits! something is wrong!', hitBlocks);
    }

    const hitBlock = hitBlocks[0];

    if (mouseX > 10 && mouseX < this.width - 10) {
      const startX = this.timeToPixels(hitBlock[1].startTime);
      const endX = hitBlock[1].endTime && this.timeToPixels(hitBlock[1].endTime);

      /* 💁 don't resize if block is too small */
      if (!endX || endX - startX > 20) {
        if (mouseX - startX < 10) {
          return { type: 'block_edge_left', value: hitBlock };
        }
        if (endX && endX - mouseX < 10) {
          return {
            type: 'block_edge_right',
            value: hitBlock,
          };
        }
      }
    }

    const activity = this.props.activities[String(hitBlock[1].activity_id)];
    if (!activity) return null;
    return { type: 'block', value: hitBlock };
  };

  onContextMenu = (e: MouseEvent<HTMLCanvasElement>): void => {
    e.preventDefault();
  };

  onClick = (e: MouseEvent<HTMLCanvasElement>): void => {
    const hit = this.hitTest(e);

    if (hit) {
      switch (hit.type) {
        case 'thread_ellipsis':
          this.props.showThreadDetail(hit.value);
          break;
        case 'thread_header':
          // The canvas can briefly represent a previous set of threads while
          // Redux applies a trace update. Ignore that stale hit rather than
          // dereferencing a missing thread and crashing the app.
          const thread = this.props.threads[hit.value];
          if (thread) {
            this.props.toggleThread(hit.value, thread.collapsed);
          }
          break;
          /** 💁 hit.value is array like [key, val] */

        case 'block':
        case 'block_edge_left':
        case 'block_edge_right': {
          // Click (not drag) on an edge still selects / opens details. Resize is
          // started from mousedown+drag; on mobile a short open block is often
          // entirely inside the 10px edge threshold in a wide viewport.
          const blockIndex = Number(hit.value[0]);
          const block = this.props.blocks[blockIndex];
          const activity = this.props.activities[String(block.activity_id)];
          const focusedActivityId = activityByBlockIndex(
            this.props.blocks,
            this.props.focusedBlockIndex,
          );
          const alreadyFocusedSameActivity = focusedActivityId !== null
            && String(focusedActivityId) === String(block.activity_id);
          this.props.focusBlock({
            index: blockIndex,
            activity_id: block.activity_id,
            activityStatus: activity.status,
            thread_id: activity.thread_id ?? null,
          });
          if (shouldOpenActivityDetailsOnSelect({
            alreadyFocusedSameActivity,
            coarsePointer: isCoarsePointer(),
            narrowViewport: isNarrowViewport(),
            hoverNone: isHoverNone(),
          })) {
            this.props.showActivityDetails();
          }
          break;
        }

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

  onMouseMove = (e: MouseEvent<HTMLCanvasElement>): void => {
    this.setFlamechartState({
      cursor: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY },
    });

    if (this.resizing) {
      requestAnimationFrame(() => this.draw(
        this.leftBoundaryTime,
        this.rightBoundaryTime,
        this.width,
        this.dividersData,
      ));
    } else {
      const hit = this.hitTest(e);
      if (hit) {
        switch (hit.type) {
          case 'thread_ellipsis':
            this.canvas.style.cursor = 'pointer';
            this.props.hoverBlock(null);
            this.setFlamechartState({
              hoverThreadEllipsis: hit.value,
            });
            break;
          case 'thread_header':
            this.canvas.style.cursor = 'pointer';
            this.props.hoverBlock(null);
            this.setFlamechartState({
              hoverThreadEllipsis: null,
            });
            break;
          /** 💁 hit.value is array like [key, val] */
          case 'block':
            this.props.hoverBlock(hit.value[0]);
            this.canvas.style.cursor = 'default';
            this.setFlamechartState({
              hoverThreadEllipsis: null,
            });
            break;
          case 'block_edge_left':
            this.props.hoverBlock(null);
            this.canvas.style.cursor = 'w-resize';
            this.setFlamechartState({
              hoverThreadEllipsis: null,
            });
            break;
          case 'block_edge_right':
            this.props.hoverBlock(null);
            this.canvas.style.cursor = 'e-resize';
            this.setFlamechartState({
              hoverThreadEllipsis: null,
            });
            break;

          default:
            this.canvas.style.cursor = 'default';
            this.setFlamechartState({
              hoverThreadEllipsis: null,
            });
            break;
        }
      } else {
        this.props.hoverBlock(null);
        this.canvas.style.cursor = 'default';

        if (this.hoverThreadEllipsis) {
          this.setFlamechartState({
            hoverThreadEllipsis: null,
          });
        }
      }
    }

    if (this.measuring) {
      const eTimeX = this.pixelsToTime(e.nativeEvent.offsetX);
      if (this.mousedown && this.mousedownX !== null) {
        if (eTimeX < this.mousedownX) {
          this.setFlamechartState({
            measurement: {
              left: eTimeX,
              right: this.mousedownX,
            },
          });
        } else {
          this.setFlamechartState({
            measurement: {
              left: this.mousedownX,
              right: eTimeX,
            },
          });
        }
      } else {
        this.setFlamechartState({ measurement: { left: eTimeX, right: null } });
      }
    } else {
      this.setFlamechartState({ measurement: { left: null, right: null } });
    }
  };

  getBlockDetails = (blockIndex: number): FlameBlockDetails | false | undefined => {
    if (blockIndex !== null && blockIndex !== undefined) {
      const block = this.props.blocks[blockIndex];
      if (!block) return false;
      const activity = this.props.activities[String(block.activity_id)];
      if (!activity || activity.thread_id === undefined) return false;

      if (this.threadCollapsed(activity.thread_id)) {
        return false;
      }

      // Use display-row geometry (same as draw/hitTest), not block.level —
      // actor-lane packing remaps Y independently of nesting depth.
      this.ensureActorLaneLayout();
      const { blockX, blockY, blockWidth } = this.getRenderedBlockTransform(
        block,
        activity,
      );

      const { startMessage, endMessage, ending } = block;

      // ⚠️ ahead rough draft
      const activityBlocks = this.props.blocks.filter(
        b => block.activity_id === b.activity_id,
      );

      const otherActivityBlocks = this.props.blocks.filter(
        (b, index) => block.activity_id === b.activity_id && Number(blockIndex) !== index,
      );

      const otherMessages = otherActivityBlocks.map(
        ({ startMessage, endMessage }) => ({ startMessage, endMessage }),
      );

      return {
        blockWidth,
        blockX,
        blockY,
        startMessage,
        ending,
        endMessage,
        otherMessages,
      };
    }
  };

  onMouseDown = (e: MouseEvent<HTMLCanvasElement>): void => {
    // e.preventDefault();
    const eTimeX = this.pixelsToTime(e.nativeEvent.offsetX);
    this.setFlamechartState({ mousedown: true, mousedownX: eTimeX });
    if (this.props.modifiers.shift) {
      this.setFlamechartState({
        measuring: true,
        measurement: {
          left: eTimeX,
          right: eTimeX,
        },
      });
    } else {
      const hit = this.hitTest(e);
      if (hit) {
        if (hit.type === 'block_edge_left' || hit.type === 'block_edge_right') {
          this.setFlamechartState({
            resizing: hit.type === 'block_edge_left' ? 'left' : 'right',
            resizingBlock: hit.value,
          });
          this.canvasCapture = this.captureCanvas();
        } else if (hit.type === 'thread_header') {
          /* 💁  hit.value is the thread id */
          /*
          const thread_id = hit.value;
          this.setState({ draggingThread: thread_id });
          this.canvasCapture = this.captureCanvas();
          this.otherThreadCaptures = pipe(
            map(({ id }) => id),
            filter(id => id !== thread_id),
            map(id => ({ id, capture: this.captureThread(id) }))
          )(this.props.threads);
          this.threadCapture = this.captureThread(thread_id);
          */
        }
      }
    }
  };

  onMouseUp = () => {
    if (this.resizing && this.resizingBlock) {
      /* ⚠️ should do like an adjust activity thing that updates redux blocks */
      this.props.updateEvent(
        this.resizingBlock[1].events[this.resizing === 'left' ? 0 : 1],
        {
          timestamp_integer: Math.floor(this.pixelsToTime(this.cursor.x)),
        },
      );
    } else if (this.draggingThread) {
      // this.props.updateThreadRank()
    }
    this.setFlamechartState({
      mousedown: false,
      mousedownX: null,
      draggingThread: null,
      resizing: false,
      resizingBlock: null,
      measuring: false,
    });
  };

  render() {
    // debugger;
    const maxThreadLevels = Object.values(this.threadLevels || {}).map(({ max }) => max);
    this.maxThreadLevels = maxThreadLevels.length > 0
      ? Math.max(...maxThreadLevels)
      : 0;

    /* ⚠️ this is definitely not what I want to be doing */
    // debounce(() =>
    // requestIdleCallback(() => {
    // requestAnimationFrame(this.draw.bind(this));
    // }),
    // );

    // flow-ignore
    return (
      <Wrapper id="chart-wrapper">
        <Measure
          bounds
          onResize={contentRect => {
            /* 🤔 I feel like this shouldn't be necessary, but otherwise I get stuck in a render loop.bind.. */
            if (
              contentRect.bounds.width !== this.width
              || contentRect.bounds.height !== this.state.canvasHeight
            ) {
              this.setCanvasSize(contentRect.bounds);
            }
          }}
        >
          {({ measureRef }) => (
            <canvas
              ref={canvas => {
                measureRef(canvas);
                if (canvas) this.canvas = canvas;
              }}
              onClick={this.onClick}
              onContextMenu={this.onContextMenu}
              onMouseMove={this.onMouseMove}
              onMouseDown={this.onMouseDown}
              onMouseUp={this.onMouseUp}
              style={{
                width: '100%',
                height: '100%',
                touchAction: 'none',
              }}
              height={this.state.canvasHeight * window.devicePixelRatio || 300}
              width={this.width * window.devicePixelRatio || 450}
            />
          )}
        </Measure>
      </Wrapper>
    );
  }

  captureThread(id: number): ImageData {
    const y = this.offsets[id];

    return this.ctx.getImageData(
      0,
      this.offsets[id] * window.devicePixelRatio,
      this.width * window.devicePixelRatio,
      /* ⚠️ wrong */
      ((this.offsets[id + 1] || this.state.canvasHeight) - y)
        * window.devicePixelRatio,
    );
  }

  calcTooltipOffset(tooltip: HTMLElement): { x: number; y: number } {
    /** borrowed directly from ChromeDevTools */
    if (tooltip) {
      const tooltipWidth = tooltip.clientWidth;
      const tooltipHeight = tooltip.clientHeight;

      const parentWidth = tooltip.parentElement?.clientWidth ?? this.width;
      const parentHeight = tooltip.parentElement?.clientHeight ?? this.state.canvasHeight;

      let x = 0;
      let y = 0;
      for (let quadrant = 0; quadrant < 4; ++quadrant) {
        const dx = quadrant & 2 ? -10 - tooltipWidth : 10;
        const dy = quadrant & 1 ? -6 - tooltipHeight : 6;
        x = constrain(this.cursor.x + dx, 0, parentWidth - tooltipWidth);
        y = constrain(this.cursor.y + dy, 0, parentHeight - tooltipHeight);
        if (
          x >= this.cursor.x
          || this.cursor.x >= x + tooltipWidth
          || y >= this.cursor.y
          || this.cursor.y >= y + tooltipHeight
        ) {
          break;
        }
      }

      return {
        x,
        y,
      };
    }
    return { x: 0, y: 0 };
  }

  captureCanvas() {
    return this.ctx.getImageData(
      0,
      0,
      this.width * window.devicePixelRatio,
      this.state.canvasHeight * window.devicePixelRatio,
    );
  }

  clearCanvas() {
    // clear the canvas
    this.ctx.fillStyle = colors.background;
    // this.ctx.globalAlpha = 0.5;
    this.ctx.fillRect(0, 0, this.width, this.state.canvasHeight);
  }

  draw(
    leftBoundaryTime: number,
    rightBoundaryTime: number,
    width: number,
    dividersData: DividerData,
    topOffset: number = this.requestedTopOffset,
  ): void {
    /* ⚠️ IDK if this is a bad idea, but this is the only place I will ever set these values */
    this.leftBoundaryTime = leftBoundaryTime;
    this.rightBoundaryTime = rightBoundaryTime;
    this.width = width;
    this.dividersData = dividersData;
    this.requestedTopOffset = Number.isFinite(topOffset) ? Math.max(0, topOffset) : 0;

    const threadLevels = this.props.activities && this.props.reactiveThreadHeight
      ? visibleThreadLevels(
        this.props.blocks,
        this.props.activities,
        this.leftBoundaryTime,
        this.rightBoundaryTime,
        this.props.threads,
      )
      : this.props.threadLevels;

    this.ensureActorLaneLayout();
    // Collapsing a thread changes every following header's position without
    // changing `threadLevels`. Recompute offsets for each draw so hit testing
    // always uses the same geometry that was painted to the canvas.
    this.threadLevels = this.threadLevelsFromLayout(threadLevels);
    this.offsets = this.setOffsets(this.props.threads, this.threadLevels);

    if (this.canvas) {
      this.ctx.save();

      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      this.clearCanvas();
      if (this.resizing && this.resizingBlock) {
        if (this.canvasCapture) {
          this.ctx.putImageData(this.canvasCapture, 0, 0);
          this.ctx.globalAlpha = 0.4;
          this.ctx.fillRect(0, 0, this.width, this.state.canvasHeight);
        }
        this.drawBlock(
          {
            ...this.resizingBlock[1],
            ...(this.resizing === 'left'
              ? { startTime: this.pixelsToTime(this.cursor.x) }
              : { endTime: this.pixelsToTime(this.cursor.x) }),
          },
          this.props.activities[String(this.resizingBlock[1].activity_id)],
        );
      } else if (this.draggingThread !== null) {
        this.drawDraggingThreads();
      } else {
        this.hoverActivity_id = activityByBlockIndex(
          this.props.blocks,
          this.props.hoveredBlockIndex,
        );
        this.focusActivity_id = activityByBlockIndex(
          this.props.blocks,
          this.props.focusedBlockIndex,
        );

        // draw vertical bars
        this.drawGrid(this.ctx, this.dividersData);
        this.drawActorLaneChrome();
        if (this.props.blocks) {
          this.drawBlocks();
        }
        this.drawActorForks();
        this.drawFutureWindow();
        this.drawThreadHeaders(this.ctx);
        this.drawAttention(this.ctx);
        if (this.props.showSuspendResumeFlows) {
          this.drawSuspendResumeFlows(
            this.props.showSuspendResumeFlowsOnlyForFocusedActivity,
          );
        }

        this.drawMeasurementWindow(this.ctx, this.measurement);
      }
      this.ctx.scale(0.5, 0.5);
      this.ctx.restore();
    }
  }

  drawDraggingThreads(): void {
    if (this.draggingThread === null || !this.threadCapture) return;
    this.otherThreadCaptures.forEach(({ id, capture }) => {
      this.ctx.putImageData(
        capture,
        0,
        this.offsets[id] * window.devicePixelRatio,
      );
    });
    this.ctx.fillStyle = '#dadada';
    const y = this.offsets[this.draggingThread];
    this.ctx.fillRect(
      0,
      y,
      this.width * window.devicePixelRatio,
      this.offsets[this.draggingThread + 1] - y,
    );
    this.ctx.putImageData(
      this.threadCapture,
      0,
      this.cursor.y * window.devicePixelRatio,
    );
  }

  drawFutureWindow(): void {
    return drawFutureWindow(
      this.ctx,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      this.width,
      this.state.canvasHeight,
    );
  }

  drawBlocks(): void {
    for (let i = 0; i < this.props.blocks.length; i++) {
      const block = this.props.blocks[i];
      const activity = this.props.activities[String(block.activity_id)];
      this.ctx.font = timelineActivityCanvasFont(!block.endTime);

      if (activity) {
        this.drawBlock(block, activity);
      }
    }
  }

  ensureActorLaneLayout(): ActorLaneLayout {
    // Lay out only agents currently in view: their bands (and the chart height)
    // reflect the visible window and reflow as the user pans or zooms.
    const visibleBlocks = this.props.blocks.filter(block => this.isVisible(block));
    this.actorLaneLayout = projectActorLaneLayout(
      this.props.activities,
      visibleBlocks,
    );
    return this.actorLaneLayout;
  }

  threadLevelsFromLayout(
    base: Record<string, ThreadLevel>,
  ): Record<string, ThreadLevel> {
    const layout = this.actorLaneLayout;
    const threadIds = Object.keys(this.props.threads || {});
    return threadIds.reduce<Record<string, ThreadLevel>>((levels, threadId) => {
      const baseLevel = base[threadId] ?? { current: 0, max: 0 };
      const layoutMax = layout?.maxRowsByThread[threadId] ?? 0;
      levels[threadId] = {
        current: baseLevel.current,
        max: Math.max(layoutMax, baseLevel.max, 1),
      };
      return levels;
    }, {});
  }

  displayRowForActivity(activityId: EntityId): number {
    return this.actorLaneLayout?.rowByActivity[String(activityId)] ?? 0;
  }

  displayRowForBlock(block: TraceBlock): number {
    const layout = this.actorLaneLayout;
    if (!layout) return 0;
    const keyed = layout.rowByBlock[blockLayoutKey(block)];
    if (keyed !== undefined) return keyed;
    return this.displayRowForActivity(block.activity_id);
  }

  nestedPadForActivity(activityId: EntityId): number {
    const layout = this.actorLaneLayout;
    if (!layout) return 0;
    const rootId = layout.rootIdByActivity[String(activityId)];
    if (rootId === null || rootId === undefined) return 0;
    const lane = layout.lanes.find(entry => String(entry.rootActivityId) === String(rootId));
    return lane !== undefined && lane.depth > 0 ? FlameChart.actorLaneNestedPad : 0;
  }

  getRenderedBlockTransform(block: TraceBlock, activity: ProcessedActivity) {
    const collapsed = activity.thread_id !== undefined
      && this.threadCollapsed(activity.thread_id);
    const row = this.displayRowForBlock(block);
    const pad = collapsed ? 0 : this.nestedPadForActivity(activity.id);
    const { blockX, blockY, blockWidth } = this.getBlockTransform(
      block.startTime,
      block.endTime,
      collapsed ? -1 : row,
      this.blockHeight,
      (collapsed ? 1 : 0)
        + (this.offsets[String(activity.thread_id)] ?? 0)
        + FlameChart.threadHeaderHeight
        + pad,
    );
    return {
      blockX,
      blockY,
      blockWidth,
      blockHeight: Math.max(4, this.blockHeight - pad * 2),
    };
  }

  drawActorLaneChrome(): void {
    const layout = this.actorLaneLayout;
    if (!layout) return;

    const chromeBands = coalesceActorLaneChrome(
      layout,
      this.props.blocks,
      this.dividersData.gridSliceTime ?? 0,
    );

    this.ctx.save();
    const gutter = FlameChart.actorLaneGutter;

    chromeBands.forEach(chrome => {
      if (this.threadCollapsed(chrome.threadId)) return;

      const depthInset = chrome.depth * FlameChart.actorLaneDepthInset;
      const threadOffset = this.offsets[String(chrome.threadId)] ?? 0;
      const threadIds = Object.keys(this.offsets).sort(
        (left, right) => (this.offsets[left] ?? 0) - (this.offsets[right] ?? 0),
      );
      const threadIndex = threadIds.findIndex(id => String(id) === String(chrome.threadId));
      const nextOffset = threadIndex >= 0 && threadIds[threadIndex + 1]
        ? (this.offsets[threadIds[threadIndex + 1]!] ?? this.state.canvasHeight)
        : this.state.canvasHeight;
      const rowHeight = this.blockHeight + 1;
      const nestedPad = chrome.depth > 0 ? FlameChart.actorLaneNestedPad : 0;
      const topBleed = nestedPad > 0 ? 0 : 2;
      const accent = actorAccentColor(chrome.actorKey);

      const rects = chrome.washRects.length
        ? chrome.washRects
        : [{
            rowStart: chrome.rowStart,
            rowEnd: chrome.rowEnd,
            startTime: chrome.startTime,
            endTime: chrome.endTime,
          }];

      // Anchor the single rail + label at the agent's earliest wash rectangle.
      const anchor = rects.reduce((best, rect) => (
        rect.startTime < best.startTime
        || (rect.startTime === best.startTime && rect.rowStart < best.rowStart)
          ? rect
          : best
      ), rects[0]!);

      const rowGeometry = (rowStart: number, rowEnd: number) => {
        const rowCount = rowEnd - rowStart + 1;
        const top = threadOffset
          + FlameChart.threadHeaderHeight
          + rowStart * rowHeight
          - topBleed
          + nestedPad;
        const unclampedHeight = Math.max(4, rowCount * rowHeight + topBleed - nestedPad * 2);
        const height = Math.max(0, Math.min(unclampedHeight, nextOffset - top));
        return { rowCount, top, height };
      };

      // Time-clipped wash rectangles: paint only where the agent actually was.
      this.ctx.globalAlpha = 0.16;
      this.ctx.fillStyle = accent;
      rects.forEach(rect => {
        const isAnchor = rect === anchor;
        const rectLeft = this.timeToPixels(rect.startTime) + depthInset;
        const rectRight = this.timeToPixels(
          rect.endTime === null ? this.rightBoundaryTime : rect.endTime,
        );
        // The anchor rectangle extends left under the gutter so the rail sits on it.
        const washLeft = Math.max(isAnchor ? rectLeft - gutter : rectLeft, -2);
        const washRight = Math.min(rectRight, this.width + 2);
        const washWidth = Math.max(0, washRight - washLeft);
        if (washWidth <= 0 || washRight < 0 || washLeft > this.width) return;
        const { top, height } = rowGeometry(rect.rowStart, rect.rowEnd);
        if (height <= 0) return;
        this.ctx.beginPath();
        if (typeof this.ctx.roundRect === 'function') {
          this.ctx.roundRect(washLeft, top, washWidth, height, 3);
        } else {
          this.ctx.rect(washLeft, top, washWidth, height);
        }
        this.ctx.fill();
      });

      // One rail + label per agent, on the anchor rectangle's rows.
      const railX = this.timeToPixels(anchor.startTime) - gutter + depthInset;
      if (railX > this.width) return;
      const { rowCount, top, height } = rowGeometry(anchor.rowStart, anchor.rowEnd);
      if (height <= 0) return;

      this.ctx.globalAlpha = 0.95;
      this.ctx.fillStyle = accent;
      this.ctx.fillRect(railX, top, 3, height);

      const label = chrome.actorName;
      if (!label || height < 8) return;

      const singleRow = rowCount === 1;
      this.ctx.font = singleRow ? 'bold 7px sans-serif' : 'bold 10px sans-serif';
      const maxVertical = Math.max(0, height - (singleRow ? 4 : 10));
      const drawn = fitActorLaneLabel(
        label,
        maxVertical,
        text => this.ctx.measureText(text).width,
      );
      if (!drawn) return;

      this.ctx.save();
      this.ctx.globalAlpha = 0.95;
      this.ctx.fillStyle = accent;
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.translate(railX + gutter / 2 + 1, top + height - (singleRow ? 2 : 5));
      this.ctx.rotate(-Math.PI / 2);
      this.ctx.fillText(drawn, 0, 0);
      this.ctx.restore();
    });

    this.ctx.restore();
  }

  drawActorForks(): void {
    const layout = this.actorLaneLayout;
    if (!layout) return;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.75;

    layout.flames.forEach(flame => {
      const rootActivity = this.props.activities[String(flame.rootActivityId)];
      if (
        !rootActivity
        || rootActivity.thread_id === undefined
        || this.threadCollapsed(rootActivity.thread_id)
      ) {
        return;
      }

      const { parentBlock, rootBlock } = selectActorFlameSegments(
        flame,
        this.props.blocks,
      );
      if (!rootBlock) return;

      const rootTransform = this.getRenderedBlockTransform(rootBlock, rootActivity);
      if (
        rootTransform.blockX > this.width
        || rootTransform.blockX + rootTransform.blockWidth < 0
      ) {
        return;
      }

      const accent = actorAccentColor(flame.actorKey);
      const rootY = rootTransform.blockY + rootTransform.blockHeight / 2;
      this.ctx.strokeStyle = accent;
      this.ctx.fillStyle = accent;

      // Keep connectors/dots on the block edge, past the name gutter.
      const joinX = rootTransform.blockX + 2;

      if (parentBlock && flame.parentActivityId !== null) {
        const parentActivity = this.props.activities[String(flame.parentActivityId)];
        if (
          parentActivity
          && parentActivity.thread_id === rootActivity.thread_id
        ) {
          const parentTransform = this.getRenderedBlockTransform(
            parentBlock,
            parentActivity,
          );
          const parentLeft = parentTransform.blockX;
          const parentRight = parentTransform.blockX + parentTransform.blockWidth;
          const parentX = constrain(joinX, parentLeft, parentRight);
          const parentY = parentTransform.blockY + parentTransform.blockHeight / 2;
          const middleY = parentY + (rootY - parentY) / 2;

          this.ctx.beginPath();
          this.ctx.moveTo(parentX, parentY);
          this.ctx.bezierCurveTo(parentX, middleY, joinX, middleY, joinX, rootY);
          this.ctx.stroke();

          this.ctx.beginPath();
          this.ctx.arc(joinX, rootY, 3, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    });

    this.ctx.restore();
  }

  isVisible(block: TraceBlock): boolean {
    return isVisible(block, this.leftBoundaryTime, this.rightBoundaryTime);
  }

  drawSuspendResumeFlows(onlyForFocusedActivity: boolean): void {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';

    /* ⚠️ terrible code ahead */
    /* ⚠️ not actually filtering blocks on by those within window because couldn't easily think of how to then draw flows to blocks that need to flow back to them... */
    // const onScreenBlocks = filter(this.isVisible.bind(this))(this.props.blocks);
    type FlowBlock = TraceBlock & { thread_id: EntityId; cat?: Category };
    const onScreenBlocksByActivity = this.props.blocks.reduce<Record<string, FlowBlock[]>>(
      (groups, block) => {
        const activity = this.props.activities[String(block.activity_id)];
        if (!activity || activity.thread_id === undefined) return groups;
        const key = String(block.activity_id);
        (groups[key] ??= []).push({
          ...block,
          thread_id: activity.thread_id,
          cat: this.props.categories.find(
            category => String(category.id) === String(activity.categories[0]),
          ),
        });
        return groups;
      },
      {},
    );

    Object.values(onScreenBlocksByActivity)
      .filter(blocks => blocks.length > 1)
      .forEach(arrayOfBlocks => {
      arrayOfBlocks.forEach((block, i) => {
        if (i === 0) return;
        if (
          onlyForFocusedActivity
          && block.activity_id !== this.focusActivity_id
          && block.activity_id !== this.hoverActivity_id
        ) {
          return;
        }

        if (this.threadCollapsed(block.thread_id)) return;
        const prevBlock = arrayOfBlocks[i - 1];
        const block1Width = this.timeToPixels(prevBlock.endTime ?? prevBlock.startTime)
          - this.timeToPixels(prevBlock.startTime);
        const block2Width = this.timeToPixels(block.endTime || Date.now())
          - this.timeToPixels(block.startTime);

        const prevRow = this.displayRowForBlock(arrayOfBlocks[i - 1]);
        const nextRow = this.displayRowForBlock(block);
        const x1 = this.timeToPixels(prevBlock.endTime ?? prevBlock.startTime);
        const y1 = getBlockY(
          prevRow + 1,
          this.blockHeight,
          0,
        )
          + this.offsets[block.thread_id]
          - 1;
        const x2 = this.timeToPixels(block.startTime);
        const y2 = getBlockY(
          nextRow + 1,
          this.blockHeight,
          0,
        )
          + this.offsets[block.thread_id]
          - 1;

        const aThird = (x2 - x1) / 3;

        this.ctx.globalAlpha = block.activity_id === this.hoverActivity_id
          || block.activity_id === this.focusActivity_id
          ? 0.8
          : 0.1;

        this.ctx.strokeStyle = block.cat
          ? block.cat.color_background
          : colors.flames.main;
        // Same-row resume: thick ribbon bridging the gap. Cross-row: a thin
        // connector — a blockHeight stroke would paint a translucent sheet.
        this.ctx.lineWidth = prevRow === nextRow ? this.blockHeight : 2;

        this.ctx.beginPath();
        this.ctx.moveTo(
          x1 - constrain(block1Width, 0, 5),
          y1 + this.blockHeight / 2,
        );
        const halfwayY = y1 + this.blockHeight / 2 + (y2 - y1) / 2;

        this.ctx.bezierCurveTo(
          x1 + aThird,
          y1 + this.blockHeight / 2,
          x2 - aThird,
          y2 + this.blockHeight / 2,
          x2 + constrain(block2Width, 0, 5),
          y2 + this.blockHeight / 2,
        );
        this.ctx.stroke();
      });
    });
    this.ctx.restore();
  }

  getBlockTransform(
    startTime: number,
    endTime: number | undefined,
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

  drawBlock(block: TraceBlock, activity: ProcessedActivity): void {
    if (activity.thread_id === undefined) return;
    const collapsed = this.threadCollapsed(activity.thread_id);

    const { blockX, blockY, blockWidth, blockHeight } = this.getRenderedBlockTransform(
      block,
      activity,
    );

    // don't draw bar if whole thing is this.left of view
    if (blockX + blockWidth < 0) {
      return;
    }

    // don't draw bar if whole thing is this.right of view
    if (blockX > this.width) {
      return;
    }

    const sameActivity = this.focusActivity_id === block.activity_id
      || this.hoverActivity_id === block.activity_id;

    this.ctx.globalAlpha = collapsed
      ? 0.4
      : this.props.activityMute && !sameActivity
        ? 0.1
        : 1;

    this.ctx.fillStyle = colors.flames.main;
    /** 💁 sometimes the categories array contains null or undefined... probably shouldn't but 🤷‍ */
    if (activity.categories.length > 0 && activity.categories[0]) {
      // ⚠️ don't always just show the color belonging to category 0... need a better way
      const cat = this.props.categories.find(
        element => element.id === activity.categories[0],
      );
      if (cat) {
        this.ctx.fillStyle = this.props.darkerAsWeGoDown
          ? shade(0.1 * block.level, cat.color_background)
          : cat.color_background;
      }
    }

    const adjustedBlockHeight = this.blockHeight
      / Math.max(1, this.props.uniformBlockHeight
        ? this.maxThreadLevels
        : (this.threadLevels[String(activity.thread_id)]?.max ?? 1));
    this.ctx.fillRect(
      blockX,
      collapsed ? blockY + this.displayRowForBlock(block) * adjustedBlockHeight : blockY,
      blockWidth,
      collapsed ? adjustedBlockHeight : blockHeight,
    );

    this.ctx.globalAlpha = collapsed
      ? 0.4
      : this.props.activityMute && !sameActivity
        ? 0.1
        : 1;

    // don't even think about drawing text if bar is too small
    if (blockWidth < this.minTextWidth) {
      return;
    }
    const label = this.props.showActivityIds
      ? String(activity.id)
      : (activity.name || '');
    const { width: textWidth } = this.ctx.measureText(label);

    if (textWidth + FlameChart.textPadding.x > blockWidth) {
    }

    if (collapsed) return;
    // ⚠️ chrome devtools caches the text widths for perf. If I notice that becoming an issue, I will look into doing the same.
    /** ⚠️ Emoji's need fixing in here. */
    const text = trimTextMiddle(
      this.ctx,
      label,
      blockWidth - 2 * FlameChart.textPadding.x,
    );

    /* ⚠️ this is redundant, we do it up above. need to refactor a little */
    /** 💁 sometimes the categories array contains null or undefined... probably shouldn't but 🤷‍ */
    if (activity.categories.length > 0 && activity.categories[0]) {
      // ⚠️ don't always just show the color belonging to category 0... need a better way
      const cat = this.props.categories.find(
        element => element.id === activity.categories[0],
      );
      if (cat) {
        this.ctx.fillStyle = cat.color_text || '#000000';
      }
    } else {
      this.ctx.fillStyle = colors.text;
    }
    const textY = blockY + Math.min(FlameChart.textPadding.y, blockHeight - 4);
    if (this.props.rightAlignTimelineText) {
      this.ctx.textAlign = 'right';
      this.ctx.fillText(text, blockX + blockWidth - FlameChart.textPadding.x, textY);
      this.ctx.textAlign = 'left';
    } else {
      this.ctx.fillText(text, blockX + FlameChart.textPadding.x, textY);
    }

    // visually denote a resumed or resurrected activity
    if (block.beginning === 'R' || block.beginning === 'X') {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(blockX - 1, blockY);
      const jagDepth = constrain(blockWidth / 5, 2, 5);
      for (let j = 0; j < 6; j++) {
        this.ctx.lineTo(
          blockX + (j % 2 ? jagDepth : -1),
          blockY + (j * blockHeight) / 6,
        );
      }
      this.ctx.lineTo(blockX - 1, blockY + blockHeight);
      this.ctx.fill();
    }

    // visually denote suspended activity
    if (block.ending === 'S') {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(blockX + blockWidth + 1, blockY);
      const jagDepth = constrain(blockWidth / 5, 2, 5);
      for (let j = 0; j < 6; j++) {
        this.ctx.lineTo(
          blockX + blockWidth - (j % 2 ? jagDepth : -1),
          blockY + (j * blockHeight) / 6,
        );
      }
      this.ctx.lineTo(blockX + blockWidth + 1, blockY + blockHeight);
      this.ctx.fill();
    }
  }

  threadCollapsed(thread_id: EntityId): boolean {
    const collapsed = this.props.threads[thread_id]?.collapsed;
    return collapsed || false;
  }

  pixelsToThreadId(y: number): number | null {
    const sortedThreads = this.threadsSortedByRank || [];

    for (let index = 0; index < sortedThreads.length; index++) {
      const [thread_id] = sortedThreads[index];
      const nextThread = sortedThreads[index + 1];
      const top = this.offsets[thread_id];
      const bottom = nextThread
        ? this.offsets[nextThread[0]]
        : this.state.canvasHeight;

      if (y >= top && y < bottom) return Number(thread_id);
    }

    return null;
  }

  pixelsToLevel(y: number): number {
    const reverseOffsets = Object.values(this.offsets || {})
      .sort((left, right) => right - left);
    let i = 0;
    while (y < reverseOffsets[i]) {
      i++;
    }

    const offset = reverseOffsets[i] ?? 0;
    const distFromBottomOfThreadHeader = y - (offset + FlameChart.threadHeaderHeight);

    return Math.floor(distFromBottomOfThreadHeader / (1 + this.blockHeight));
  }

  drawThreadHeaders(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 1;
    Object.entries(this.props.threads).forEach(([threadKey, thread]) => {
      const thread_id = Number(threadKey);
      const regex = emojiRegex();
      let match;

      /* eslint-disable */
      /* 🤔 🤯 HOW THE HELL IS CANVAS SO DARN FAST? */
      /* 🔮 memoize this/cache these results. Which is the term I am looking for? I think memoize, but caching makes some sense also. Caching isn't straight wrong. */
      const emoji: string[] = [];
      while ((match = regex.exec(thread.name))) {
        emoji.push(match[0]);
      }

      ctx.globalAlpha = 0.75;
      ctx.fillStyle = 'white';
      const { width } = ctx.measureText(thread.name);
      ctx.fillRect(0, this.offsets[thread_id], width + 25, this.blockHeight);

      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 1;
      ctx.font = 'bold 18px sans-serif';

      ctx.fillText(
        emoji.toString(),
        FlameChart.textPadding.x - 2,
        this.offsets[thread_id] + FlameChart.textPadding.y + 3,
      );

      /* eslint-enable */
      ctx.font = 'bold 11px sans-serif';

      ctx.fillText(
        `${thread.name}`,
        FlameChart.textPadding.x + 20,
        this.offsets[thread_id] + FlameChart.textPadding.y,
      );

      ctx.measureText(thread.name);

      ctx.save();

      if (this.props.currentAttention === thread_id) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.width - 7.5, this.offsets[thread_id] + 10, 2, 0, 360);
        ctx.fill();
      }

      ctx.fillStyle = getShamefulColor((thread.suspendedActivityCount ?? 0) * 5);
      if (thread.suspendedActivityCount) {
        ctx.fillText(
          ` (${thread.suspendedActivityCount})`,
          this.width - 60,
          this.offsets[thread_id] + FlameChart.textPadding.y,
        );
      }

      ctx.fillStyle = this.hoverThreadEllipsis === thread_id ? '#000000' : '#dddddd';

      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(
          this.width - 30 + 6 * i,
          this.offsets[thread_id] + 10,
          2,
          0,
          360,
        );
        ctx.fill();
      }
      ctx.restore();
    });
  }

  /* 💁 ⚠️ Not as in "The explosion outside drew my attention". */
  drawAttention(ctx: CanvasRenderingContext2D): void {
    this.props.attentionShifts.forEach(({ thread_id, timestamp }, ind) => {
      const y = this.offsets[thread_id];
      const x = this.timeToPixels(timestamp);

      const x2 = ind < this.props.attentionShifts.length - 1
        ? this.timeToPixels(this.props.attentionShifts[ind + 1].timestamp)
        : this.timeToPixels(this.rightBoundaryTime);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y);
      ctx.moveTo(x2, y);

      /* ⚠️  bad code ahead */
      const x3 = this.timeToPixels(
        ind < this.props.attentionShifts.length - 2
          ? this.props.attentionShifts[ind + 2].timestamp
          : x2,
      );

      const width = Math.min(10, Math.min(Math.abs(x2 - x), Math.abs(x3 - x2)));

      if (this.props.showAttentionFlows) {
        // ctx.globalAlpha = 0.2;
        // ctx.globalCompositeOperation = 'difference';
        if (ind < this.props.attentionShifts.length - 1) {
          this.drawAttentionFlow(
            ctx,
            x2,
            y,
            this.offsets[this.props.attentionShifts[ind + 1].thread_id],
            width,
          );
        }
      }

      ctx.strokeStyle = 'red'; // 'mediumseagreen';
      ctx.stroke();
    });
  }

  drawAttentionFlow(ctx: CanvasRenderingContext2D, x: number, y1: number, y2: number, width: number): void {
    const midpoint = (a: number, b: number): number => (a + b) / 2;

    const startVertex: [number, number] = [x, y1];
    const middleVertex: [number, number] = [x, midpoint(y1, y2)];
    const endVertex: [number, number] = [x, y2];

    const add = (left: [number, number], right: [number, number]): [number, number] =>
      [left[0] + right[0], left[1] + right[1]];
    ctx.bezierCurveTo(
      ...add(startVertex, [width, 0]),
      // ...add(middleVertex, [20, 0]),
      ...middleVertex,
      ...middleVertex,
    );
    // ctx.bezierCurveTo(...startVertex, ...startVertex, ...middleVertex);

    // const controlPoint1 = add(middleVertex, [2, 0]);
    ctx.bezierCurveTo(
      ...middleVertex,

      // ...add(middleVertex, [-20, 0]),
      ...add(endVertex, [-width, 0]),
      ...endVertex,
    );
  }

  drawGrid(ctx: CanvasRenderingContext2D, dividersData: DividerData): void {
    ctx.save();
    ctx.strokeStyle = '#e7e7e7';
    ctx.fillStyle = '#a0a0a0';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';

    const height = Math.floor(ctx.canvas.height / window.devicePixelRatio);
    const visibleSpanMs = this.rightBoundaryTime - this.leftBoundaryTime;
    const labelGap = 8;
    let nextLabelX = -Infinity;
    let previousLabeledTime: number | null = null;

    ctx.translate(0.5, 0.5);
    ctx.beginPath();
    dividersData.offsets.forEach(offsetInfo => {
      const x = offsetInfo.position;
      const time = offsetInfo.time ?? this.pixelsToTime(x);

      ctx.moveTo(offsetInfo.position, 0);
      ctx.lineTo(offsetInfo.position, height);

      if (x < nextLabelX) return;

      const label = formatTimelineTickLabel(time, {
        absolute: this.props.absoluteTimeLabels,
        twelveHour: this.props.twelveHourClock,
        visibleSpanMs,
        previousTimestamp: previousLabeledTime,
      });
      if (!label) return;

      const labelWidth = ctx.measureText(label).width;
      ctx.fillText(label, x + FlameChart.textPadding.x, 11);
      nextLabelX = x + FlameChart.textPadding.x + labelWidth + labelGap;
      previousLabeledTime = time;
    });
    ctx.stroke();

    ctx.beginPath();
    Object.values(this.offsets).forEach((threadOffset, ind) => {
      if (ind > 0) {
        this.hLine(ctx, threadOffset - 2);
      }
    });
    ctx.stroke();

    ctx.restore();
  }

  drawMeasurementWindow(ctx: CanvasRenderingContext2D, measurement: Measurement): void {
    const left = measurement.left === null ? null : this.timeToPixels(measurement.left);
    const right = measurement.right === null ? null : this.timeToPixels(measurement.right);
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

      const txt = shortEnglishHumanizer((measurement.right ?? 0) - (measurement.left ?? 0));
      const txtWidth = ctx.measureText(txt).width;
      const txtX = right - left > txtWidth ? left + (right - left - txtWidth) / 2 : left;
      this.ctx.fillStyle = colors.text;
      ctx.fillText(
        txt,
        txtX,
        this.state.canvasHeight - (FlameChart.textPadding.y - 11),
      );
    }
    ctx.restore();
  }

  hLine(ctx: CanvasRenderingContext2D, y: number): void {
    ctx.moveTo(0, y);
    ctx.lineTo(this.width * window.devicePixelRatio, y);
  }

  vLine(ctx: CanvasRenderingContext2D, x: number, length = this.state.canvasHeight): void {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, length);
    ctx.stroke();
  }

  timeToPixels(timestamp: number): number {
    return timeToPixels(
      timestamp,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      this.width,
    );
  }

  pixelsToTime(x: number): number {
    return pixelsToTime(
      x,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      this.width,
    );
  }
}

export default connector(FlameChart);
