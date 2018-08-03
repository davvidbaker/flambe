// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { search, incrementMatch, incrementBlock } from '../actions';
import Search from '../components/Search';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 5px;
  background: #f3f8f9;
  border-top: 1px solid #e0eef3;
`;

type Props = {
  hideSearchBar: () => {}
};

class SearchBar extends Component<Props> {
  state = {
    error: null,
    errorInfo: null
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
    return this.state.error ? (
      <div>
        {this.state.error}
        {this.state.errorInfo}
      </div>
    ) : (
      <Wrapper>
        <Search
          onSubmit={this.search}
          onNext={this.onNext}
          onPrevious={this.onPrevious}
          onNextBlock={this.onNextBlock}
          onPreviousBlock={this.onPreviousBlock}
          matchCount={this.props.matches.length}
          blockCount={this.props.blocksForMatch.length}
          matchIndex={this.props.matchIndex}
          innerRef={this.props.inputRef}
        />
        <button onClick={this.props.hideSearchBar}>Cancel</button>
      </Wrapper>
    );
  }
}

export default connect(
  state => ({
    matches: state.search.matches,
    blocksForMatch: state.search.blocksForMatch,
    blockIndex: state.search.blockIndex,
    matchIndex: state.search.matchIndex
  }),
  dispatch => ({
    incrementBlock: (direction) => dispatch(incrementBlock(direction)),
    incrementMatch: (direction) => dispatch(incrementMatch(direction)),
    search: (searchTerm, options) => dispatch(search(searchTerm, options))
  })
)(SearchBar);
