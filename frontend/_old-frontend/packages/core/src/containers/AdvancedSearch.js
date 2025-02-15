import groupBy from 'lodash/fp/groupBy';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import {
  search,
  setThreadExcludeList,
  setThreadIncludeList,
  focusBlock,
  setTimeline,
} from '../actions';
import SearchInput from '../components/SearchInput';
import Toggle from '../components/Toggle';
import Unbutton from '../components/Unbutton';
import { getUser } from '../reducers/user';

import * as Activity from '../modules/activity';

/* ⚠️ maybea bad idea */
const FullWidthUnbutton = styled(Unbutton)`
  display: block;
  padding: 3px 0;

  width: 100%;
  &:hover {
    background: var(--secondary-panel-background-hover);
  }
`;

const UL = styled.ul`
  padding-left: 30px;

  list-style: none;
  li {
    padding: 3px 0;
  }
`;

const SearchResults = styled.ul`
  height: 100%;
  overflow-y: auto;
  margin: -5px;
  padding: 5px;
`;

const ResultsSummary = styled.div`
  color: grey;
  margin-bottom: 5px;
  padding: 0 5px;
`;

const Expander = styled.div`
  padding: 0 5px;
  &::before {
    content: '';
    display: inline-block;
    width: 0;
    height: 0;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 4px solid black;
    margin-right: 5px;

    ${({ open }) =>
      open
        ? `
        transform: rotate(45deg);
    `
        : ''};
  }
`;

const ThreadResult = ({ name, matches }) => {
  console.log(`🔥  name, matches`, name, matches);
  return (
    <Toggle>
      {({ on, toggle }) => (
        <>
          <FullWidthUnbutton onClick={toggle}>
            <Expander open={on}>{name}</Expander>
          </FullWidthUnbutton>
          {on && (
            <UL>
              {matches.map(match => (
                <li key={match[0]}>
                  <SearchResult match={match} />
                </li>
              ))}
            </UL>
          )}
        </>
      )}
    </Toggle>
  );
};

const Div = styled.div`
  padding-left: 10px;
  position: relative;
  display: inline-block;

  &::before {
    content: '';
    width: 2px;
    height: 100%;
    position: absolute;
    margin-left: -10px;
    background-color: ${({ categoryColor }) => categoryColor};
  }

  &:hover {
    background: var(--secondary-panel-background-hover);
  }
`;

const SearchResult = connect(
  state => ({
    categories: getUser(state).categories,
  }),
  dispatch => ({
    setTimeline: (startTime, endTime) =>
      console.log(`🔥  startTime`, startTime) ||
      dispatch(setTimeline(startTime, endTime)),
    focusActivity: (activity_id, activity) =>
      dispatch(
        focusBlock({
          index: 0,
          activity_id,
          activityStatus: activity.status,
          thread_id: activity.thread_id,
        }),
      ),
  }),
)(({ categories, match, focusActivity, setTimeline }) => {
  const activity_id = match[0];
  const activity = match[1];

  const { background, text } = Activity.categoryColor(categories, activity);
  return (
    <div
      css={`
        display: flex;
        align-items: center;
      `}
    >
      <div
        css={`
          display: inline-block;
          margin-right: 5px;
        `}
      >
        {Activity.statusEmoji(activity)}
      </div>
      <Div
        categoryColor={background}
        onClick={() => {
          /* ⚠️ quick and dirty code ahead */
          focusActivity(activity_id, activity);

          // ⚠️ bad use of local storage, plus I think it isn't the up to date value
          const lbt = Number.parseFloat(localStorage.getItem('lbt'));
          const rbt = Number.parseFloat(localStorage.getItem('rbt'));

          const startTime = activity.startTime;
          const endTime = activity.endTime || rbt;

          if (startTime > rbt || endTime < lbt) {
            console.log('setting timeline');

            setTimeline(startTime, endTime);
          }
        }}
      >
        {activity.name}
      </Div>
    </div>
  );
});

