import React, { Component } from 'react';
import tinycolor from 'tinycolor2';
import styled from 'styled-components';

import { colors } from '../styles';

const Wrapper = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  background: white;
  margin: 0 5px;
  height: 40px;
  position: relative;

  &:focus-within {
    outline: -webkit-focus-ring-color auto 5px;
  }
`;

const Input = styled.input`
  border-width: 0;
  flex-grow: 1;
  padding: 10px;

  &:focus {
    outline: none;
  }
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

const SearchPlaceBadName = styled.div``;

const NextPrevButton = styled.button`
  background: ${colors.background};
  outline: none;
  border: 1px solid transparent;
  border-radius: 4px;
  text-align: center;
  font-size: 1.5em;
  padding: 0;

  ${props =>
    (props.disabled
      ? `
      filter: grayscale(100%);
      `
      : `&:hover {
    background: ${tinycolor(colors.hover)
        .darken(0.1)
        .toString()};
  }`)} &:focus {
    border: 1px solid ${colors.flames.main};
  }
`;

type Props = {
  onChange?: (val: string) => void,
  onSubmit: (val: string) => void,
  onNext: () => void,
  onPrevious: () => void,
  matchCount: number
};

class Search extends Component<Props> {
  state = { value: '' };

  onChange = e => {
    this.setState({ value: e.target.value });
  };

  onKeyPress = e => {
    '';

    if (e.key === 'Enter') {
      this.props.onSubmit(this.state.value);
    }
  };

  render() {
    const {
      blockCount,
      onNext,
      onPrevious,
      onNextBlock,
      onPreviousBlock,
      matchCount,
      matchIndex
    } = this.props;

    return (
      <Wrapper>
        <InputContainer>
          <Input
            onChange={this.onChange}
            onKeyPress={this.onKeyPress}
            value={this.state.value}
            placeholder="find"
            type="text"
            innerRef={this.props.innerRef}
          />
          {matchCount > 0 && (
            <SearchPlaceBadName>
              {`${matchIndex + 1} of ${matchCount}`}
            </SearchPlaceBadName>
          )}
        </InputContainer>
        <SearchControls>
          <NextPrevButton
            onClick={onPreviousBlock}
            title="previous block same match"
            disabled={blockCount <= 1}
            style={{ gridColumn: '2', gridRow: '1', fontSize: '8px' }}
          >
            👆
          </NextPrevButton>
          <NextPrevButton
            onClick={onPrevious}
            title="previous match"
            disabled={matchCount <= 1}
            style={{ gridRow: '1 / span 2' }}
          >
            👈
          </NextPrevButton>
          <NextPrevButton
            onClick={onNext}
            title="next match"
            disabled={matchCount <= 1}
            style={{ gridColumn: '3', gridRow: '1 / span 2' }}
          >
            👉
          </NextPrevButton>
          <NextPrevButton
            onClick={onNextBlock}
            title="next block same match"
            disabled={blockCount <= 1}
            style={{ gridColumn: '2', gridRow: '2', fontSize: '8px' }}
          >
            👇
          </NextPrevButton>
        </SearchControls>
      </Wrapper>
    );
  }
}

export default Search;
