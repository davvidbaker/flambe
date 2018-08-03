import React, { Component } from 'react';
import SplitPane from 'react-split-pane';
import throttle from 'lodash/throttle';
import filter from 'lodash/fp/filter';
import last from 'lodash/last';

import WithDropTarget from '../containers/WithDropTarget';
import { MAX_TIME_INTO_FUTURE } from '../constants/defaultParameters';
import {
  visibleThreadLevels,
  rankThreadsByAttention,
  timeToPixels,
  pixelsToTime
} from '../utilities/timelineChart';
import { layout } from '../styles';
import zoom from '../utilities/zoom';
import pan from '../utilities/pan';
import type { Activity } from '../types/Activity';

import WithEventListeners from './WithEventListeners';
import ThreadDetail from './ThreadDetail';
import ActivityDetail from './ActivityDetail';
import TimeSeries from './TimeSeries';
import FlameChart from './FlameChart';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 4 * WEEK; // ⚠️ not a real month

const MIN_GRID_SLICE_PX = 60;

// minTime is smallest timestamp in the entire timeline
// maxTime is largest timestamp in the entire timeline
// leftBoundaryTime is timestamp of left bound of current view
// rightBoundaryTime is timestamp of right bound of current view

type Thread = {
  id: string,
  name: string,
  __typename: 'Thread',
  activities: (?Activity)[],
  dividersData: { offsets: { position: number, time: number }[] }
};

type Props = {
  trace_id: string,
  minTime: number,
  maxTime: number,
  focusedBlockActivity_id: ?string,
  activities: { [string]: Activity },
  threads: (?Thread)[],
  toggleThread: () => mixed
};

type State = {
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  topOffset: number,
  threadModal_id: ?number,
  timeSeriesHeight: number,
  zoomChord: string,
  zoomChordMultiplier: number
};

class Timeline extends Component<Props, State> {
  state = {
    leftBoundaryTime: Date.now() - WEEK,
    rightBoundaryTime: Date.now(),
    topOffset: 0,
    dividersData: {
      offsets: []
    },
    composingZoomChord: false,
    timeSeriesHeight: 100,
    zoomChord: '',
    zoomChordMultiplier: 1
  };

