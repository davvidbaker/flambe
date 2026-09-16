import * as React from 'react';
import SplitPane, { SPLIT_PANE_HANDLE_SIZE } from './SplitPane';
import throttle from 'lodash/throttle';
import Measure from './Measure';

import { MAX_TIME_INTO_FUTURE } from '../constants/defaultParameters';
import {
  rankThreadsByAttention,
  timeToPixels,
  pixelsToTime,
} from '../utilities/timelineGeometry';
import zoom from '../utilities/zoom';
import pan from '../utilities/pan';
import { persistCollapsedThreadState } from '../utilities/threadCollapseState';
import { savedRangeIsUsable } from '../utilities/timelineViewport';
import {
  MINUTE, DAY, WEEK, MONTH,
} from '../utilities/time';
import {
  absoluteGridStepMs,
  absoluteGridTimes,
  chooseAbsoluteGridStep,
} from '../utilities/absoluteTimelineGrid';
import {
  loadSuspendedActivityCount,
} from '../utilities/timeline';
import { scheduleIdleCallback } from '../utilities/requestIdleCallback';
import {
  panDeltaFromTouchMove,
  touchDistance,
  touchHasMoved,
  touchMidpoint,
  wheelDeltaFromPinchScale,
  type TouchPoint,
} from '../utilities/timelineTouch';
import type { Command } from '../constants/commands';
import type { EntityId } from '../types/ids';
import type { Category } from '../types/Category';
import type { Thread } from '../types/Thread';
import type { ModifiersState } from '../reducers/modifiers';
import type { AttentionShift, Mantra, Observation, SearchTerm, TabCount } from '../reducers/user';
import type { ProcessedActivity, ThreadLevel, TraceBlock } from '../utilities/processTrace';

import WithEventListeners from './WithEventListeners';
import ThreadDetail from './ThreadDetail';
import ActivityDetailModal from './ActivityDetailModal';
import TimeSeries from './TimeSeries';
import FlameChart, { FlameChart as FlameChartComponent } from './FlameChart';
import Tooltip from './Tooltip';
import FocusedBlock from './FocusedBlock';


const MIN_GRID_SLICE_PX = 60;
const ABSOLUTE_MIN_GRID_SLICE_PX = 100;
const isValidTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;
const viewportTraceStorageKey = 'flambe.timeline.viewport-trace-id.v1';

function readLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

// minTime is smallest timestamp in the entire timeline
// maxTime is largest timestamp in the entire timeline
// leftBoundaryTime is timestamp of left bound of current view
// rightBoundaryTime is timestamp of right bound of current view

/* ⚠️ this is naive, but might be good enough */
const threadsCollapsedChecksum = (threads: Record<string, Thread> = {}) => Object.values(threads)
  .reduce((acc, { collapsed }) => acc + (collapsed ? 1 : 0), 0);

interface DividerData {
  offsets: Array<{ position: number; time: number }>;
  precision: number;
  /** Current axis step in ms — ADR-005 same-agent chrome coalesce threshold. */
  gridSliceTime: number;
}

type ZoomPeriod = 'now' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

export interface TimelineProps {
  absoluteTimeLabels: boolean;
  twelveHourClock: boolean;
  activities: Record<string, ProcessedActivity>;
  addCommand: (command: Command) => unknown;
  attentionDrivenThreadOrder: boolean;
  attentionShifts: AttentionShift[];
  darkerAsWeGoDown: boolean;
  rightAlignTimelineText: boolean;
  blocks: TraceBlock[];
  categories: Category[];
  focusBlock: (input: { index: number | null; activity_id: EntityId | null; activityStatus?: string | null; thread_id: EntityId | null }) => unknown;
  focusedBlockIndex?: number | null;
  hoverBlock: (index: number | string | null) => unknown;
  hoveredBlockIndex?: number | null;
  leftBoundaryTimeOverride?: number;
  mantras: Mantra[];
  observations?: Observation[];
  maxTime?: number;
  minTime?: number;
  modifiers: ModifiersState;
  rightBoundaryTimeOverride?: number;
  searchTerms: SearchTerm[];
  submitCommand: (command: any) => unknown;
  tabs: TabCount[];
  threadLevels: Record<string, ThreadLevel>;
  threads: Record<string, Thread>;
  toggleThread: (id: EntityId, isCollapsed?: boolean) => unknown;
  trace_id: EntityId;
  updateEvent: (id: EntityId, updates: Record<string, unknown>) => unknown;
}

