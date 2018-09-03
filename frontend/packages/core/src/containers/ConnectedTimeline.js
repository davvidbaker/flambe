import { connect } from 'react-redux';

import Timeline from '../components/Timeline';
import {
  getTimeline,
  getTimelineWithFiltersApplied,
} from '../reducers/timeline';
import { getUser } from '../reducers/user';
import {
  createThread,
  collapseThread,
  expandThread,
  focusBlock,
  hoverBlock,
  updateActivity,
  updateEvent,
} from '../actions';

export default connect(
  state => ({
    activities: getTimelineWithFiltersApplied(state).activities,
    blocks: getTimelineWithFiltersApplied(state).blocks,
    categories: getUser(state).categories,
    focusedBlockActivity_id: getTimelineWithFiltersApplied(state)
      .focusedBlockActivity_id,
    focusedBlockIndex: getTimelineWithFiltersApplied(state).focusedBlockIndex,
    hoveredBlockIndex: getTimelineWithFiltersApplied(state).hoveredBlockIndex,
    mantras: getUser(state).mantras,
    minTime: getTimelineWithFiltersApplied(state).minTime,
    maxTime: getTimelineWithFiltersApplied(state).maxTime,
    modifiers: state.modifiers,
    threadLevels: getTimelineWithFiltersApplied(state).threadLevels,
    threads: getTimelineWithFiltersApplied(state).threads,
    lastCategory_id: getTimelineWithFiltersApplied(state).lastCategory_id,
    lastThread_id: getTimelineWithFiltersApplied(state).lastThread_id,
    attentionShifts: getUser(state).attentionShifts,
    searchTerms: getUser(state).searchTerms,
    settings: state.settings,
    tabs: getUser(state).tabs,

    // these are only used for overrides.
    leftBoundaryTime: getTimeline(state).leftBoundaryTime,
    rightBoundaryTime: getTimeline(state).rightBoundaryTime,
  }),
  dispatch => ({
    createThread: (name, rank) => dispatch(createThread(name, rank)),
    toggleThread: (id, isCollapsed = false) =>
      dispatch(isCollapsed ? expandThread(id) : collapseThread(id)),
    updateActivity: (id, updates) => dispatch(updateActivity(id, updates)),
    updateEvent: (id, updates) => dispatch(updateEvent(id, updates)),
    focusBlock: ({ index, activity_id, activityStatus, thread_id }) =>
      dispatch(
        focusBlock({
          index,
          activity_id,
          activityStatus,
          thread_id,
        }),
      ),
    hoverBlock: index => dispatch(hoverBlock(index)),
  }),
)(Timeline);