const Wrapper = styled.div`
  height: 100%;
`;

const Settings = styled.div`
  color: var(--secondary-panel-color);
  padding: 5px;
  font-size: 0.9em;
  label {
    display: block;
    margin: 5px 0;
  }
`;

function matchThreadsFromInput(inputValue, threads) {
  const valueAsRegexGroups = inputValue
    .trim()
    .split(/[ ,]+/)
    .join('|');

  if (!valueAsRegexGroups) {
    return [];
  }

  const regex = new RegExp(`(${valueAsRegexGroups})`);

  return Object.entries(threads)
    .map(([thread_id, thread]) => thread.name)
    .filter(threadName => regex.test(threadName))
    .map(threadName =>
      Number(
        Object.entries(threads).find(
          ([thread_id, { name }]) => name === threadName,
        )[0],
      ),
    );
}

class AdvancedSearch extends Component {
  state = {};

  search = value => {
    this.props.search(value);
  };

  excludeThreads = value => {
    const threadsToExclude = matchThreadsFromInput(value, this.props.threads);
    this.props.setThreadExcludeList(threadsToExclude, value);
  };

  includeThreads = value => {
    const threadsToInclude = matchThreadsFromInput(value, this.props.threads);
    this.props.setThreadIncludeList(threadsToInclude, value);
  };

  render() {
    const { matches, searchStack, includeStack, excludeStack } = this.props;
    const matchesGroupedByThread = groupBy(
      ([activity_id, activity]) => activity.thread_id,
    )(this.props.matches);

    const matchCount = matches.length;
    const threadCount = Object.keys(matchesGroupedByThread).length;

    return (
      <Wrapper>
        <div style={{ height: '30px', padding: '0 5px' }}>
          <SearchInput
            onSubmit={this.search}
            // ?
            onBlur={this.search}
            innerRef={this.props.inputRef}
            searchStack={searchStack}
          />
        </div>

        <Toggle>
          {({ on, toggle }) => (
            <>
              <button onClick={toggle} title="toggle search details">
                ...
              </button>
              {on && (
                <Settings>
                  <label>
                    threads to include
                    <SearchInput
                      placeholder={''}
                      onSubmit={this.includeThreads}
                      // ?
                      onBlur={this.search}
                      padding="3px"
                      searchStack={includeStack}
                    />
                  </label>
                  <label>
                    threads to exclude
                    <SearchInput
                      placeholder={''}
                      onSubmit={this.excludeThreads}
                      // ?
                      onBlur={this.search}
                      padding="3px"
                      searchStack={excludeStack}
                    />
                  </label>
                </Settings>
              )}
            </>
          )}
        </Toggle>
        <ResultsSummary>
          {matchCount} results in {threadCount} threads
        </ResultsSummary>
        <SearchResults>
          {Object.entries(matchesGroupedByThread).map(
            ([thread_id, threadMatches]) => (
              <li key={thread_id}>
                <ThreadResult
                  name={this.props.threads[thread_id].name}
                  matches={threadMatches}
                />
              </li>
            ),
          )}
        </SearchResults>
      </Wrapper>
    );
  }
}

export default connect(
  state => ({
    matches: state.search.matches,
    blocksForMatch: state.search.blocksForMatch,
    blockIndex: state.search.blockIndex,
    matchIndex: state.search.matchIndex,
    searchStack: state.search.searchStack,
    includeStack: state.search.includeStack,
    excludeStack: state.search.excludeStack,
  }),
  dispatch => ({
    search: (searchTerm, options) => dispatch(search(searchTerm, options)),
    setThreadIncludeList: (thread_ids: number[], inputValue) =>
      dispatch(setThreadIncludeList(thread_ids, inputValue)),
    setThreadExcludeList: (thread_ids: number[], inputValue) =>
      dispatch(setThreadExcludeList(thread_ids, inputValue)),
  }),
)(AdvancedSearch);