interface TimelineComponentState {
  composingZoomChord: boolean;
  dividersData: DividerData;
  height: number;
  threadModal_id: number | null;
  timeSeriesHeight: number;
  width: number;
  zoomChord: string;
  zoomChordMultiplier: number;
}

class Timeline extends React.Component<TimelineProps, TimelineComponentState> {
  state: TimelineComponentState = {
    dividersData: {
      offsets: [],
      precision: 0,
      gridSliceTime: 0,
    },
    composingZoomChord: false,
    height: 0,
    threadModal_id: null,
    timeSeriesHeight: 100,
    width: 0,
    zoomChord: '',
    zoomChordMultiplier: 1,
  };

  flameChart = React.createRef<FlameChartComponent>();
  timeSeries = React.createRef<TimeSeries>();
  focusedBlock = React.createRef<React.ComponentRef<typeof FocusedBlock>>();
  timelineSurface: HTMLDivElement | null = null;
  touchPoints = new Map<number, TouchPoint>();
  touchMode: 'none' | 'pan' | 'pinch' = 'none';
  panStartX = 0;
  panStartY = 0;
  panLastX = 0;
  panLastY = 0;
  pinchLastDistance = 0;
  viewportTraceId: string | null = null;
  leftBoundaryTime = 0;
  rightBoundaryTime = 0;
  topOffset = 0;
  dividersData: DividerData = { offsets: [], precision: 0, gridSliceTime: 0 };

  constructor(props: TimelineProps) {
    super(props);

    const savedTimes = {
      lbt: readLocalStorage('lbt'),
      rbt: readLocalStorage('rbt'),
    };
    this.viewportTraceId = readLocalStorage(viewportTraceStorageKey);
    const leftBoundaryTime = savedTimes.lbt && Number.parseFloat(savedTimes.lbt);
    const rightBoundaryTime = savedTimes.rbt && Number.parseFloat(savedTimes.rbt);
    const dividersData = this.calculateGridOffsets();

    this.setTimelineState({
      ...(leftBoundaryTime ? { leftBoundaryTime } : {}),
      ...(rightBoundaryTime ? { rightBoundaryTime } : {}),
      dividersData,
    });

    props.addCommand({
      action: command => {
        this.zoomTo(command.timePeriod as ZoomPeriod);
      },
      copy: 'zoom to...',
      parameters: [
        {
          key: 'timePeriod',
          placeholder: 'time period',
          selector: () => [
            { name: 'now', value: 'now' },
            { name: 'the last day', value: 'day' },
            { name: 'the last week', value: 'week' },
            { name: 'the last month', value: 'month' },
          ],
          itemStringKey: 'name',
          itemReturnKey: 'value',
        },
      ],
    });
  }

  componentDidMount() {
    persistCollapsedThreadState(this.props.trace_id, this.props.threads);
    requestAnimationFrame(this.drawChildren.bind(this));
  }

  componentWillUnmount(): void {
    this.detachTouchListeners();
  }

  setTimelineSurface = (element: HTMLDivElement | null): void => {
    if (element === this.timelineSurface) return;
    this.detachTouchListeners();
    this.timelineSurface = element;
    if (element) {
      this.attachTouchListeners(element);
      this.writeViewportDataset(element);
    }
  };

  attachTouchListeners = (element: HTMLDivElement): void => {
    element.addEventListener('touchstart', this.onTouchStart, { passive: true });
    element.addEventListener('touchmove', this.onTouchMove, { passive: false });
    element.addEventListener('touchend', this.onTouchEnd, { passive: true });
    element.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
  };

