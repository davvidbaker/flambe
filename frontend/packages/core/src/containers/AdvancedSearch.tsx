import React, { Component, type Ref } from 'react';
import { connect, type ConnectedProps } from 'react-redux';
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
import * as Activity from '../modules/activity';
import type { RootState } from '../store';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';
import type { SearchMatch } from '../reducers/search';

const FullWidthUnbutton = styled(Unbutton)`
  display: block;
  padding: 3px 0;
  width: 100%;
  &:hover { background: var(--secondary-panel-background-hover); }
`;

const UL = styled.ul`
  padding-left: 30px;
  list-style: none;
  li { padding: 3px 0; }
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

const Expander = styled.div<{ $open: boolean }>`
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
    ${({ $open }) => ($open ? 'transform: rotate(45deg);' : '')}
  }
`;

const ResultRow = styled.div`
  display: flex;
  align-items: center;
`;

const Status = styled.div`
  display: inline-block;
  margin-right: 5px;
`;

const ResultName = styled.div<{ $categoryColor: string }>`
  padding-left: 10px;
  position: relative;
  display: inline-block;

  &::before {
    content: '';
    width: 2px;
    height: 100%;
    position: absolute;
    margin-left: -10px;
    background-color: ${({ $categoryColor }) => $categoryColor};
  }

  &:hover { background: var(--secondary-panel-background-hover); }
`;

interface SearchResultOwnProps { match: SearchMatch }

const searchResultConnector = connect(
  (state: RootState) => ({ categories: state.user.categories }),
  dispatch => ({
    setVisibleTimeline: (startTime: number, endTime: number) =>
      dispatch(setTimeline(startTime, endTime)),
    focusActivity: (activity_id: EntityId, activity: SearchMatch[1]) => {
      if (activity.thread_id === undefined) return;
      dispatch(focusBlock({
        index: 0,
        activity_id,
        activityStatus: activity.status,
        thread_id: activity.thread_id,
      }));
    },
  }),
);

type SearchResultProps = ConnectedProps<typeof searchResultConnector> & SearchResultOwnProps;

function SearchResultView({ categories, match, focusActivity, setVisibleTimeline }: SearchResultProps) {
  const [activity_id, activity] = match;
  const { background } = Activity.categoryColor(categories, activity);

  return (
    <ResultRow>
      <Status>{Activity.statusEmoji(activity)}</Status>
      <ResultName
        $categoryColor={background}
        onClick={() => {
          focusActivity(activity_id, activity);

          const leftBoundary = Number.parseFloat(localStorage.getItem('lbt') ?? '');
          const rightBoundary = Number.parseFloat(localStorage.getItem('rbt') ?? '');
          const startTime = activity.startTime;
          const endTime = activity.endTime ?? rightBoundary;

          if (
            startTime !== undefined &&
            Number.isFinite(leftBoundary) &&
            Number.isFinite(rightBoundary) &&
            (startTime > rightBoundary || endTime < leftBoundary)
          ) {
            setVisibleTimeline(startTime, endTime);
          }
        }}
      >
        {activity.name}
      </ResultName>
    </ResultRow>
  );
}

const SearchResult = searchResultConnector(SearchResultView);

interface ThreadResultProps { name: string; matches: SearchMatch[] }

function ThreadResult({ name, matches }: ThreadResultProps) {
  return (
    <Toggle>
      {({ on, toggle }) => (
        <>
          <FullWidthUnbutton onClick={toggle}>
            <Expander $open={on}>{name}</Expander>
          </FullWidthUnbutton>
          {on && (
            <UL>
              {matches.map(match => (
                <li key={match[0]}><SearchResult match={match} /></li>
              ))}
            </UL>
          )}
        </>
      )}
    </Toggle>
  );
}

const Wrapper = styled.div`height: 100%;`;

const Settings = styled.div`
  color: var(--secondary-panel-color);
  padding: 5px;
  font-size: 0.9em;
  label { display: block; margin: 5px 0; }
`;

function matchThreadsFromInput(inputValue: string, threads: Record<string, Thread>): number[] {
  const valueAsRegexGroups = inputValue.trim().split(/[ ,]+/).join('|');
  if (!valueAsRegexGroups) return [];

  let regex: RegExp;
  try {
    regex = new RegExp(`(${valueAsRegexGroups})`);
  } catch {
    return [];
  }

  return Object.values(threads)
    .filter(thread => regex.test(thread.name))
    .map(thread => Number(thread.id))
    .filter(Number.isFinite);
}

interface OwnProps {
  inputRef?: Ref<HTMLInputElement>;
  threads: Record<string, Thread>;
}

const connector = connect(
  (state: RootState) => ({
    matches: state.search.matches,
    searchStack: state.search.searchStack,
    includeStack: state.search.includeStack,
    excludeStack: state.search.excludeStack,
  }),
  dispatch => ({
    search: (searchTerm: string) => dispatch(search(searchTerm)),
    setThreadIncludeList: (thread_ids: number[], inputValue: string) =>
      dispatch(setThreadIncludeList(thread_ids, inputValue)),
    setThreadExcludeList: (thread_ids: number[], inputValue: string) =>
      dispatch(setThreadExcludeList(thread_ids, inputValue)),
  }),
);

type Props = OwnProps & ConnectedProps<typeof connector>;

class AdvancedSearch extends Component<Props> {
  search = (value: string): void => {
    this.props.search(value);
  };

  excludeThreads = (value: string): void => {
    this.props.setThreadExcludeList(
      matchThreadsFromInput(value, this.props.threads),
      value,
    );
  };

  includeThreads = (value: string): void => {
    this.props.setThreadIncludeList(
      matchThreadsFromInput(value, this.props.threads),
      value,
    );
  };

  render() {
    const { matches, searchStack, includeStack, excludeStack, threads } = this.props;
    const matchesGroupedByThread = matches.reduce<Record<string, SearchMatch[]>>(
      (groups, match) => {
        const threadKey = String(match[1].thread_id);
        (groups[threadKey] ??= []).push(match);
        return groups;
      },
      {},
    );

    return (
      <Wrapper>
        <div style={{ height: '30px', padding: '0 5px' }}>
          <SearchInput
            onSubmit={this.search}
            onBlur={this.search}
            inputRef={this.props.inputRef}
            searchStack={searchStack}
          />
        </div>

        <Toggle>
          {({ on, toggle }) => (
            <>
              <button onClick={toggle} title="toggle search details">...</button>
              {on && (
                <Settings>
                  <label>
                    threads to include
                    <SearchInput
                      placeholder=""
                      onSubmit={this.includeThreads}
                      onBlur={this.includeThreads}
                      padding="3px"
                      searchStack={includeStack}
                    />
                  </label>
                  <label>
                    threads to exclude
                    <SearchInput
                      placeholder=""
                      onSubmit={this.excludeThreads}
                      onBlur={this.excludeThreads}
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
          {matches.length} results in {Object.keys(matchesGroupedByThread).length} threads
        </ResultsSummary>
        <SearchResults>
          {Object.entries(matchesGroupedByThread).map(([thread_id, threadMatches]) => {
            const thread = threads[thread_id];
            return thread ? (
              <li key={thread_id}>
                <ThreadResult name={thread.name} matches={threadMatches} />
              </li>
            ) : null;
          })}
        </SearchResults>
      </Wrapper>
    );
  }
}

export default connector(AdvancedSearch);
