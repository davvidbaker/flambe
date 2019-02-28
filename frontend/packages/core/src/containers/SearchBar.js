// @flow
import React, { Component } from 'react';
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

type Props = {
  hideSearchBar: () => {},
};

class SearchBar extends Component<Props> {
  state = {
    error: null,
    errorInfo: null,
  };

  componentDidCatch(error, errorInfo) {
    // Display fallback UI
    this.setState({ error, errorInfo });
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, info);
  }

  search = value => {
    this.props.search(value);
  };

  onNext = () => {
    this.props.incrementMatch(1);
  };

  onPrevious = () => {
    this.props.incrementMatch(-1);
  };

  onNextBlock = () => {
    this.props.incrementBlock(1);
  };

  onPreviousBlock = () => {
    this.props.incrementBlock(-1);
  };

  render() {
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
  state => ({
    matches: state.search.matches,
    blocksForMatch: state.search.blocksForMatch,
    blockIndex: state.search.blockIndex,
    matchIndex: state.search.matchIndex,
    searchStack: state.search.searchStack,
  }),
  dispatch => ({
    incrementBlock: direction => dispatch(incrementBlock(direction)),
    incrementMatch: direction => dispatch(incrementMatch(direction)),
    search: (searchTerm, options) => dispatch(search(searchTerm, options)),
  }),
)(SearchBar);
