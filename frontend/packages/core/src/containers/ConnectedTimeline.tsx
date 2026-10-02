import { connect } from 'react-redux';
import type { Dispatch } from 'redux';

import Timeline from '../components/Timeline';
import type { TimelineProps } from '../components/Timeline';
import type { RootState } from '../rootReducer';
import type { EntityId } from '../types/ids';
import {
  getTimeline,
  getTimelineWithFiltersApplied,
} from '../reducers/timeline';
import { getUser } from '../reducers/user';
import {
  beginActivity,
  collapseThread,
  deleteActivity,
  expandThread,
  focusBlock,
  hoverBlock,
  planActivity,
  resumeActivity,
  showActivityDetails,
  updateActivity,
  updateEvent,
} from '../actions';

type StateProps = ReturnType<typeof mapStateToProps>;

function mapStateToProps(state: RootState) {
  const timeline = getTimelineWithFiltersApplied(state);
  return {
    activities: timeline.activities,
    blocks: timeline.blocks,
    categories: getUser(state).categories,
    mantras: getUser(state).mantras,
    observations: getUser(state).observations,
    minTime: timeline.minTime,
    maxTime: timeline.maxTime,
    modifiers: state.modifiers,
    threadLevels: timeline.threadLevels,
    threads: timeline.threads,
    lastCategory_id: timeline.lastCategory_id,
    lastThread_id: timeline.lastThread_id,
    attentionShifts: getUser(state).attentionShifts,
    searchTerms: getUser(state).searchTerms,
    absoluteTimeLabels: state.settings.absoluteTimeLabels,
    twelveHourClock: state.settings.twelveHourClock,
    attentionDrivenThreadOrder: state.settings.attentionDrivenThreadOrder,
    darkerAsWeGoDown: state.settings.darkerAsWeGoDown,
    rightAlignTimelineText: state.settings.rightAlignTimelineText,
    tabs: getUser(state).tabs,

    // these are only used for overrides.
    leftBoundaryTimeOverride: getTimeline(state).leftBoundaryTime,
    rightBoundaryTimeOverride: getTimeline(state).rightBoundaryTime,
    focusedBlockIndex: timeline.focusedBlockIndex,
    hoveredBlockIndex: timeline.hoveredBlockIndex,
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    toggleThread: (id: EntityId, isCollapsed = false) => dispatch(isCollapsed ? expandThread(id) : collapseThread(id)),
    updateEvent: (id: EntityId, updates: Record<string, unknown>) => dispatch(updateEvent(id, updates)),
    updateActivity: (id: EntityId, updates: Record<string, unknown>) => dispatch(updateActivity(id, updates)),
    beginActivity: (id: EntityId) => dispatch(beginActivity(id)),
    deleteActivity: (id: EntityId, threadId: EntityId) => dispatch(deleteActivity(id, threadId)),
    planActivity: (threadId: EntityId, time: number) => dispatch(planActivity({
      name: 'Scheduled',
      thread_id: threadId,
      scheduled_start: time,
    })),
    focusBlock: ({
      index, activity_id, activityStatus, thread_id,
    }: Parameters<TimelineProps['focusBlock']>[0]) => dispatch(
      focusBlock({
        index,
        activity_id,
        activityStatus,
        thread_id,
      }),
    ),
    hoverBlock: (index: number | string | null) => dispatch(hoverBlock(index)),
    showActivityDetails: () => dispatch(showActivityDetails()),
    dispatch,
  };
}

type DispatchProps = ReturnType<typeof mapDispatchToProps>;

function mergeProps(
  stateProps: StateProps,
  dispatchProps: DispatchProps,
  ownProps: Record<string, unknown>,
) {
  const { dispatch, ...restDispatch } = dispatchProps;
  return {
    ...ownProps,
    ...stateProps,
    ...restDispatch,
    dropLimboActivity: (id: EntityId, updates: Record<string, unknown>) => {
      const activity = stateProps.activities[String(id)];
      if (activity?.status !== 'suspended') {
        dispatch(updateActivity(id, updates));
        return;
      }

      const threadId = updates.thread_id as EntityId;
      const timestamp = Number(updates.scheduled_start_integer);
      dispatch(updateActivity(id, { thread_id: threadId }));
      dispatch(resumeActivity({ id, timestamp, thread_id: threadId }));
    },
    planActivityInLimbo: (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const threadId = stateProps.lastThread_id
        ?? (Object.values(stateProps.threads)[0] as { id?: EntityId } | undefined)?.id;
      if (threadId === undefined) return;
      dispatch(planActivity({
        name: trimmed,
        thread_id: threadId,
        scheduled_start: null,
        scheduled_end: null,
      }));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(Timeline);
