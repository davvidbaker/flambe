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

const Wrapper = styled.div`
  max-height: 200px;
  background: white;
  overflow-y: auto;
  width: max-content;
`;

const Checkbox = styled.input``;

const FilterTrace = props => {
  const { threads, filterExcludes = [], filterTrace } = props;
  const threadsWithSuspendedActivityCount = loadSuspendedActivityCount(
    props.activities,
    threads,
  );
  const filteredThreads = getFilteredThreads(
    filterExcludes,
    threadsWithSuspendedActivityCount,
  );

  console.log(`🔥  filteredThreads`, filteredThreads);

  return (
    <Wrapper>
      {Object.entries(threadsWithSuspendedActivityCount).map(([id, thread]) => (
        <div key={id}>
          <label>
            <Checkbox
              onChange={e => filterTrace(e.target.checked, id)}
              checked={Object.keys(filteredThreads)
                .map(k => Number(k))
                .includes(Number(id))}
              type="checkbox"
            />
            {thread.name}{' '}
            <span
              style={{
                color: getShamefulColor(thread.suspendedActivityCount * 5),
              }}
            >
              ({thread.suspendedActivityCount})
            </span>
          </label>
        </div>
      ))}
    </Wrapper>
  );
};

export default connect(
  state => ({
    threads: getTimeline(state).threads,
    filterExcludes: getFilterExcludes(state),
    activities: getTimeline(state).activities,
  }),
  dispatch => ({
    filterTrace: (shouldInclude, thread_id) =>
      dispatch(filterTraceAction(shouldInclude, Number(thread_id))),
  }),
)(FilterTrace);
