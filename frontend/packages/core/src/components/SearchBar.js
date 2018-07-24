// @flow
import React, { Component } from 'react';
import styled from 'styled-components';

import Search from './Search';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 5px;
  background: #f3f8f9;
  border-top: 1px solid #e0eef3;
`;

type Props = {
  activities: Activity[],
  hideSearchBar: () => {}
};

class SearchBar extends Component<Props> {
  state = {
    matches: [],
    matchIndex: 0,
    blocksForMatch: [],
    blockIndex: 0,
    error: null,
    errorInfo: null
  };

  componentDidCatch(error, errorInfo) {
    // Display fallback UI
    this.setState({ error, errorInfo });
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, info);
  }

  searchActivities = value => {
    const matches = Object.entries(this.props.activities).filter(([_key, val]) => val.name.includes(value));

    if (matches.length > 0) {
      const match = matches[0];
      const activity_id = Number(match[0]);

      this.setState({
        matchIndex: 0,
        blocksForMatch: this.blocksForMatch(activity_id)
      });
    }

    this.setState({ matches }, this.focusBlock);
  };

  blocksForMatch = activity_id =>
    Object.entries(this.props.blocks).filter(([_key, val]) => val.activity_id === activity_id);

  focusBlock = () => {
    const match = this.state.matches[this.state.matchIndex];
    if (!match) return;

    const activity_id = Number(match[0]);
    const activity = match[1];

    console.log(
      `🔥focusingBlock, this.state.blockIndex`,
      this.state.blockIndex
    );
    this.props.focusBlock({
      /* ⚠️ todo  */
      index: Number(this.state.blocksForMatch[this.state.blockIndex][0]),
      activity_id,

      activityStatus: activity.status,
      thread_id: activity.thread_id
    });
  };

  incrementMatchIndex = (direction: -1 | 1) => {
    const matchCount = this.state.matches.length;

    this.setState(state => {
      const matchIndex =
        state.matchIndex + direction < 0
          ? matchCount - 1
          : (state.matchIndex + direction) % matchCount;
      return {
        matchIndex,
        blockIndex: 0,
        blocksForMatch: this.blocksForMatch(Number(this.state.matches[matchIndex][0]))
      };
    }, this.focusBlock);
  };

  onNext = () => {
    this.incrementMatchIndex(1);
  };

  onPrevious = () => {
    this.incrementMatchIndex(-1);
  };

  incrementBlockIndex = (direction: -1 | 1) => {
    const blockCount = this.state.blocksForMatch.length;

    this.setState(state => {
      const blockIndex =
        state.blockIndex + direction < 0
          ? blockCount - 1
          : (state.blockIndex + direction) % blockCount;
      return { blockIndex };
    }, this.focusBlock);
  };

  onNextBlock = () => {
    this.incrementBlockIndex(1);
  };

  onPreviousBlock = () => {
    this.incrementBlockIndex(-1);
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
          onSubmit={this.searchActivities}
          onNext={this.onNext}
          onPrevious={this.onPrevious}
          onNextBlock={this.onNextBlock}
          onPreviousBlock={this.onPreviousBlock}
          matchCount={this.state.matches.length}
          blockCount={this.state.blocksForMatch.length}
          matchIndex={this.state.matchIndex}
          innerRef={this.props.inputRef}
        />
        <button onClick={this.props.hideSearchBar}>Cancel</button>
      </Wrapper>
    );
  }
}

export default SearchBar;
