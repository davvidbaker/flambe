import { connect } from 'react-redux';

import Timeline from '../components/Timeline';
import type { TimelineProps } from '../components/Timeline';
import type { RootState } from '../store';
import type { EntityId } from '../types/ids';
import {
  getTimeline,
  getTimelineWithFiltersApplied,
} from '../reducers/timeline';
import { getUser } from '../reducers/user';
import {
  collapseThread,
  expandThread,
  focusBlock,
  hoverBlock,
  updateEvent,
} from '../actions';

export default connect(
  (state: RootState) => {
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
      focusedBlockIndex: timeline.focusedBlockIndex,
      hoveredBlockIndex: timeline.hoveredBlockIndex,
    };
  },
  dispatch => ({
    toggleThread: (id: EntityId, isCollapsed = false) => dispatch(isCollapsed ? expandThread(id) : collapseThread(id)),
    updateEvent: (id: EntityId, updates: Record<string, unknown>) => dispatch(updateEvent(id, updates)),
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
  }),
)(Timeline);
