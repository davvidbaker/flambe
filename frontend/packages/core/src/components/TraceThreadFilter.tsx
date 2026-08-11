import React from 'react';
import { connect } from 'react-redux';

import { getTimeline, getFilterExcludes } from '../reducers/timeline';
import { filterTrace as filterTraceAction } from '../actions';
import {
  getFilteredThreads,
  getShamefulColor,
  loadSuspendedActivityCount,
} from '../utilities/timeline';
import ThreadFilter from './ThreadFilter';
import type { TimelineState } from '../reducers/timeline';
import type { EntityId } from '../types/ids';
import type { ProcessedActivity } from '../utilities/processTrace';
import type { Thread } from '../types/Thread';

interface ThreadOption {
  label: string;
  value: EntityId;
}

interface Props {
  activities?: Record<string, ProcessedActivity>;
  filterExcludes?: EntityId[];
  filterTrace: (selectedValues: ThreadOption[]) => unknown;
  threads?: Record<string, Thread>;
}

const TraceThreadFilter = ({
  threads = {},
  filterExcludes = [],
  filterTrace,
  activities = {},
}: Props) => {
  const threadsWithSuspendedActivityCount = loadSuspendedActivityCount(
    activities,
    threads,
  );

  return (
    <ThreadFilter
      allThreads={threadsWithSuspendedActivityCount}
      filterExcludes={filterExcludes}
      onChange={filterTrace}
    />
  );
};

export default connect(
  (state: { timeline: TimelineState }) => ({
    threads: getTimeline(state).threads,
    filterExcludes: getFilterExcludes(state),
    activities: getTimeline(state).activities,
  }),
  dispatch => ({
    filterTrace: (selectedValues: ThreadOption[]) =>
      dispatch(filterTraceAction(selectedValues)),
  }),
)(TraceThreadFilter);
