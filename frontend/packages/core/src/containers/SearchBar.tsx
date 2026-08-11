import React, { Component, type Ref, type ReactNode } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { search, incrementMatch, incrementBlock } from '../actions';
import SearchInput from '../components/SearchInput';
import NextPrevButton from '../components/NextPrevButton';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 5px;
  background: var(--secondary-panel-background);
  border-top: 1px solid #e0eef3;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  font-size: 11px;
  color: lightgrey;
`;

const SearchControls = styled.div`
  display: grid;
  height: 100%;
  grid-template-rows: 1fr 1fr;
  grid-template-columns: repeat(3, 1fr);
  margin-left: 5px;
`;

const SearchResultCount = styled.div`
  min-width: 52px;
  margin-left: 5px;
  color: var(--secondary-panel-color);
`;

interface Props {
  hideSearchBar: () => void;
  inputRef?: Ref<HTMLInputElement>;
  matches: unknown[];
  blocksForMatch: unknown[];
  blockIndex: number;
  matchIndex: number;
  searchStack: string[];
  search: (value: string) => unknown;
  incrementMatch: (direction: 1 | -1) => unknown;
  incrementBlock: (direction: 1 | -1) => unknown;
}
interface State { error: string | null; errorInfo: string | null }
interface SearchRootState { search: Pick<Props, 'matches' | 'blocksForMatch' | 'blockIndex' | 'matchIndex' | 'searchStack'> }

class SearchBar extends Component<Props, State> {
  state: State = {
    error: null,
    errorInfo: null,
  };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Display fallback UI
    this.setState({ error: error.message, errorInfo: errorInfo.componentStack ?? null });
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, info);
  }

  search = (value: string): void => {
    this.props.search(value);
  };

  onNext = (): void => {
    this.props.incrementMatch(1);
  };

  onPrevious = (): void => {
    this.props.incrementMatch(-1);
  };

  onNextBlock = (): void => {
    this.props.incrementBlock(1);
  };

  onPreviousBlock = (): void => {
    this.props.incrementBlock(-1);
  };

  render(): ReactNode {
    const matchCount = this.props.matches.length;
    const blockCount = this.props.blocksForMatch.length;

    const { matchIndex, hideSearchBar, inputRef, searchStack } = this.props;

    return this.state.error ? (
      <div>
        {this.state.error}
        {this.state.errorInfo}
      </div>
    ) : (
      <Wrapper>
        <div style={{ margin: '0 5px', display: 'flex', flexGrow: 1 }}>
          <InputContainer>
            <SearchInput
              onSubmit={this.search}
              inputRef={inputRef}
              searchStack={searchStack}
            />
            <SearchResultCount>
              {matchCount > 0
                ? `${matchIndex + 1} of ${matchCount}`
                : 'no results'}
            </SearchResultCount>
          </InputContainer>
          <SearchControls>
            <NextPrevButton
              onClick={this.onPreviousBlock}
              title="previous block same match"
              disabled={blockCount <= 1}
              style={{ gridColumn: '2', gridRow: '1', fontSize: '8px' }}
            >
              👆
            </NextPrevButton>
            <NextPrevButton
              onClick={this.onPrevious}
              title="previous match"
              disabled={matchCount <= 1}
              style={{ gridRow: '1 / span 2' }}
            >
              👈
            </NextPrevButton>
            <NextPrevButton
              onClick={this.onNext}
              title="next match"
              disabled={matchCount <= 1}
              style={{ gridColumn: '3', gridRow: '1 / span 2' }}
            >
              👉
            </NextPrevButton>
            <NextPrevButton
              onClick={this.onNextBlock}
              title="next block same match"
              disabled={blockCount <= 1}
              style={{ gridColumn: '2', gridRow: '2', fontSize: '8px' }}
            >
              👇
            </NextPrevButton>
          </SearchControls>
        </div>
        <button onClick={hideSearchBar}>Cancel</button>
      </Wrapper>
    );
  }
}

export default connect(
  (state: SearchRootState) => ({
    matches: state.search.matches,
    blocksForMatch: state.search.blocksForMatch,
    blockIndex: state.search.blockIndex,
    matchIndex: state.search.matchIndex,
    searchStack: state.search.searchStack,
  }),
  dispatch => ({
    incrementBlock: (direction: 1 | -1) => dispatch(incrementBlock(direction)),
    incrementMatch: (direction: 1 | -1) => dispatch(incrementMatch(direction)),
    search: (searchTerm: string) => dispatch(search(searchTerm, undefined)),
  }),
)(SearchBar);