  detachTouchListeners = (): void => {
    const element = this.timelineSurface;
    if (!element) return;
    element.removeEventListener('touchstart', this.onTouchStart);
    element.removeEventListener('touchmove', this.onTouchMove);
    element.removeEventListener('touchend', this.onTouchEnd);
    element.removeEventListener('touchcancel', this.onTouchEnd);
  };

  syncTouchPoints = (touchList: TouchList): void => {
    this.touchPoints.clear();
    for (let index = 0; index < touchList.length; index += 1) {
      const touch = touchList.item(index);
      if (!touch) continue;
      this.touchPoints.set(touch.identifier, {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
    }
  };

  touchPointsList = (): TouchPoint[] => Array.from(this.touchPoints.values());

  onTouchStart = (event: TouchEvent): void => {
    this.syncTouchPoints(event.touches);
    const points = this.touchPointsList();
    if (points.length >= 2) {
      this.touchMode = 'pinch';
      this.pinchLastDistance = touchDistance(points[0]!, points[1]!);
      return;
    }
    if (points.length === 1) {
      this.touchMode = 'none';
      this.panStartX = points[0]!.clientX;
      this.panStartY = points[0]!.clientY;
      this.panLastX = points[0]!.clientX;
      this.panLastY = points[0]!.clientY;
    }
  };

  onTouchMove = (event: TouchEvent): void => {
    this.syncTouchPoints(event.touches);
    const points = this.touchPointsList();
    const width = this.state.width;
    if (!(width > 0) || !isValidTime(this.leftBoundaryTime) || !isValidTime(this.rightBoundaryTime)) {
      return;
    }

    if (points.length >= 2) {
      event.preventDefault();
      const [first, second] = points;
      const distance = touchDistance(first!, second!);
      if (!(this.pinchLastDistance > 0)) {
        this.touchMode = 'pinch';
        this.pinchLastDistance = distance;
        return;
      }

      const scaleRatio = distance / this.pinchLastDistance;
      this.pinchLastDistance = distance;
      this.touchMode = 'pinch';

      const surface = this.timelineSurface;
      if (!surface || !(scaleRatio > 0) || scaleRatio === 1) return;
      const rect = surface.getBoundingClientRect();
      const midpoint = touchMidpoint(first!, second!);
      const offsetX = midpoint.clientX - rect.left;
      const zoomCenterTime = pixelsToTime(
        offsetX,
        this.leftBoundaryTime,
        this.rightBoundaryTime,
        width,
      );
      this.zoom(
        wheelDeltaFromPinchScale(scaleRatio),
        offsetX,
        zoomCenterTime,
        width,
      );
      requestAnimationFrame(this.drawChildren.bind(this));
      return;
    }

    if (points.length === 1) {
      const currentX = points[0]!.clientX;
      const currentY = points[0]!.clientY;
      if (this.touchMode !== 'pan') {
        if (!touchHasMoved(
          { clientX: this.panStartX, clientY: this.panStartY },
          { clientX: currentX, clientY: currentY },
        )) {
          return;
        }
        this.touchMode = 'pan';
      }

      event.preventDefault();
      const deltaX = panDeltaFromTouchMove(this.panLastX, currentX);
      const deltaY = panDeltaFromTouchMove(this.panLastY, currentY);
      this.panLastX = currentX;
      this.panLastY = currentY;
      if (deltaX === 0 && deltaY === 0) return;
      this.pan(deltaX, deltaY, width);
      requestAnimationFrame(this.drawChildren.bind(this));
    }
  };

  onTouchEnd = (event: TouchEvent): void => {
    this.syncTouchPoints(event.touches);
    const points = this.touchPointsList();
    if (points.length >= 2) {
      this.touchMode = 'pinch';
      this.pinchLastDistance = touchDistance(points[0]!, points[1]!);
      return;
    }
    if (points.length === 1) {
      this.touchMode = 'none';
      this.panStartX = points[0]!.clientX;
      this.panStartY = points[0]!.clientY;
      this.panLastX = points[0]!.clientX;
      this.panLastY = points[0]!.clientY;
      this.pinchLastDistance = 0;
      return;
    }
    this.touchMode = 'none';
    this.pinchLastDistance = 0;
  };

  componentDidUpdate(previousProps: TimelineProps): void {
    this.syncTimelineToProps(this.props, previousProps);
    requestAnimationFrame(this.drawChildren);
  }

  syncTimelineToProps(nextProps: TimelineProps, previousProps: TimelineProps): void {
    if (
      nextProps.leftBoundaryTimeOverride
        !== previousProps.leftBoundaryTimeOverride
      || nextProps.rightBoundaryTimeOverride
        !== previousProps.rightBoundaryTimeOverride
    ) {
      this.viewportTraceId = String(nextProps.trace_id);
      this.setTimelineState({
        leftBoundaryTime: nextProps.leftBoundaryTimeOverride,
        rightBoundaryTime: nextProps.rightBoundaryTimeOverride,
      });
    }

    const hasExplicitRange = isValidTime(nextProps.leftBoundaryTimeOverride)
      && isValidTime(nextProps.rightBoundaryTimeOverride);
    const hasSavedRange = isValidTime(this.leftBoundaryTime)
      && isValidTime(this.rightBoundaryTime);
    const traceHasTimeRange = isValidTime(nextProps.minTime)
      && isValidTime(nextProps.maxTime);
    const savedRangeOverlapsTrace = savedRangeIsUsable(
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      nextProps.minTime ?? 0,
      nextProps.maxTime ?? 0,
      this.viewportTraceId,
      nextProps.trace_id,
    );

    // A trace can be restored or replaced with data from a different period.
    // In that case, a persisted viewport would otherwise leave every block
    // off-screen. Initialize from the trace the first time, or reset only when
    // the saved range no longer overlaps it.
    if (
      !hasExplicitRange
      && traceHasTimeRange
      && (!hasSavedRange || !savedRangeOverlapsTrace)
    ) {
      this.viewportTraceId = String(nextProps.trace_id);
      this.setTimelineState({
        leftBoundaryTime: nextProps.minTime!,
        rightBoundaryTime: Math.max(nextProps.maxTime!, Date.now())
          + MAX_TIME_INTO_FUTURE,
      });
    }

    if (
      threadsCollapsedChecksum(nextProps.threads)
      !== threadsCollapsedChecksum(previousProps.threads)
    ) {
      requestAnimationFrame(this.drawChildren.bind(this));
    }

    persistCollapsedThreadState(nextProps.trace_id, nextProps.threads);
  }

  handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    // preventDefault basically broken as this is a passive event listener, and there is currently no way to make it active in react
    // https://github.com/facebook/react/issues/6436
    // e.preventDefault();
    const zoomCenterTime = pixelsToTime(
      e.nativeEvent.offsetX,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      this.state.width,
    );

    if (e.getModifierState('Shift')) {
      // Shift+wheel (or Shift converted to deltaX by the OS) scrolls threads.
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      this.pan(0, delta, this.state.width);
      requestAnimationFrame(this.drawChildren.bind(this));
    } else if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
      this.pan(e.deltaX, 0, this.state.width);
      requestAnimationFrame(this.drawChildren.bind(this));
    } else {
      this.zoom(
        e.deltaY,
        e.nativeEvent.offsetX,
        zoomCenterTime,
        this.state.width,
      );
      requestAnimationFrame(this.drawChildren.bind(this));
    }
  };

