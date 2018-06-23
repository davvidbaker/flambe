import { connect } from 'react-redux';

import Timeline from '../components/Timeline';
import { getTimeline } from '../reducers/timeline';
import { getUser } from '../reducers/user';
import {
  createThread,
  collapseThread,
  expandThread,
  focusBlock,
  hoverBlock,
  updateActivity,
  updateEvent
} from '../actions';

export default connect(
  state => ({
    activities: getTimeline(state).activities,
    blocks: getTimeline(state).blocks,
    categories: getUser(state).categories,
    focusedBlockActivity_id: getTimeline(state).focusedBlockActivity_id,
    focusedBlockIndex: getTimeline(state).focusedBlockIndex,
    hoveredBlockIndex: getTimeline(state).hoveredBlockIndex,
    mantras: getUser(state).mantras,
    minTime: getTimeline(state).minTime,
    maxTime: getTimeline(state).maxTime,
    modifiers: state.modifiers,
    threadLevels: getTimeline(state).threadLevels,
    threads: getTimeline(state).threads,
    lastCategory_id: getTimeline(state).lastCategory_id,
    lastThread_id: getTimeline(state).lastThread_id,
    attentionShifts: getUser(state).attentionShifts,
    searchTerms: getUser(state).searchTerms,
    settings: state.settings,
    tabs: getUser(state).tabs
  }),
  dispatch => ({
    createThread: (name, rank) => dispatch(createThread(name, rank)),
    toggleThread: (id, isCollapsed = false) =>
      dispatch(isCollapsed ? expandThread(id) : collapseThread(id)),
    updateActivity: (id, updates) => dispatch(updateActivity(id, updates)),
    updateEvent: (id, updates) => dispatch(updateEvent(id, updates)),
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
)(Timeline);