  constructor(props) {
    super(props);

    const savedTimes = {
      lbt: localStorage.getItem('lbt'),
      rbt: localStorage.getItem('rbt')
    };
    const lbt = savedTimes.lbt && Number.parseFloat(savedTimes.lbt);
    const rbt = savedTimes.rbt && Number.parseFloat(savedTimes.rbt);

    if (lbt && rbt) {
      this.state.leftBoundaryTime = lbt;
      this.state.rightBoundaryTime = rbt;
    }

    this.state.dividersData = this.calculateGridOffsets();

    props.addCommand({
      action: command => {
        console.log(`command`, command);
        this.zoomTo(command.timePeriod);
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
            { name: 'the last month', value: 'month' }
          ],
          itemStringKey: 'name',
          itemReturnKey: 'value'
        }
      ]
    });
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.leftBoundaryTime !== this.props.leftBoundaryTime ||
      nextProps.rightBoundaryTime !== this.props.rightBoundaryTime
    ) {
      this.setState({
        leftBoundaryTime: nextProps.leftBoundaryTime,
        rightBoundaryTime: nextProps.rightBoundaryTime
      });
    }
  }

  /* 💁 mostly borrowed from chrome devtools-frontend ❤️ */
  calculateGridOffsets() {
    const clientWidth = this.t ? this.t.clientWidth : window.innerWidth;
    //
    const zeroTime = 0;

    const { leftBoundaryTime, rightBoundaryTime } = this.state;

    const boundarySpan = rightBoundaryTime - leftBoundaryTime;

    // calculator.computePosition(rightBoundaryTime);
    let dividersCount = clientWidth / MIN_GRID_SLICE_PX;
    let gridSliceTime = boundarySpan / dividersCount;
    const pixelsPerTime = clientWidth / boundarySpan;

    // Align gridSliceTime to a nearest round value.
    // We allow spans that fit into the formula: span = (1|2|5)x10^n,
    // e.g.: ...  .1  .2  .5  1  2  5  10  20  50  ...
    // After a span has been chosen make grid lines at multiples of the span.

    const logGridSliceTime = Math.ceil(Math.log(gridSliceTime) / Math.LN10);
    gridSliceTime = 10 ** logGridSliceTime;
    if (gridSliceTime * pixelsPerTime >= 5 * MIN_GRID_SLICE_PX) {
      gridSliceTime /= 5;
    }
    if (gridSliceTime * pixelsPerTime >= 2 * MIN_GRID_SLICE_PX) {
      gridSliceTime /= 2;
    }

    const firstDividerTime =
      Math.ceil((leftBoundaryTime - zeroTime) / gridSliceTime) * gridSliceTime +
      zeroTime;
    let lastDividerTime = rightBoundaryTime;
    // Add some extra space past the right boundary as the rightmost divider label text
    // may be partially shown rather than just pop up when a new rightmost divider gets into the view.
    lastDividerTime += MIN_GRID_SLICE_PX / pixelsPerTime;
    dividersCount = Math.ceil((lastDividerTime - firstDividerTime) / gridSliceTime);

    if (!gridSliceTime) dividersCount = 0;

    const offsets = [];
    for (let i = 0; i < dividersCount; ++i) {
      const time = firstDividerTime + gridSliceTime * i;
      offsets.push({
        position: Math.floor(this.timeToPixels(time)),
        time
      });
    }

    return {
      offsets,
      precision: Math.max(
        0,
        -Math.floor(Math.log(gridSliceTime * 1.01) / Math.LN10)
      )
    };
  }

  timeToPixels(timestamp) {
    const { leftBoundaryTime, rightBoundaryTime } = this.state;

    return timeToPixels(
      timestamp,
      leftBoundaryTime,
      rightBoundaryTime,
      this.t ? this.t.clientWidth : window.innerWidth
    );
  }

  zoomTo(timePeriod) {
    switch (timePeriod) {
      // shows about the last 10 minutes
      case 'now':
        this.setState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 10 * MINUTE,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE
        });
        break;
      case 'hour':
        this.setState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 60 * MINUTE,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE
        });
      case 'day':
        this.setState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 1 * DAY,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE
        });
        break;
      case 'week':
        this.setState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 1 * WEEK,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE
        });
        break;
      case 'month':
        this.setState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 1 * MONTH,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE
        });
        break;
      case 'year':
        this.setState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: Date.now() - 12 * MONTH,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE
        });
        break;
      case 'all':
        this.setState({
          dividersData: this.calculateGridOffsets(),
          leftBoundaryTime: this.props.minTIme,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE
        });
      default:
        break;
    }
  }

  zoom = (dy, offsetX, zoomCenterTime, canvasWidth) => {
    const dividersData = this.calculateGridOffsets();

    const { leftBoundaryTime, rightBoundaryTime } = zoom(
      dy,
      offsetX,
      zoomCenterTime,
      this.state.leftBoundaryTime,
      this.state.rightBoundaryTime,
      canvasWidth,
      Date.now(),
      this.props.minTime
    );

    this.setState(
      {
        dividersData,
        leftBoundaryTime,
        rightBoundaryTime
      },
      this.setLocalStorage
    );
  };

  pan = (dx, dy, canvasWidth) => {
    const dividersData = this.calculateGridOffsets();
    const { leftBoundaryTime, rightBoundaryTime, topOffset } = pan(
      dx,
      this.props.shiftModifier && dy,
      this.state.leftBoundaryTime,
      this.state.rightBoundaryTime,
      canvasWidth,
      this.state.topOffset,
      Date.now(),
      this.props.minTime
    );

    this.setState(
      {
        leftBoundaryTime,
        rightBoundaryTime,
        topOffset,
        dividersData
      },
      this.setLocalStorage
    );
  };

  showThreadDetail = (id: number) => {
    this.setState({ threadModal_id: id });
  };

  closeThreadDetail = () => {
    this.setState({ threadModal_id: null });
  };

  handlePaneChange = (size: number) => {
    this.setState({ timeSeriesHeight: `${size}px` });
    console.log(`🔥size`, size);
  };

  /**
   * 💁 I didn't want left and right boundary times to be part of redux, because they were changing too fast for a super silky smooth animation, but I did want them to persist through reloads. So, when this component will mount, if they exist in localStorage, they will take that initial value. They are then set in localStorage at most once a second.
   *
   */
  setLocalStorage = throttle(() => {
    if (
      typeof this.state.leftBoundaryTime === 'number' &&
      this.state.leftBoundaryTime !== NaN &&
      typeof this.state.rightBoundaryTime === 'number' &&
      this.state.rightBoundaryTime !== NaN
    ) {
      localStorage.setItem('lbt', this.state.leftBoundaryTime);
      localStorage.setItem('rbt', this.state.rightBoundaryTime);
    }
  }, 1000);

  render() {
    const props = this.props;
    const focusedActivity =
      props.focusedBlockActivity_id &&
      props.activities[props.focusedBlockActivity_id];

    const rightBoundaryTime = this.state.rightBoundaryTime || props.maxTime;
    const leftBoundaryTime = this.state.leftBoundaryTime || props.minTime;

    let threads = Array.isArray(props.threads)
      ? {}
      : props.settings.attentionDrivenThreadOrder
        ? rankThreadsByAttention(props.attentionShifts, props.threads)
        : props.threads;

    threads = Object.entries(props.activities).reduce(
      (acc, [_id, activity]) =>
        (activity.status === 'suspended'
          ? {
            ...acc,
            [activity.thread_id]: {
              ...acc[activity.thread_id],
              suspendedActivityCount:
                  acc[activity.thread_id].suspendedActivityCount + 1 || 1
            }
          }
          : acc),
      threads
    );

    return (
      <WithEventListeners
        node={document}
        eventListeners={[
          [
            'keyup',
            e => {
              if (e.target.nodeName !== 'INPUT') {
                if (this.state.composingZoomChord) {
                  if (this.state.zoomChord.length === 0) {
                    let zoomChord = '';
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
                    console.log(`🔥e.key`, e.key, Number(e.key));
                    this.setState({ zoomChordMultiplier: Number(e.key) });
                    this.setState({ composingZoomChord: false });
                  } else {
                    this.setState({
                      composingZoomChord: false,
                      zoomChord: '',
                      zoomChordMultiplier: 1
                    });
                  }
                } else if (e.key === 'n') {
                  this.zoomTo('now');
                } else if (e.key === 'z') {
                  this.setState({ composingZoomChord: true });
                }
              }
            }
          ]
        ]}
      >
        {() => (
          <>
            <div
              ref={t => {
                this.t = t;
              }}
              style={{
                position: 'relative',
                height: `calc(${window.innerHeight}px - ${layout.headerHeight})`
              }}
            >
              <SplitPane
                split="horizontal"
                size={100}
                onChange={this.handlePaneChange}
              >
                <TimeSeries
                  leftBoundaryTime={leftBoundaryTime}
                  rightBoundaryTime={rightBoundaryTime}
                  searchTerms={props.searchTerms}
                  mantras={props.mantras}
                  tabs={filter(({ timestamp }) =>
                    timestamp > leftBoundaryTime &&
                      timestamp < rightBoundaryTime)(props.tabs)}
                  height={this.state.timeSeriesHeight}
                />
                {/* <WithDropTarget
                targetName="flame-chart"
                threads={props.threads}
                trace_id={props.trace_id}
              > */}
                <FlameChart
                  activities={props.activities}
                  activityMute={props.settings.activityMute}
                  activityMuteOpactiy={props.settings.activityMuteOpacity}
                  dividersData={this.state.dividersData}
                  uniformBlockHeight={props.settings.uniformBlockHeight}
                  attentionShifts={props.attentionShifts}
                  blocks={props.blocks}
                  categories={props.categories}
                  currentAttention={last(props.attentionShifts).thread_id}
                  leftBoundaryTime={leftBoundaryTime}
                  maxTime={props.maxTime}
                  minTime={props.minTime}
                  modifiers={props.modifiers}
                  pan={this.pan}
                  rightBoundaryTime={rightBoundaryTime}
                  showAttentionFlows={props.settings.attentionFlows}
                  showThreadDetail={this.showThreadDetail}
                  showSuspendResumeFlows={props.settings.suspendResumeFlows}
                  // threadLevels={props.threadLevels}
                  threadLevels={
                    props.activities && props.settings.reactiveThreadHeight
                      ? visibleThreadLevels(
                        props.blocks,
                        props.activities,
                        leftBoundaryTime,
                        rightBoundaryTime,
                        props.threads
                      )
                      : props.threadLevels
                  }
                  hoverBlock={props.hoverBlock}
                  focusBlock={props.focusBlock}
                  focusedBlockIndex={props.focusedBlockIndex}
                  hoveredBlockIndex={props.hoveredBlockIndex}
                  threads={threads}
                  toggleThread={props.toggleThread}
                  topOffset={this.state.topOffset || 0}
                  updateEvent={props.updateEvent}
                  zoom={this.zoom}
                />
              </SplitPane>
              {/* </WithDropTarget> */}

              {/* ⚠️ Moved these up? */}
              <ThreadDetail
                closeThreadDetail={this.closeThreadDetail}
                id={this.state.threadModal_id}
                name={
                  this.state.threadModal_id &&
                  props.threads[this.state.threadModal_id].name
                }
                activities={props.activities}
              />
              {props.focusedBlockActivity_id && (
                <ActivityDetail
                  activity={{
                    id: props.focusedBlockActivity_id,
                    ...focusedActivity
                  }}
                  activityBlocks={props.blocks.filter(block => block.activity_id === props.focusedBlockActivity_id)}
                  categories={props.categories}
                  updateActivity={props.updateActivity}
                  trace_id={props.trace_id}
                  threadLevels={props.threadLevels}
                  submitCommand={props.submitCommand}
                />
              )}
            </div>
            {this.state.composingZoomChord && (
              <div style={{ position: 'fixed', bottom: 0, left: 0 }}>
                Zoom to... (Waiting for second key of chord){' '}
                {this.state.zoomChord} {this.state.zoomChordMultiplier} hours
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
