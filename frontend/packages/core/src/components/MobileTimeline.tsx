import * as React from 'react';
import styled from 'styled-components';
import AppModal from './AppModal';
import ActivityDetailModal from './ActivityDetailModal';
import MobileLimbo from './MobileLimbo';
import { TimelineFlameChart } from './TimelineFlameChart';
import { TimelineTimeSeries } from './TimelineTimeSeries';
import { useTimelineContext } from './TimelineContext';
import { mobileStack } from '../utilities/mobileStack';
import { limboItems } from '../utilities/limbo';
import type { EntityId } from '../types/ids';

const Shell = styled.div`
  height: 100%; min-height: 0; display: flex; flex-direction: column;
  background: #f7f6f3; color: #292722; font-family: sans-serif;
  button { min-height: 44px; border: 1px solid #d9d6d0; border-radius: 8px;
    background: white; padding: 8px 12px; color: inherit; font: inherit; cursor: pointer; }
  button:focus-visible { outline: 2px solid #a65e12; outline-offset: 2px; }
  button[aria-pressed='true'] { background: #fbe6b4; border-color: #aa741f; }
  h2 { font-size: 18px; margin: 0; overflow-wrap: anywhere; }
  p { color: #736f65; font-size: 13px; }
`;
const Toolbar = styled.nav`
  display: flex; gap: 6px; padding: 8px; flex: none; border-bottom: 1px solid #ddd9d0;
  button { flex: 1; min-width: 0; padding: 8px 6px; font-size: 13px; }
`;
const Scroll = styled.div`
  overflow: auto; min-height: 0; flex: 1; padding: 16px;
  touch-action: pan-y; overscroll-behavior: contain;
`;
const ThreadCard = styled.button`
  display: flex; flex-direction: column; gap: 7px; text-align: left; width: 100%;
  margin: 8px 0; overflow-wrap: anywhere;
  small { color: #716c61; font-size: 12px; }
  span { font-size: 13px; }
`;
const StackRow = styled.div`
  border-left: 2px solid #d7b56d; padding-left: 10px; margin: 10px 0;
  button { text-align: left; width: 100%; overflow-wrap: anywhere; }
  small { display: block; margin-bottom: 5px; color: #716c61; font-size: 11px; }
`;

/** Phone presentation of the same coordinated viewport; history keeps the production chart and gestures. */
export default function MobileTimeline() {
  const { controller, props } = useTimelineContext();
  const [threadId, setThreadId] = React.useState<EntityId | null>(null);
  const [history, setHistory] = React.useState(false);
  const [showSeries, setShowSeries] = React.useState(false);
  const [limboOpen, setLimboOpen] = React.useState(false);
  React.useEffect(() => { setThreadId(null); setHistory(false); setLimboOpen(false); }, [props.trace_id]);
  const threads = Object.values(props.threads).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const thread = threadId == null ? undefined : props.threads[String(threadId)];
  const rows = thread ? mobileStack(props.activities, thread.id) : [];
  const pending = limboItems(props.activities).length;
  const selectActivity = (id: EntityId) => {
    const activity = props.activities[String(id)];
    props.focusBlock({ index: null, activity_id: id, activityStatus: activity?.status,
      thread_id: activity?.thread_id ?? null });
    setLimboOpen(false);
    props.showActivityDetails();
  };
  const zoomStack = () => {
    const ids = new Set(rows.map(row => String(row.activity.id)));
    const blocks = props.blocks.filter(block => ids.has(String(block.activity_id)) && !block.scheduled);
    setHistory(true);
    if (!blocks.length) { controller.zoomTo('now'); return; }
    const left = Math.min(...blocks.map(block => block.startTime));
    const right = Math.max(...blocks.map(block => block.endTime ?? Date.now()));
    const padding = Math.max((right - left) * 0.1, 30_000);
    controller.topOffset = 0;
    controller.animateToTimeRange({ leftBoundaryTime: left - padding, rightBoundaryTime: right + padding });
  };

  return <Shell data-mobile-workspace="true">
    <Toolbar aria-label="Mobile workspace">
      <button type="button" aria-pressed={!history} onClick={() => setHistory(false)}>Threads</button>
      <button type="button" aria-pressed={history} onClick={() => setHistory(true)}>Timeline</button>
      <button type="button" onClick={() => setLimboOpen(true)}>Limbo · {pending}</button>
    </Toolbar>
    {history ? <>
      <Toolbar aria-label="Timeline controls" data-native-scroll="true">
        <button type="button" onClick={() => controller.zoomTo('now')}>Now</button>
        <button type="button" onClick={() => controller.zoomTo('day')}>Day</button>
        <button type="button" onClick={() => controller.zoomTo('all')}>All</button>
        <button type="button" aria-pressed={showSeries} onClick={() => setShowSeries(value => !value)}>Metrics</button>
      </Toolbar>
      {showSeries && <div style={{ height: 160, flex: 'none' }}><TimelineTimeSeries /></div>}
      <div style={{ flex: 1, minHeight: 0 }}><TimelineFlameChart /></div>
      <small style={{ padding: '6px 12px', color: '#736f65' }}>Drag to pan · Pinch to zoom · Tap an activity for details</small>
    </> : <Scroll data-native-scroll="true">
      {thread ? <>
        <button type="button" onClick={() => setThreadId(null)}>← All threads</button>
        <h2 style={{ marginTop: 16 }}>{thread.name}</h2>
        <p>Active stack · {rows.filter(row => row.activity.status === 'active').length} running</p>
        {rows.length === 0 ? <p>No running activities. Explore the timeline or pick something from Limbo.</p> :
          <section aria-label="Active stack">{rows.map(({ activity, depth }) => <StackRow
            key={activity.id} style={{ marginLeft: Math.min(depth, 4) * 12 }}>
            <button type="button" onClick={() => selectActivity(activity.id)}>
              <small>{depth === 0 ? 'Root' : `Level ${depth + 1}`} · {activity.status}</small>{activity.name}
            </button>
          </StackRow>)}</section>}
        <button type="button" onClick={zoomStack}>Explore stack in timeline</button>
      </> : <>
        <h2>Threads</h2><p>What’s running, and where your attention can go next.</p>
        {threads.length === 0 && <p>No threads match the current filter.</p>}
        {threads.map(item => {
          const stack = mobileStack(props.activities, item.id);
          const active = stack.filter(row => row.activity.status === 'active');
          return <ThreadCard type="button" key={item.id} onClick={() => setThreadId(item.id)}>
            <strong>{item.name}</strong><small>{active.length ? `${active.length} running` : 'Idle'}</small>
            {active.length > 0 && <span>{active.at(-1)!.activity.name}</span>}
          </ThreadCard>;
        })}
      </>}
    </Scroll>}
    <AppModal contentLabel="Limbo" fullScreenOnMobile isOpen={limboOpen} onRequestClose={() => setLimboOpen(false)}
      chrome={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Limbo · {pending}</h2>
        <button type="button" style={{ minHeight: 44 }} onClick={() => setLimboOpen(false)}>Done</button>
      </div>}>
      <MobileLimbo activities={props.activities} categories={props.categories} threads={props.threads}
          beginActivity={props.beginActivity ?? (() => undefined)} deleteActivity={props.deleteActivity ?? (() => undefined)}
          focusActivity={selectActivity} planInLimbo={props.planActivityInLimbo} updateActivity={props.updateActivity} />
    </AppModal>
    {!history && <ActivityDetailModal blocks={props.blocks} activities={props.activities} submitCommand={props.submitCommand} />}
  </Shell>;
}
