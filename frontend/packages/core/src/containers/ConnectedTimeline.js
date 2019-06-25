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
  state => {
    const timeline = getTimelineWithFiltersApplied(state);
    return {
      activities: timeline.activities,
      blocks: timeline.blocks,
      categories: getUser(state).categories,
      mantras: getUser(state).mantras,
      minTime: timeline.minTime,
      maxTime: timeline.maxTime,
      modifiers: state.modifiers,
      threadLevels: timeline.threadLevels,
      threads: timeline.threads,
      lastCategory_id: timeline.lastCategory_id,
      lastThread_id: timeline.lastThread_id,
      attentionShifts: getUser(state).attentionShifts,
      searchTerms: getUser(state).searchTerms,
      attentionDrivenThreadOrder: state.settings.attentionDrivenThreadOrder,
      tabs: getUser(state).tabs,

      // these are only used for overrides.
      leftBoundaryTimeOverride: getTimeline(state).leftBoundaryTime,
      rightBoundaryTimeOverride: getTimeline(state).rightBoundaryTime,
    };
  },
  dispatch => ({
    createThread: (name, rank) => dispatch(createThread(name, rank)),
    toggleThread: (id, isCollapsed = false) => dispatch(isCollapsed ? expandThread(id) : collapseThread(id)),
    updateActivity: (id, updates) => dispatch(updateActivity(id, updates)),
    updateEvent: (id, updates) => dispatch(updateEvent(id, updates)),
    focusBlock: ({
      index, activity_id, activityStatus, thread_id,
    }) => dispatch(
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
