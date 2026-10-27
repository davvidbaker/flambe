import * as React from 'react';
import TimelineController, { type TimelineProps } from './TimelineController';
import { TimelineFlameChart } from './TimelineFlameChart';
import { TimelineTimeSeries } from './TimelineTimeSeries';
import { useTimelineContext } from './TimelineContext';
import SplitPane from './SplitPane';
import LimboPane from './LimboPane';
import SwyzzleTraceOverlay from './SwyzzleTraceOverlay';
import { rankThreadsByAttention } from '../utilities/timelineGeometry';
import { loadSuspendedActivityCount } from '../utilities/timeline';
import type { EntityId } from '../types/ids';

export type { TimelineProps } from './TimelineController';

const limboCollapsedStorageKey = 'flambe.limbo.collapsed.v1';

function TimelineLayout() {
  const { controller, props } = useTimelineContext();
  const [timeSeriesHeight, setTimeSeriesHeight] = React.useState(100);
  const [limboCollapsed, setLimboCollapsed] = React.useState(() => {
    try { return window.localStorage.getItem(limboCollapsedStorageKey) === '1'; }
    catch { return false; }
  });
  const threads = loadSuspendedActivityCount(props.activities, props.attentionDrivenThreadOrder
    ? rankThreadsByAttention(props.attentionShifts, props.threads) : props.threads);
  const selectLimboActivity = (id: EntityId) => {
    const activity = props.activities[String(id)];
    props.focusBlock({ index: null, activity_id: id, activityStatus: activity?.status,
      thread_id: activity?.thread_id ?? null });
    props.showActivityDetails();
  };
  const limbo = <LimboPane activities={props.activities}
    beginActivity={props.beginActivity ?? (() => undefined)} categories={props.categories}
    collapsed={limboCollapsed} deleteActivity={props.deleteActivity ?? (() => undefined)}
    focusActivity={selectLimboActivity}
    onToggleCollapsed={() => setLimboCollapsed(previous => {
      const next = !previous;
      try { window.localStorage.setItem(limboCollapsedStorageKey, next ? '1' : '0'); } catch { /* Private mode. */ }
      return next;
    })}
    planInLimbo={props.planActivityInLimbo} threads={threads} updateActivity={props.updateActivity} />;

  return <>
    <SplitPane split="horizontal" size={timeSeriesHeight} onChange={setTimeSeriesHeight}>
      <TimelineTimeSeries />
      {limboCollapsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <div style={{ flex: '1 1 0', minHeight: 0 }}><TimelineFlameChart /></div>
          {limbo}
        </div>
      ) : (
        <SplitPane split="horizontal" primary="second"
          defaultSize={controller.state.width < 800 ? 120 : 180} minSize={120}>
          <TimelineFlameChart />
          {limbo}
        </SplitPane>
      )}
    </SplitPane>
    <SwyzzleTraceOverlay />
  </>;
}

/** Default app layout, or caller-provided panes coordinated by one viewport. */
export default function Timeline(props: TimelineProps) {
  return <TimelineController {...props}>
    {props.children === undefined ? <TimelineLayout /> : props.children}
  </TimelineController>;
}