  drawChildren = () => {
    const { leftBoundaryTime, rightBoundaryTime } = this.getVisibleTimeRange();
    if (!isValidTime(leftBoundaryTime) || !isValidTime(rightBoundaryTime)) return;

    if (!isValidTime(this.leftBoundaryTime) || !isValidTime(this.rightBoundaryTime)) {
      this.setTimelineState({ leftBoundaryTime, rightBoundaryTime });
    }

    const dividersData = this.calculateGridOffsets(
      leftBoundaryTime,
      rightBoundaryTime,
    );
    this.dividersData = dividersData;

    this.timeSeries.current
      && this.timeSeries.current.draw(
        leftBoundaryTime,
        rightBoundaryTime,
        this.state.width,
      );

    this.flameChart.current
      && this.flameChart.current.draw(
        leftBoundaryTime,
        rightBoundaryTime,
        this.state.width,
        dividersData,
        this.topOffset,
      );

    if (this.flameChart.current) {
      this.topOffset = this.flameChart.current.appliedTopOffset;
      this.writeViewportDataset();
    }

    this.focusedBlock
      && this.focusedBlock.current
      && this.focusedBlock.current.forceUpdate();
  };

  /* 💁 mostly borrowed from chrome devtools-frontend ❤️ */
  getVisibleTimeRange = (props = this.props) => {
    const savedRangeIsValid = isValidTime(this.leftBoundaryTime)
      && isValidTime(this.rightBoundaryTime);
    const traceRangeIsValid = isValidTime(props.minTime)
      && isValidTime(props.maxTime);
    const savedRangeOverlapsTrace = !traceRangeIsValid
      || savedRangeIsUsable(
        this.leftBoundaryTime,
        this.rightBoundaryTime,
        props.minTime,
        props.maxTime,
        this.viewportTraceId,
        props.trace_id,
      );

    if (savedRangeIsValid && savedRangeOverlapsTrace) {
      return {
        leftBoundaryTime: this.leftBoundaryTime,
        rightBoundaryTime: this.rightBoundaryTime,
      };
    }

    if (traceRangeIsValid) {
      return {
        leftBoundaryTime: props.minTime,
        rightBoundaryTime: Math.max(props.maxTime, Date.now())
          + MAX_TIME_INTO_FUTURE,
      };
    }

    return { leftBoundaryTime: null, rightBoundaryTime: null };
  };

