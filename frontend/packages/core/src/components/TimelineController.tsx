import * as React from 'react';
import throttle from 'lodash/throttle';
import Measure from './Measure';

import { MAX_TIME_INTO_FUTURE } from '../constants/defaultParameters';
import {
  timeToPixels,
  pixelsToTime,
} from '../utilities/timelineGeometry';
import zoom from '../utilities/zoom';
import pan from '../utilities/pan';
import { persistCollapsedThreadState } from '../utilities/threadCollapseState';
import { savedRangeIsUsable } from '../utilities/timelineViewport';
import {
  interpolateTimelineTimeRange,
  piecewiseBezier,
  prefersReducedTimelineMotion,
} from '../utilities/timelineViewportAnimation';
import { parsePresetZoomCurve } from '../utilities/presetZoomSettings';
import {
  MINUTE, DAY, WEEK, MONTH,
} from '../utilities/time';
import {
  absoluteGridStepMs,
  absoluteGridTimes,
  chooseAbsoluteGridStep,
} from '../utilities/absoluteTimelineGrid';
import { scheduleIdleCallback } from '../utilities/requestIdleCallback';
import { ZoomShortcutGuard } from '../utilities/keyboardShortcuts';
import { isShortcutBlockedByTextEntry } from '../utilities/swyzzleIdle';
import {
  decayTouchVelocity,
  panDeltaFromTouchMove,
  smoothTouchVelocity,
  touchDistance,
  touchHasMoved,
  touchInertiaIsActive,
  touchMidpoint,
  dominantPanAxis,
  isNativeScrollTouchTarget,
  wheelDeltaFromPinchScale,
  type PanAxis,
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
import type { FlameChartHandle } from '../types/FlameChartHandle';
import { TimelineContext } from './TimelineContext';


const MIN_GRID_SLICE_PX = 60;
const ABSOLUTE_MIN_GRID_SLICE_PX = 100;
const viewportTraceStorageKey = 'flambe.timeline.viewport-trace-id.v1';
const isValidTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value !== 0;

const isValidRange = (
  leftBoundaryTime: unknown,
  rightBoundaryTime: unknown,
): boolean => (
  isValidTime(leftBoundaryTime)
  && isValidTime(rightBoundaryTime)
  && rightBoundaryTime > leftBoundaryTime
);

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

export interface DividerData {
  offsets: Array<{ position: number; time: number }>;
  precision: number;
  /** Current axis step in ms — ADR-005 same-agent chrome coalesce threshold. */
  gridSliceTime: number;
}

export type ZoomPeriod = 'now' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

export interface TimelineProps {
  children?: React.ReactNode;
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
  onCursorTimeChange?: (time: number | null) => void;
  showActivityDetails: () => unknown;
  leftBoundaryTimeOverride?: number;
  mantras: Mantra[];
  observations?: Observation[];
  presetPanCurve: string;
  presetZoomCurve: string;
  presetZoomDurationMs: number;
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
  beginActivity?: (id: EntityId) => unknown;
  deleteActivity?: (id: EntityId, threadId: EntityId) => unknown;
  dropLimboActivity?: (id: EntityId, updates: Record<string, unknown>) => unknown;
  createActivityAt?: (threadId: EntityId, time: number) => unknown;
  planActivityInLimbo?: (name: string) => unknown;
  updateActivity?: (id: EntityId, updates: Record<string, unknown>) => unknown;
}

interface TimelineComponentState {
  composingZoomChord: boolean;
  height: number;
  width: number;
  zoomChord: string;
  zoomChordMultiplier: number;
}

class TimelineController extends React.Component<TimelineProps, TimelineComponentState> {
  state: TimelineComponentState = {
    composingZoomChord: false,
    height: 0,
    width: 0,
    zoomChord: '',
    zoomChordMultiplier: 1,
  };

  flameChart = React.createRef<FlameChartHandle>();
  timelineSurface: HTMLDivElement | null = null;
  gestureSurface: HTMLElement | null = null;
  drawListeners = new Set<(left: number, right: number) => void>();
  drawFrame: number | null = null;
  mounted = false;

  subscribeDraw = (draw: (left: number, right: number) => void): (() => void) => {
    this.drawListeners.add(draw);
    this.scheduleDrawChildren();
    return () => { this.drawListeners.delete(draw); };
  };

  scheduleDrawChildren = (): void => {
    if (!this.mounted || this.drawFrame !== null) return;
    this.drawFrame = requestAnimationFrame(() => {
      this.drawFrame = null;
      this.drawChildren();
    });
  };

  eventSurface = (target: EventTarget | null): HTMLElement | null => {
    const element = typeof Element !== 'undefined' && target instanceof Element ? target.closest<HTMLElement>('[data-timeline-pane]') : null;
    return element && this.timelineSurface?.contains(element) ? element : this.timelineSurface;
  };

  gestureWidth = (): number => this.gestureSurface?.getBoundingClientRect().width ?? this.state.width;
  touchPoints = new Map<number, TouchPoint>();
  touchMode: 'none' | 'pan' | 'pinch' | 'native' = 'none';
  panAxis: PanAxis | null = null;
  panStartX = 0;
  panStartY = 0;
  panLastX = 0;
  panLastY = 0;
  touchVelocityX = 0;
  touchVelocityY = 0;
  touchLastMoveTime = 0;
  touchInertiaFrame: number | null = null;
  touchInertiaLastFrameTime = 0;
  pinchLastDistance = 0;
  viewportTraceId: string | null = null;
  leftBoundaryTime = 0;
  rightBoundaryTime = 0;
  topOffset = 0;
  viewportAnimationFrame: number | null = null;
  zoomChordTimeout: ReturnType<typeof setTimeout> | null = null;
  zoomShortcutGuard = new ZoomShortcutGuard();

  constructor(props: TimelineProps) {
    super(props);

    const savedTimes = {
      lbt: readLocalStorage('lbt'),
      rbt: readLocalStorage('rbt'),
    };
    this.viewportTraceId = readLocalStorage(viewportTraceStorageKey);
    const leftBoundaryTime = savedTimes.lbt && Number.parseFloat(savedTimes.lbt);
    const rightBoundaryTime = savedTimes.rbt && Number.parseFloat(savedTimes.rbt);

    this.setTimelineState({
      ...(leftBoundaryTime ? { leftBoundaryTime } : {}),
      ...(rightBoundaryTime ? { rightBoundaryTime } : {}),
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

  onTimelineKeyDown = (event: Event): void => {
    if (this.zoomShortcutGuard.keyDown(event as KeyboardEvent)) {
      this.clearZoomChordTimeout();
      this.setState({ composingZoomChord: false, zoomChord: '', zoomChordMultiplier: 1 });
    }
  };

  onTimelineKeyUp = (event: Event): void => {
    const e = event as KeyboardEvent;
    if (this.zoomShortcutGuard.keyUp(e)) return;
    if (!e.metaKey && !e.ctrlKey && !e.altKey && !isShortcutBlockedByTextEntry(e)) {
      if (this.state.composingZoomChord) {
        this.clearZoomChordTimeout();
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
          if (zoomChord) this.scheduleZoomChordTimeout();
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
        this.setState({
          composingZoomChord: true,
          zoomChord: '',
          zoomChordMultiplier: 1,
        });
        this.scheduleZoomChordTimeout();
      }
    }
  };

  componentDidMount() {
    this.mounted = true;
    this.syncTimelineToProps(this.props, {} as TimelineProps);
    this.scheduleDrawChildren();
  }

  componentWillUnmount(): void {
    this.mounted = false;
    if (this.drawFrame !== null) cancelAnimationFrame(this.drawFrame);
    this.setLocalStorage.cancel();
    this.drawListeners.clear();
    this.cancelViewportAnimation();
    this.cancelTouchInertia();
    this.clearZoomChordTimeout();
    this.detachTouchListeners();
  }

  clearZoomChordTimeout = (): void => {
    if (this.zoomChordTimeout === null) return;
    clearTimeout(this.zoomChordTimeout);
    this.zoomChordTimeout = null;
  };

  scheduleZoomChordTimeout = (): void => {
    this.clearZoomChordTimeout();
    this.zoomChordTimeout = setTimeout(() => {
      this.zoomChordTimeout = null;
      this.setState({
        composingZoomChord: false,
        zoomChord: '',
        zoomChordMultiplier: 1,
      });
    }, 1500);
  };

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

  resetTouchVelocity = (timestamp = 0): void => {
    this.touchVelocityX = 0;
    this.touchVelocityY = 0;
    this.touchLastMoveTime = timestamp;
  };

  onTouchStart = (event: TouchEvent): void => {
    this.gestureSurface = this.eventSurface(event.target);
    this.cancelTouchInertia();
    this.resetTouchVelocity(event.timeStamp);

    if (isNativeScrollTouchTarget(event.target)) {
      this.touchMode = 'native';
      this.panAxis = null;
      this.touchPoints.clear();
      this.pinchLastDistance = 0;
      return;
    }

    this.syncTouchPoints(event.touches);
    const points = this.touchPointsList();
    if (points.length >= 2) {
      this.touchMode = 'pinch';
      this.panAxis = null;
      this.pinchLastDistance = touchDistance(points[0]!, points[1]!);
      return;
    }
    if (points.length === 1) {
      this.touchMode = 'none';
      this.panAxis = null;
      this.panStartX = points[0]!.clientX;
      this.panStartY = points[0]!.clientY;
      this.panLastX = points[0]!.clientX;
      this.panLastY = points[0]!.clientY;
    }
  };

  onTouchMove = (event: TouchEvent): void => {
    if (this.touchMode === 'native') return;

    this.syncTouchPoints(event.touches);
    const points = this.touchPointsList();
    const width = this.gestureWidth();
    if (!(width > 0) || !isValidTime(this.leftBoundaryTime) || !isValidTime(this.rightBoundaryTime)) {
      return;
    }

    if (points.length >= 2) {
      event.preventDefault();
      this.resetTouchVelocity(event.timeStamp);
      const [first, second] = points;
      const distance = touchDistance(first!, second!);
      if (!(this.pinchLastDistance > 0)) {
        this.touchMode = 'pinch';
        this.panAxis = null;
        this.pinchLastDistance = distance;
        return;
      }

      const scaleRatio = distance / this.pinchLastDistance;
      this.pinchLastDistance = distance;
      this.touchMode = 'pinch';
      this.panAxis = null;

      const surface = this.gestureSurface ?? this.timelineSurface;
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
      this.scheduleDrawChildren();
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
        this.panAxis = dominantPanAxis(
          { clientX: this.panStartX, clientY: this.panStartY },
          { clientX: currentX, clientY: currentY },
        );
      }

      event.preventDefault();
      const rawDeltaX = panDeltaFromTouchMove(this.panLastX, currentX);
      const rawDeltaY = panDeltaFromTouchMove(this.panLastY, currentY);
      this.panLastX = currentX;
      this.panLastY = currentY;
      const axis = this.panAxis ?? 'x';
      const deltaX = axis === 'x' ? rawDeltaX : 0;
      const deltaY = axis === 'y' ? rawDeltaY : 0;
      if (deltaX === 0 && deltaY === 0) return;

      const elapsedMs = Math.max(1, event.timeStamp - this.touchLastMoveTime);
      this.touchLastMoveTime = event.timeStamp;
      this.touchVelocityX = axis === 'x'
        ? smoothTouchVelocity(this.touchVelocityX, deltaX, elapsedMs)
        : 0;
      this.touchVelocityY = axis === 'y'
        ? smoothTouchVelocity(this.touchVelocityY, deltaY, elapsedMs)
        : 0;

      this.pan(deltaX, deltaY, width);
      this.scheduleDrawChildren();
    }
  };

  onTouchEnd = (event: TouchEvent): void => {
    if (this.touchMode === 'native') {
      if (event.touches.length === 0) {
        this.touchMode = 'none';
        this.panAxis = null;
      }
      return;
    }

    const releasedFromPan = this.touchMode === 'pan';
    const releasedAxis = this.panAxis;
    this.syncTouchPoints(event.touches);
    const points = this.touchPointsList();
    if (points.length >= 2) {
      this.touchMode = 'pinch';
      this.panAxis = null;
      this.resetTouchVelocity(event.timeStamp);
      this.pinchLastDistance = touchDistance(points[0]!, points[1]!);
      return;
    }
    if (points.length === 1) {
      this.touchMode = 'none';
      this.panAxis = null;
      this.resetTouchVelocity(event.timeStamp);
      this.panStartX = points[0]!.clientX;
      this.panStartY = points[0]!.clientY;
      this.panLastX = points[0]!.clientX;
      this.panLastY = points[0]!.clientY;
      this.pinchLastDistance = 0;
      return;
    }

    this.touchMode = 'none';
    this.panAxis = null;
    this.pinchLastDistance = 0;
    if (releasedFromPan && releasedAxis) {
      this.startTouchInertia(releasedAxis);
    }
  };

  cancelTouchInertia = (): void => {
    if (this.touchInertiaFrame !== null) {
      cancelAnimationFrame(this.touchInertiaFrame);
      this.touchInertiaFrame = null;
    }
    this.touchInertiaLastFrameTime = 0;
  };

  startTouchInertia = (axis: PanAxis): void => {
    this.cancelTouchInertia();
    if (prefersReducedTimelineMotion()) {
      this.resetTouchVelocity();
      return;
    }

    let velocityX = axis === 'x' ? this.touchVelocityX : 0;
    let velocityY = axis === 'y' ? this.touchVelocityY : 0;
    if (!touchInertiaIsActive(axis === 'x' ? velocityX : velocityY)) {
      this.resetTouchVelocity();
      return;
    }

    const drawFrame = (timestamp: number) => {
      if (this.touchInertiaLastFrameTime === 0) {
        this.touchInertiaLastFrameTime = timestamp;
        this.touchInertiaFrame = requestAnimationFrame(drawFrame);
        return;
      }

      const elapsedMs = Math.min(32, Math.max(1, timestamp - this.touchInertiaLastFrameTime));
      this.touchInertiaLastFrameTime = timestamp;
      velocityX = decayTouchVelocity(velocityX, elapsedMs);
      velocityY = decayTouchVelocity(velocityY, elapsedMs);
      const velocity = axis === 'x' ? velocityX : velocityY;
      if (!touchInertiaIsActive(velocity)) {
        this.cancelTouchInertia();
        this.resetTouchVelocity();
        return;
      }

      const beforeLeftBoundaryTime = this.leftBoundaryTime;
      const beforeTopOffset = this.topOffset;
      this.pan(
        axis === 'x' ? velocityX * elapsedMs : 0,
        axis === 'y' ? velocityY * elapsedMs : 0,
        this.gestureWidth(),
        false,
      );
      this.drawChildren();

      const hitBoundary = axis === 'x'
        ? this.leftBoundaryTime === beforeLeftBoundaryTime
        : this.topOffset === beforeTopOffset;
      if (hitBoundary) {
        this.cancelTouchInertia();
        this.resetTouchVelocity();
        return;
      }

      this.touchInertiaFrame = requestAnimationFrame(drawFrame);
    };

    this.touchInertiaFrame = requestAnimationFrame(drawFrame);
  };

  componentDidUpdate(previousProps: TimelineProps): void {
    this.syncTimelineToProps(this.props, previousProps);
    this.scheduleDrawChildren();
  }

  syncTimelineToProps(nextProps: TimelineProps, previousProps: TimelineProps): void {
    const hasExplicitRange = isValidRange(
      nextProps.leftBoundaryTimeOverride,
      nextProps.rightBoundaryTimeOverride,
    );
    if (
      hasExplicitRange
      && (
        nextProps.leftBoundaryTimeOverride
          !== previousProps.leftBoundaryTimeOverride
        || nextProps.rightBoundaryTimeOverride
          !== previousProps.rightBoundaryTimeOverride
      )
    ) {
      this.cancelViewportAnimation();
      this.cancelTouchInertia();
      this.viewportTraceId = String(nextProps.trace_id);
      this.setTimelineState({
        leftBoundaryTime: nextProps.leftBoundaryTimeOverride,
        rightBoundaryTime: nextProps.rightBoundaryTimeOverride,
      });
    }

    const hasSavedRange = isValidRange(this.leftBoundaryTime, this.rightBoundaryTime);
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
      this.cancelViewportAnimation();
      this.cancelTouchInertia();
      this.viewportTraceId = String(nextProps.trace_id);
      this.setTimelineState({
        leftBoundaryTime: nextProps.minTime!,
        rightBoundaryTime: Math.max(nextProps.maxTime!, Date.now())
          + MAX_TIME_INTO_FUTURE,
      });
    }

    persistCollapsedThreadState(nextProps.trace_id, nextProps.threads);
  }

  handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    const surface = this.eventSurface(e.target);
    const rect = surface?.getBoundingClientRect();
    const width = rect?.width ?? this.state.width;
    if (!(width > 0)) return;
    const offsetX = rect ? e.clientX - rect.left : e.nativeEvent.offsetX;
    const zoomCenterTime = pixelsToTime(
      offsetX, this.leftBoundaryTime, this.rightBoundaryTime, width,
    );
    if (e.getModifierState('Shift')) {
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      this.pan(0, delta, width);
    } else if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
      this.pan(e.deltaX, 0, width);
    } else {
      this.zoom(e.deltaY, offsetX, zoomCenterTime, width);
    }
  };

  drawChildren = () => {
    const { leftBoundaryTime, rightBoundaryTime } = this.getVisibleTimeRange();
    if (!isValidTime(leftBoundaryTime) || !isValidTime(rightBoundaryTime) || !isValidRange(leftBoundaryTime, rightBoundaryTime)) return;

    if (!isValidRange(this.leftBoundaryTime, this.rightBoundaryTime)) {
      this.setTimelineState({ leftBoundaryTime, rightBoundaryTime });
    }

    this.drawListeners.forEach(draw => draw(leftBoundaryTime, rightBoundaryTime));
    if (this.flameChart.current) this.topOffset = this.flameChart.current.appliedTopOffset;
    this.writeViewportDataset();
  };

  /* 💁 mostly borrowed from chrome devtools-frontend ❤️ */
  getVisibleTimeRange = (props = this.props) => {
    const savedRangeIsValid = isValidRange(this.leftBoundaryTime, this.rightBoundaryTime);
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
    width = this.state.width,
  ): DividerData {
    const clientWidth = width;
    if (!isValidRange(leftBoundaryTime, rightBoundaryTime)
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
        position: Math.floor(timeToPixels(time, leftBoundaryTime, rightBoundaryTime, clientWidth)),
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
        position: Math.floor(timeToPixels(time, leftBoundaryTime, rightBoundaryTime, clientWidth)),
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

  zoomTo(timePeriod: ZoomPeriod | ''): void {
    this.viewportTraceId = String(this.props.trace_id);
    const now = Date.now();
    let target: { leftBoundaryTime: number; rightBoundaryTime: number } | null = null;

    switch (timePeriod) {
      // shows about the last 10 minutes
      case 'now':
        target = {
          leftBoundaryTime: now - 10 * MINUTE,
          rightBoundaryTime: now + MAX_TIME_INTO_FUTURE,
        };
        break;
      case 'hour':
        target = {
          leftBoundaryTime: now - 60 * MINUTE,
          rightBoundaryTime: now + MAX_TIME_INTO_FUTURE,
        };
        break;
      case 'day':
        target = {
          leftBoundaryTime: now - DAY,
          rightBoundaryTime: now + MAX_TIME_INTO_FUTURE,
        };
        break;
      case 'week':
        target = {
          leftBoundaryTime: now - WEEK,
          rightBoundaryTime: now + MAX_TIME_INTO_FUTURE,
        };
        break;
      case 'month':
        target = {
          leftBoundaryTime: now - MONTH,
          rightBoundaryTime: now + MAX_TIME_INTO_FUTURE,
        };
        break;
      case 'year':
        target = {
          leftBoundaryTime: now - 12 * MONTH,
          rightBoundaryTime: now + MAX_TIME_INTO_FUTURE,
        };
        break;
      case 'all':
        if (isValidTime(this.props.minTime)) {
          target = {
            leftBoundaryTime: this.props.minTime,
            rightBoundaryTime: now + MAX_TIME_INTO_FUTURE,
          };
        }
        break;
      default:
        break;
    }
    if (target && isValidTime(target.leftBoundaryTime) && isValidTime(target.rightBoundaryTime)) {
      this.animateToTimeRange(target);
    }
  }

  cancelViewportAnimation = (): void => {
    if (this.viewportAnimationFrame === null) return;
    cancelAnimationFrame(this.viewportAnimationFrame);
    this.viewportAnimationFrame = null;
  };

  animateToTimeRange = (target: {
    leftBoundaryTime: number;
    rightBoundaryTime: number;
  }): void => {
    this.cancelTouchInertia();
    this.cancelViewportAnimation();
    const visible = this.getVisibleTimeRange();
    if (
      !isValidTime(visible.leftBoundaryTime)
      || !isValidTime(visible.rightBoundaryTime)
      || prefersReducedTimelineMotion()
    ) {
      this.setTimelineState(target);
      this.drawChildren();
      return;
    }

    const from = {
      leftBoundaryTime: visible.leftBoundaryTime,
      rightBoundaryTime: visible.rightBoundaryTime,
    };
    const panEasing = piecewiseBezier(parsePresetZoomCurve(this.props.presetPanCurve));
    const zoomEasing = piecewiseBezier(parsePresetZoomCurve(this.props.presetZoomCurve));
    let startedAt: number | null = null;
    const drawFrame = (timestamp: number) => {
      startedAt ??= timestamp;
      const progress = Math.min(1, (timestamp - startedAt) / this.props.presetZoomDurationMs);
      const frame = interpolateTimelineTimeRange(
        from,
        target,
        progress,
        panEasing,
        zoomEasing,
      );
      this.leftBoundaryTime = frame.leftBoundaryTime;
      this.rightBoundaryTime = frame.rightBoundaryTime;
      this.drawChildren();

      if (progress < 1) {
        this.viewportAnimationFrame = requestAnimationFrame(drawFrame);
      } else {
        this.viewportAnimationFrame = null;
        this.setTimelineState(target);
      }
    };

    this.viewportAnimationFrame = requestAnimationFrame(drawFrame);
  };

  zoom = (dy: number, offsetX: number, zoomCenterTime: number, canvasWidth: number): void => {
    this.cancelTouchInertia();
    this.cancelViewportAnimation();
    this.viewportTraceId = String(this.props.trace_id);

    const { leftBoundaryTime, rightBoundaryTime } = zoom(
      dy,
      offsetX,
      zoomCenterTime,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      canvasWidth,
      Date.now(),
      // The first activity determines the initial view, not the earliest navigable time.
      Number.NEGATIVE_INFINITY,
    );

    this.setTimelineState({
      leftBoundaryTime,
      rightBoundaryTime,
    });
  };

  pan = (dx: number, dy: number, canvasWidth: number, cancelInertia = true): void => {
    if (cancelInertia) this.cancelTouchInertia();
    this.cancelViewportAnimation();
    this.viewportTraceId = String(this.props.trace_id);
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
      Number.NEGATIVE_INFINITY,
      maxTopOffset,
    );

    this.setTimelineState({
      leftBoundaryTime,
      rightBoundaryTime,
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
    leftBoundaryTime: number;
    rightBoundaryTime: number;
    topOffset: number;
  }>): void => {
    Object.assign(this, state);
    this.writeViewportDataset();
    this.scheduleDrawChildren();
    if (this.mounted) scheduleIdleCallback(() => { if (this.mounted) this.setLocalStorage(); });
  };

  // Persist navigation at most once per second without routing animation frames through Redux.
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
    return (
      <TimelineContext.Provider value={{ controller: this, props: this.props }}>
        <WithEventListeners
          node={document}
          eventListeners={[
            ['keydown', this.onTimelineKeyDown],
            ['keyup', this.onTimelineKeyUp],
          ]}
        >
          {() => (
            <>
              <Measure bounds onResize={({ bounds }) => {
                if (bounds.width !== this.state.width || bounds.height !== this.state.height) {
                  this.setState({ width: bounds.width, height: bounds.height });
                }
              }}>
                {({ measureRef }) => (
                  <div
                    ref={element => { measureRef(element); this.setTimelineSurface(element); }}
                    data-timeline-surface="true"
                    style={{ position: 'relative', height: '100%', touchAction: 'none' }}
                    onWheel={this.handleWheel}
                  >
                    {this.props.children}
                  </div>
                )}
              </Measure>
              {this.state.composingZoomChord && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, padding: '3px 6px',
                  borderRadius: '0 4px 0 0', background: 'rgba(255, 255, 255, 0.82)', zIndex: 10 }}>
                  Zoom to... (Waiting for second key of chord) {this.state.zoomChord} {this.state.zoomChordMultiplier} hours ago
                </div>
              )}
            </>
          )}
        </WithEventListeners>
      </TimelineContext.Provider>
    );
  }
}

export default TimelineController;
