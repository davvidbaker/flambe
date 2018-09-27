import * as React from 'react';
import SplitPane from 'react-split-pane';
import throttle from 'lodash/throttle';
import filter from 'lodash/fp/filter';
import last from 'lodash/last';
import Measure from 'react-measure';

import WithDropTarget from '../containers/WithDropTarget';
import { MAX_TIME_INTO_FUTURE } from '../constants/defaultParameters';
import {
  rankThreadsByAttention,
  timeToPixels,
  pixelsToTime,
} from '../utilities/timelineChart';
import { layout } from '../styles';
import zoom from '../utilities/zoom';
import pan from '../utilities/pan';
import type { Activity } from '../types/Activity';

import WithEventListeners from './WithEventListeners';
import ThreadDetail from './ThreadDetail';
import ActivityDetailModal from './ActivityDetailModal';
import TimeSeries from './TimeSeries';
import FlameChart from './FlameChart';
import Tooltip from './Tooltip';
import FocusedBlock from './FocusedBlock';

import { SECOND, MINUTE, HOUR, DAY, WEEK, MONTH } from '../utilities/time';
import {
  loadSuspendedActivityCount,
  blocksForActivity,
} from '../utilities/timeline';

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
  dividersData: { offsets: { position: number, time: number }[] },
};

type Props = {
  trace_id: string,
  minTime: number,
  maxTime: number,
  focusedBlockActivity_id: ?string,
  activities: { [string]: Activity },
  threads: (?Thread)[],
  toggleThread: () => mixed,
};

type State = {
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  topOffset: number,
  threadModal_id: ?number,
  timeSeriesHeight: number,
  zoomChord: string,
  zoomChordMultiplier: number,
};

class Timeline extends React.Component<Props, State> {
  state = {
    dividersData: {
      offsets: [],
    },
    composingZoomChord: false,
    timeSeriesHeight: 100,
    zoomChord: '',
    zoomChordMultiplier: 1,
  };