  calculateGridOffsets(
    leftBoundaryTime = this.leftBoundaryTime,
    rightBoundaryTime = this.rightBoundaryTime,
  ): DividerData {
    const clientWidth = this.state.width;
    if (!isValidTime(leftBoundaryTime) || !isValidTime(rightBoundaryTime)
      || !Number.isFinite(clientWidth) || clientWidth <= 0) {
      return { offsets: [], precision: 0, gridSliceTime: 0 };
    }

    const boundarySpan = rightBoundaryTime - leftBoundaryTime;
    const pixelsPerTime = clientWidth / boundarySpan;

    if (this.props.absoluteTimeLabels) {
      const step = chooseAbsoluteGridStep(
        boundarySpan,
        clientWidth,
        ABSOLUTE_MIN_GRID_SLICE_PX,
      );
      const lastDividerTime = rightBoundaryTime
        + ABSOLUTE_MIN_GRID_SLICE_PX / pixelsPerTime;
      const stepMs = absoluteGridStepMs(step);
      const offsets = absoluteGridTimes(
        leftBoundaryTime,
        lastDividerTime,
        step,
      ).map(time => ({
        position: Math.floor(this.timeToPixels(time)),
        time,
      }));

      return {
        offsets,
        precision: Math.max(
          0,
          -Math.floor(Math.log(stepMs * 1.01) / Math.LN10),
        ),
        gridSliceTime: stepMs,
      };
    }

    const zeroTime = 0;
    const minGridSlicePx = MIN_GRID_SLICE_PX;

    // calculator.computePosition(rightBoundaryTime);
    let dividersCount = clientWidth / minGridSlicePx;
    let gridSliceTime = boundarySpan / dividersCount;

    // Align gridSliceTime to a nearest round value.
    // We allow spans that fit into the formula: span = (1|2|5)x10^n,
    // e.g.: ...  .1  .2  .5  1  2  5  10  20  50  ...
    // After a span has been chosen make grid lines at multiples of the span.

    const logGridSliceTime = Math.ceil(Math.log(gridSliceTime) / Math.LN10);
    gridSliceTime = 10 ** logGridSliceTime;
    if (gridSliceTime * pixelsPerTime >= 5 * minGridSlicePx) {
      gridSliceTime /= 5;
    }
    if (gridSliceTime * pixelsPerTime >= 2 * minGridSlicePx) {
      gridSliceTime /= 2;
    }

    const firstDividerTime = Math.ceil((leftBoundaryTime - zeroTime) / gridSliceTime) * gridSliceTime
      + zeroTime;
    let lastDividerTime = rightBoundaryTime;
    // Add some extra space past the right boundary as the rightmost divider label text
    // may be partially shown rather than just pop up when a new rightmost divider gets into the view.
    lastDividerTime += minGridSlicePx / pixelsPerTime;
    dividersCount = Math.ceil(
      (lastDividerTime - firstDividerTime) / gridSliceTime,
    );

    if (!gridSliceTime) dividersCount = 0;

    const offsets = [];
    for (let i = 0; i < dividersCount; ++i) {
      const time = firstDividerTime + gridSliceTime * i;
      offsets.push({
        position: Math.floor(this.timeToPixels(time)),
        time,
      });
    }

    return {
      offsets,
      precision: Math.max(
        0,
        -Math.floor(Math.log(gridSliceTime * 1.01) / Math.LN10),
      ),
      gridSliceTime,
    };
  }

