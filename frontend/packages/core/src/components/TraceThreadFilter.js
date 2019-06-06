import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { pipe, filter, identity, fromPairs } from 'lodash/fp';

import { getTimeline, getFilterExcludes } from '../reducers/timeline';
import { filterTrace as filterTraceAction } from '../actions';
import {
  getFilteredThreads,
  getShamefulColor,
  loadSuspendedActivityCount,
} from '../utilities/timeline';
import ThreadFilter from './ThreadFilter';

const Wrapper = styled.div`
  max-height: 200px;
  background: white;
  overflow-y: auto;
  width: max-content;
`;

const Checkbox = styled.input``;

const TraceThreadFilter = ({
  threads,
  filterExcludes = [],
  filterTrace,
  activities,
}) => {
  const threadsWithSuspendedActivityCount = loadSuspendedActivityCount(
    activities,
    threads,
  );

  const filteredThreads = getFilteredThreads(
    filterExcludes,
    threadsWithSuspendedActivityCount,
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
  state => ({
    threads: getTimeline(state).threads,
    filterExcludes: getFilterExcludes(state),
    activities: getTimeline(state).activities,
  }),
  dispatch => ({
    filterTrace: (selectedValues, _changeEvent) =>
      dispatch(filterTraceAction(selectedValues)),
  }),
)(TraceThreadFilter);
