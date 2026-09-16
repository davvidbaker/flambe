import React, { Component, type KeyboardEvent, type MouseEvent, type Ref, type ReactNode } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { search, incrementMatch, incrementBlock, toggleSearchOption } from '../actions';
import SearchInput from '../components/SearchInput';
import NextPrevButton from '../components/NextPrevButton';
import Unbutton from '../components/Unbutton';
import type { SearchOptions } from '../utilities/activityMatchesSearch';

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

const FindField = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid #c8c8c8;
  border-radius: 2px;

  &:focus-within {
    border-color: #007fd4;
  }

  input {
    outline: none;
    min-width: 0;
    width: auto;
    flex: 1;
    padding: 6px 8px;
  }
`;

const OptionToggles = styled.div`
  display: flex;
  align-items: center;
  padding-right: 4px;
  gap: 1px;
`;

const OptionToggle = styled(Unbutton)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 3px;
  font-size: 12px;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-weight: 600;
  color: ${({ $active }) => ($active ? '#fff' : '#616161')};
  background: ${({ $active }) => ($active ? '#007fd4' : 'transparent')};

  &:hover {
    background: ${({ $active }) => ($active ? '#007fd4' : '#e8e8e8')};
  }
`;

const WholeWordGlyph = styled.span`
  text-decoration: underline;
  text-underline-offset: 1px;
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
  options: SearchOptions;
  searchError: string | null;
  search: (value: string) => unknown;
  incrementMatch: (direction: 1 | -1) => unknown;
  incrementBlock: (direction: 1 | -1) => unknown;
  toggleSearchOption: (option: keyof SearchOptions) => unknown;
}
interface State { error: string | null; errorInfo: string | null }
interface SearchRootState {
  search: Pick<
    Props,
    'matches' | 'blocksForMatch' | 'blockIndex' | 'matchIndex' | 'searchStack' | 'options' | 'searchError'
  >;
}

const SEARCH_OPTION_BY_CODE: Record<string, keyof SearchOptions> = {
  KeyC: 'matchCase',
  KeyW: 'matchWholeWord',
  KeyR: 'useRegularExpression',
};

class SearchBar extends Component<Props, State> {
  state: State = {
    error: null,
    errorInfo: null,
  };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ error: error.message, errorInfo: errorInfo.componentStack ?? null });
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

  onToggleMouseDown = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
  };

  onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!event.altKey) return;
    const option = SEARCH_OPTION_BY_CODE[event.code];
    if (!option) return;
    event.preventDefault();
    this.props.toggleSearchOption(option);
  };

  render(): ReactNode {
    const matchCount = this.props.matches.length;
    const blockCount = this.props.blocksForMatch.length;

    const { matchIndex, hideSearchBar, inputRef, searchStack, options, searchError } = this.props;

    return this.state.error ? (
      <div>
        {this.state.error}
        {this.state.errorInfo}
      </div>
    ) : (
      <Wrapper onKeyDown={this.onKeyDown}>
        <div style={{ margin: '0 5px', display: 'flex', flexGrow: 1 }}>
          <InputContainer>
            <FindField>
              <SearchInput
                onSubmit={this.search}
                inputRef={inputRef}
                searchStack={searchStack}
              />
              <OptionToggles>
                <OptionToggle
                  type="button"
                  $active={options.matchCase}
                  aria-pressed={options.matchCase}
                  title="Match Case (⌥⌘C)"
                  onMouseDown={this.onToggleMouseDown}
                  onClick={() => this.props.toggleSearchOption('matchCase')}
                >
                  Aa
                </OptionToggle>
                <OptionToggle
                  type="button"
                  $active={options.matchWholeWord}
                  aria-pressed={options.matchWholeWord}
                  title="Match Whole Word (⌥⌘W)"
                  onMouseDown={this.onToggleMouseDown}
                  onClick={() => this.props.toggleSearchOption('matchWholeWord')}
                >
                  <WholeWordGlyph>ab</WholeWordGlyph>
                </OptionToggle>
                <OptionToggle
                  type="button"
                  $active={options.useRegularExpression}
                  aria-pressed={options.useRegularExpression}
                  title="Use Regular Expression (⌥⌘R)"
                  onMouseDown={this.onToggleMouseDown}
                  onClick={() => this.props.toggleSearchOption('useRegularExpression')}
                >
                  .*
                </OptionToggle>
              </OptionToggles>
            </FindField>
            <SearchResultCount>
              {searchError
                ? searchError
                : matchCount > 0
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
    options: state.search.options,
    searchError: state.search.searchError,
  }),
  dispatch => ({
    incrementBlock: (direction: 1 | -1) => dispatch(incrementBlock(direction)),
    incrementMatch: (direction: 1 | -1) => dispatch(incrementMatch(direction)),
    search: (searchTerm: string) => dispatch(search(searchTerm, undefined)),
    toggleSearchOption: (option: keyof SearchOptions) => dispatch(toggleSearchOption(option)),
  }),
)(SearchBar);