  constructor(props) {
    super(props);

    this.flameChart = React.createRef();
    this.timeSeries = React.createRef();
    this.tooltip = React.createRef();
    this.focusedBlock = React.createRef();

    const savedTimes = {
      lbt: localStorage.getItem('lbt'),
      rbt: localStorage.getItem('rbt'),
    };
    const leftBoundaryTime =
      savedTimes.lbt && Number.parseFloat(savedTimes.lbt);
    const rightBoundaryTime =
      savedTimes.rbt && Number.parseFloat(savedTimes.rbt);
    const dividersData = this.calculateGridOffsets();

    this.setTimelineState({
      ...(leftBoundaryTime ? { leftBoundaryTime } : {}),
      ...(rightBoundaryTime ? { rightBoundaryTime } : {}),
      dividersData,
    });

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
            { name: 'the last month', value: 'month' },
          ],
          itemStringKey: 'name',
          itemReturnKey: 'value',
        },
      ],
    });
  }

  componentDidMount() {
    requestAnimationFrame(this.drawChildren.bind(this));
  }

  componentWillReceiveProps(nextProps) {
    // console.log(`🔥  nextProps, this.props`, nextProps, this.props);
    // for (let a in nextProps) {
    //   console.log(
    //     `🔥 ${a} `,
    //     JSON.stringify(nextProps[a]) === JSON.stringify(this.props[a]),
    //   );
    // }
    /* ⚠️ I need to figure out a better way to trigger a draw when an external event has changed boundary time... 
    
    Maybe I don't let that happen exactly and instead expose Timeline ref to the higher ups.
    */
    // if (
    //   nextProps.leftBoundaryTimeOverride !==
    //     this.lastLeftBoundaryTimeOverride ||
    //   nextProps.rightBoundaryTimeOverride !== this.lastRightBoundaryTimeOverride
    // ) {
    //   console.log(
    //     `🔥  nextProps.rightBoundaryTimeOverride`,
    //     nextProps.rightBoundaryTimeOverride,
    //   );
    //   this.lastLeftBoundaryTimeOverride = nextProps.leftBoundaryTimeOverride;
    //   this.lastRightBoundaryTimeOverride = nextProps.rightBoundaryTimeOverride;
    //   this.setTimelineState({
    //     leftBoundaryTime: nextProps.leftBoundaryTimeOverride,
    //     rightBoundaryTime: nextProps.rightBoundaryTimeOverride,
    //   });
    //   requestAnimationFrame(this.drawChildren.bind(this));
    // }nnn
  }

  handleWheel = e => {
    e.preventDefault();
    const zoomCenterTime = pixelsToTime(
      e.nativeEvent.offsetX,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      this.state.width,
    );

    // pan around if holding shift or scroll was mostly vertical
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
      // props.pan just does left right panning of the timeline
      this.pan(e.deltaX, 0, this.state.width);

      requestAnimationFrame(this.drawChildren.bind(this));
    } else if (e.getModifierState('Shift')) {
      if (typeof e.deltaY === 'number') {
        /* ⚠️ probably should move this to timelinestate */
        // this.setState({ scrollTop: this.state.scrollTop + Number(e.deltaY) });
      }
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
    this.timeSeries.current.draw(
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      this.state.width,
    );
    this.flameChart.current.draw(
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      this.state.width,
      this.dividersData,
    );

    /* 💁 🤷‍♂️  */
    this.focusedBlock &&
      this.focusedBlock.current &&
      this.focusedBlock.current.forceUpdate();
  };

  /* 💁 mostly borrowed from chrome devtools-frontend ❤️ */
  calculateGridOffsets() {
    const clientWidth = this.state.width;
    //
    const zeroTime = 0;

    const leftBoundaryTime = this.leftBoundaryTime;
    const rightBoundaryTime = this.rightBoundaryTime;

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
    };
  }

  timeToPixels(timestamp) {
    const leftBoundaryTime = this.leftBoundaryTime;
    const rightBoundaryTime = this.rightBoundaryTime;

    return timeToPixels(
      timestamp,
      leftBoundaryTime,
      rightBoundaryTime,
      this.state.width,
    );
  }

  zoomTo(timePeriod) {
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
          leftBoundaryTime: this.props.minTIme,
          rightBoundaryTime: Date.now() + MAX_TIME_INTO_FUTURE,
        });
      default:
        break;
    }
    requestAnimationFrame(this.drawChildren.bind(this));
  }

  zoom = (dy, offsetX, zoomCenterTime, canvasWidth) => {
    const dividersData = this.calculateGridOffsets();

    const { leftBoundaryTime, rightBoundaryTime } = zoom(
      dy,
      offsetX,
      zoomCenterTime,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      canvasWidth,
      Date.now(),
      this.props.minTime,
    );

    this.setTimelineState({
      leftBoundaryTime,
      rightBoundaryTime,
      dividersData,
    });
  };

  pan = (dx, dy, canvasWidth) => {
    const dividersData = this.calculateGridOffsets();
    const { leftBoundaryTime, rightBoundaryTime, topOffset } = pan(
      dx,
      this.props.shiftModifier && dy,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      canvasWidth,
      this.topOffset,
      Date.now(),
      this.props.minTime,
    );

    this.setTimelineState({
      leftBoundaryTime,
      rightBoundaryTime,
      dividersData,
      topOffset,
    });
  };

  // avoiding react state for some stuff
  setTimelineState = state => {
    Object.entries(state).forEach(([key, val]) => {
      this[key] = val;
    });
    requestIdleCallback(this.setLocalStorage.bind(this));
  };

  showThreadDetail = (id: number) => {
    this.setState({ threadModal_id: id });
  };

  closeThreadDetail = () => {
    this.setState({ threadModal_id: null });
  };

  handlePaneChange = (size: number) => {
    console.log(`🔥  size`, size);
    if (this.state.timeSeriesHeight !== `${size}px`)
      this.setState({ timeSeriesHeight: `${size}px` });
  };

  /**
   * 💁 I didn't want left and right boundary times to be part of redux, because they were changing too fast for a super silky smooth animation, but I did want them to persist through reloads. So, when this component will mount, if they exist in localStorage, they will take that initial value. They are then set in localStorage at most once a second.
   *
   */
  setLocalStorage = throttle(() => {
    if (
      typeof this.leftBoundaryTime === 'number' &&
      this.leftBoundaryTime !== NaN &&
      typeof this.rightBoundaryTime === 'number' &&
      this.rightBoundaryTime !== NaN
    ) {
      localStorage.setItem('lbt', this.leftBoundaryTime);
      localStorage.setItem('rbt', this.rightBoundaryTime);
    }
  }, 1000);

  render() {
    const props = this.props;

    const rightBoundaryTime = this.rightBoundaryTime || props.maxTime;
    const leftBoundaryTime = this.leftBoundaryTime || props.minTime;

    let threads = Array.isArray(props.threads)
      ? {}
      : props.settings.attentionDrivenThreadOrder
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
                      zoomChordMultiplier: 1,
                    });
                  }
                } else if (e.key === 'n') {
                  this.zoomTo('now');
                } else if (e.key === 'z') {
                  this.setState({ composingZoomChord: true });
                }
              }
            },
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
                  contentRect.bounds.width !== this.state.width ||
                  contentRect.bounds.height !== this.state.height
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
                  ref={measureRef}
                  style={{
                    position: 'relative',
                    height: '100%',
                  }}
                  onWheel={this.handleWheel}
                >
                  <SplitPane
                    split="horizontal"
                    size={100}
                    onChange={this.handlePaneChange}
                  >
                    <TimeSeries
                      ref={this.timeSeries}
                      height={this.state.timeSeriesHeight}
                      // leftBoundaryTime={leftBoundaryTime}
                      mantras={props.mantras}
                      pan={this.pan}
                      // rightBoundaryTime={rightBoundaryTime}
                      searchTerms={props.searchTerms}
                      tabs={filter(
                        ({ timestamp }) =>
                          timestamp > leftBoundaryTime &&
                          timestamp < rightBoundaryTime,
                      )(props.tabs)}
                      zoom={this.zoom}
                    />
                    {/* <div>doh</div> */}
                    {/* <WithDropTarget
                targetName="flame-chart"
                threads={props.threads}
                trace_id={props.trace_id}
              > */}
                    <FlameChart
                      ref={this.flameChart}
                      activities={props.activities}
                      activityMute={props.settings.activityMute}
                      activityMuteOpactiy={props.settings.activityMuteOpacity}
                      uniformBlockHeight={props.settings.uniformBlockHeight}
                      attentionShifts={props.attentionShifts}
                      blocks={props.blocks}
                      categories={props.categories}
                      currentAttention={last(props.attentionShifts).thread_id}
                      // leftBoundaryTime={leftBoundaryTime}
                      maxTime={props.maxTime}
                      minTime={props.minTime}
                      modifiers={props.modifiers}
                      pan={this.pan}
                      reactiveThreadHeight={props.settings.reactiveThreadHeight}
                      // rightBoundaryTime={rightBoundaryTime}
                      showAttentionFlows={props.settings.attentionFlows}
                      showThreadDetail={this.showThreadDetail}
                      showSuspendResumeFlows={props.settings.suspendResumeFlows}
                      showSuspendResumeFlowsOnlyForFocusedActivity={
                        props.settings.suspendResumeFlowsOnlyForFocusedActivity
                      }
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
                  {/* </WithDropTarget> */}

                  {/* ⚠️ Moved these up? */}
                  {/* Probably want to lift FocusActivty and HoverActivity up so updating it doesn't cause entire re-render... */}
                  {this.flameChart &&
                    this.flameChart.current && [
                      <FocusedBlock
                        ref={this.focusedBlock}
                        yOffset={this.state.timeSeriesHeight}
                        flameChartRef={this.flameChart}
                      />,
                      <Tooltip
                        flameChartRef={this.flameChart}
                        yOffset={this.state.timeSeriesHeight}
                        activities={props.activities}
                        blocks={props.blocks}
                      />,
                    ]}
                  <ThreadDetail
                    closeThreadDetail={this.closeThreadDetail}
                    id={this.state.threadModal_id}
                    name={
                      this.state.threadModal_id &&
                      props.threads[this.state.threadModal_id].name
                    }
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
