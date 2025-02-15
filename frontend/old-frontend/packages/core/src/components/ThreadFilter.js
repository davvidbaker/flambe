import React, { Component } from 'react';
import Select from 'react-select';
import styled from 'styled-components';
import { pipe, filter, identity, fromPairs, map } from 'lodash/fp';

import { getTimeline, getFilterExcludes } from '../reducers/timeline';
import { filterTrace as filterTraceAction } from '../actions';
import {
  getFilteredThreads,
  getShamefulColor,
  loadSuspendedActivityCount,
} from '../utilities/timeline';

const format = th =>
  th
  |> Object.entries
  |> map(([id, thread]) => ({ value: id, label: thread.name }));

const ThreadFilter = ({
  allThreads,
  includedThreads,
  filterExcludes,
  onChange,
}) => {
  const threads = format(allThreads);

  const filteredThreads =
    includedThreads || format(getFilteredThreads(filterExcludes, allThreads));

  return (
    <Select
      isMulti
      value={filteredThreads}
      options={threads}
      onChange={onChange}
    />
  );
};

export default ThreadFilter;

/* <Wrapper>
      {Object.entries(allThreads).map(([id, thread]) => (
        <div key={id}>
          <label>
            <Checkbox
              onChange={e => onChange(e.target.checked, id)}
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
    </Wrapper> */