  timeToPixels(timestamp: number): number {
    const { leftBoundaryTime, rightBoundaryTime } = this.getVisibleTimeRange();

    if (leftBoundaryTime === null || rightBoundaryTime === null) return 0;

    return timeToPixels(
      timestamp,
      leftBoundaryTime,
      rightBoundaryTime,
      this.state.width,
    );
  }

  zoomTo(timePeriod: ZoomPeriod | ''): void {
    this.viewportTraceId = String(this.props.trace_id);

    switch (timePeriod) {
      // shows about the last 10 minutes
      case 'now':
        this.setTimelineState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 10 * MINUTE,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE,
        });
        break;
      case 'hour':
        this.setTimelineState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 60 * MINUTE,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE,
        });
        break;
      case 'day':
        this.setTimelineState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 1 * DAY,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE,
        });
        break;
      case 'week':
        this.setTimelineState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 1 * WEEK,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE,
        });
        break;
      case 'month':
        this.setTimelineState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 1 * MONTH,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE,
        });
        break;
      case 'year':
        this.setTimelineState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 12 * MONTH,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE,
        });
        break;
      case 'all':
        this.setTimelineState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: this.props.minTime,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE,
        });
        break;
      default:
        break;
    }
    requestAnimationFrame(this.drawChildren.bind(this));
  }

  zoom = (dy: number, offsetX: number, zoomCenterTime: number, canvasWidth: number): void => {
    this.viewportTraceId = String(this.props.trace_id);
    const dividersData = this.calculateGridOffsets();

    const { leftBoundaryTime, rightBoundaryTime } = zoom(
      dy,
      offsetX,
      zoomCenterTime,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      canvasWidth,
      Date.now(),
      this.props.minTime ?? 0,
    );

    this.setTimelineState({
      leftBoundaryTime,
      rightBoundaryTime,
      dividersData,
    });
  };

  pan = (dx: number, dy: number, canvasWidth: number): void => {
    this.viewportTraceId = String(this.props.trace_id);
    const dividersData = this.calculateGridOffsets();
    const maxTopOffset = this.flameChart.current?.maxTopOffset
      ?? Number.POSITIVE_INFINITY;
    const { leftBoundaryTime, rightBoundaryTime, topOffset } = pan(
      dx,
      dy,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      canvasWidth,
      this.topOffset,
      Date.now(),
      this.props.minTime ?? 0,
      maxTopOffset,
    );

    this.setTimelineState({
      leftBoundaryTime,
      rightBoundaryTime,
      dividersData,
      topOffset,
    });
  };

  writeViewportDataset = (element: HTMLDivElement | null = this.timelineSurface): void => {
    if (!element) return;
    if (Number.isFinite(this.leftBoundaryTime)) {
      element.dataset.lbt = String(this.leftBoundaryTime);
    }
    if (Number.isFinite(this.rightBoundaryTime)) {
      element.dataset.rbt = String(this.rightBoundaryTime);
    }
    element.dataset.topOffset = String(this.topOffset || 0);
    const maxTopOffset = this.flameChart.current?.maxTopOffset;
    if (maxTopOffset !== undefined) {
      element.dataset.maxTopOffset = String(maxTopOffset);
    }
  };

  // avoiding react state for some stuff
  setTimelineState = (state: Partial<{
    dividersData: DividerData;
    leftBoundaryTime: number;
    rightBoundaryTime: number;
    topOffset: number;
  }>): void => {
    Object.assign(this, state);
    this.writeViewportDataset();
    scheduleIdleCallback(this.setLocalStorage.bind(this));
  };

  showThreadDetail = (id: EntityId): void => {
    this.setState({ threadModal_id: Number(id) });
  };

  closeThreadDetail = (): void => {
    this.setState({ threadModal_id: null });
  };

  handlePaneChange = (size: number): void => {
    this.setState({ timeSeriesHeight: size });
  };

  /**
   * 💁 I didn't want left and right boundary times to be part of redux, because they were changing too fast for a super silky smooth animation, but I did want them to persist through reloads. So, when this component will mount, if they exist in localStorage, they will take that initial value. They are then set in localStorage at most once a second.
   *
   */
  setLocalStorage = throttle(() => {
    if (
      Number.isFinite(this.leftBoundaryTime)
      && Number.isFinite(this.rightBoundaryTime)
    ) {
      localStorage.setItem('lbt', String(this.leftBoundaryTime));
      localStorage.setItem('rbt', String(this.rightBoundaryTime));
      if (this.viewportTraceId) {
        localStorage.setItem(viewportTraceStorageKey, this.viewportTraceId);
      }
    }
  }, 1000);

  render() {
    const { props } = this;

    const rightBoundaryTime = this.rightBoundaryTime || props.maxTime;
    const leftBoundaryTime = this.leftBoundaryTime || props.minTime;

    let threads = Array.isArray(props.threads)
      ? {}
      : props.attentionDrivenThreadOrder
        ? rankThreadsByAttention(props.attentionShifts, props.threads)
        : props.threads;

    // load in the sense of bearing load
    threads = loadSuspendedActivityCount(props.activities, threads);

    return (
      <WithEventListeners
        node={document}
        eventListeners={[
          [
            'keyup',
            ((event: Event) => {
              const e = event as KeyboardEvent;
              if (!(e.target instanceof HTMLInputElement)) {
                if (this.state.composingZoomChord) {
                  if (this.state.zoomChord.length === 0) {
                    let zoomChord: ZoomPeriod | '' = '';
                    switch (e.key) {
                      case 'n':
                        this.setState({ composingZoomChord: false });
                        this.zoomTo('now');
                        break;
                      case 'h':
                        // this.setState({ composingZoomChord: false });
                        zoomChord = 'hour';
                        break;
                      case 'd':
                        // this.setState({ composingZoomChord: false });
                        zoomChord = 'day';
                        break;
                      case 'w':
                        // this.setState({ composingZoomChord: false });
                        zoomChord = 'week';
                        break;
                      case 'm':
                        // this.setState({ composingZoomChord: false });
                        zoomChord = 'month';
                        break;
                      case 'y':
                        // this.setState({ composingZoomChord: false });
                        zoomChord = 'year';
                        break;
                      case 'a':
                        // this.setState({ composingZoomChord: false });
                        zoomChord = 'all';
                        break;

                      default:
                        this.setState({ composingZoomChord: false });
                        break;
                    }
                    this.zoomTo(zoomChord);
                    this.setState({ zoomChord });
                  } else if (e.key.match(/\d/)) {
                    this.setState({ zoomChordMultiplier: Number(e.key) });
                    this.setState({ composingZoomChord: false });
                  } else {
                    this.setState({
                      composingZoomChord: false,
                      zoomChord: '',
                      zoomChordMultiplier: 1,
                    });
                  }
                } else if (e.key === 'n') {
                  this.zoomTo('now');
                } else if (e.key === 'z') {
                  this.setState({ composingZoomChord: true });
                }
              }
            }) as EventListener,
          ],
        ]}
      >
        {() => (
          <>
            <Measure
              bounds
              onResize={contentRect => {
                /* 🤔 I feel like this shouldn't be necessary, but otherwise I get stuck in a render loop.bind.. */
                if (
                  contentRect.bounds.width !== this.state.width
                  || contentRect.bounds.height !== this.state.height
                ) {
                  this.setState({
                    width: contentRect.bounds.width,
                    height: contentRect.bounds.height,
                  });
                }
              }}
            >
              {({ measureRef }) => (
                <div
                  ref={element => {
                    measureRef(element);
                    this.setTimelineSurface(element);
                  }}
                  data-timeline-surface="true"
                  style={{
                    position: 'relative',
                    height: '100%',
                    touchAction: 'none',
                  }}
                  onWheel={this.handleWheel}
                >
                  <SplitPane
                    split="horizontal"
                    size={this.state.timeSeriesHeight}
                    onChange={this.handlePaneChange}
                  >
                    <TimeSeries
                      ref={this.timeSeries}
                      height={`${this.state.timeSeriesHeight}px`}
                      // leftBoundaryTime={leftBoundaryTime}
                      mantras={props.mantras}
                      observations={props.observations ?? []}
                      pan={this.pan}
                      // rightBoundaryTime={rightBoundaryTime}
                      searchTerms={props.searchTerms}
                      tabs={props.tabs.filter(
                        ({ timestamp }) => timestamp > (leftBoundaryTime ?? 0)
                          && timestamp < (rightBoundaryTime ?? 0),
                      )}
                      zoom={this.zoom}
                    />
                    <FlameChart
                      ref={this.flameChart}
                      activities={props.activities}
                      attentionShifts={props.attentionShifts}
                      blocks={props.blocks}
                      categories={props.categories}
                      currentAttention={
                        (props.attentionShifts || []).length > 0
                          ? props.attentionShifts[props.attentionShifts.length - 1].thread_id
                          : null
                      }
                      // leftBoundaryTime={leftBoundaryTime}
                      modifiers={props.modifiers}
                      pan={this.pan}
                      // rightBoundaryTime={rightBoundaryTime}
                      showThreadDetail={this.showThreadDetail}
                      threadLevels={props.threadLevels}
                      hoverBlock={props.hoverBlock}
                      focusBlock={props.focusBlock}
                      focusedBlockIndex={props.focusedBlockIndex}
                      hoveredBlockIndex={props.hoveredBlockIndex}
                      threads={threads}
                      toggleThread={props.toggleThread}
                      topOffset={this.topOffset || 0}
                      updateEvent={props.updateEvent}
                      zoom={this.zoom}
                    />
                  </SplitPane>

                  {/* ⚠️ Moved these up? */}
                  {/* Probably want to lift FocusActivty and HoverActivity up so updating it doesn't cause entire re-render... */}
                  {this.flameChart
                    && this.flameChart.current && [
                      <FocusedBlock
                      key="focus"
                      ref={this.focusedBlock}
                      yOffset={this.state.timeSeriesHeight + SPLIT_PANE_HANDLE_SIZE}
                      flameChartRef={this.flameChart}
                    />,
                      <Tooltip
                      key="tooltip"
                      flameChartRef={this.flameChart}
                      yOffset={this.state.timeSeriesHeight + SPLIT_PANE_HANDLE_SIZE}
                      activities={props.activities}
                      blocks={props.blocks}
                    />,
                  ]}
                  <ThreadDetail
                    closeThreadDetail={this.closeThreadDetail}
                    id={this.state.threadModal_id}
                    name={this.state.threadModal_id === null
                      ? undefined
                      : props.threads[this.state.threadModal_id]?.name}
                    activities={props.activities}
                  />
                  <ActivityDetailModal
                    blocks={props.blocks}
                    activities={props.activities}
                    submitCommand={props.submitCommand}
                  />
                </div>
              )}
            </Measure>
            {this.state.composingZoomChord && (
              <div style={{ position: 'fixed', bottom: 0, left: 0 }}>
                Zoom to... (Waiting for second key of chord)
                {' '}
                {this.state.zoomChord}
                {' '}
                {this.state.zoomChordMultiplier}
                {' '}
hours
                ago
              </div>
            )}
          </>
        )}
      </WithEventListeners>
    );
  }
}

export default Timeline;
