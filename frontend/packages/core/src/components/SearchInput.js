// @flow
import React from 'react';
import styled from 'styled-components';

const Input = styled.input`
  border-width: 0;
  flex-grow: 1;
  padding: ${props => (props.padding ? props.padding : '10px')};
  width: 100%;

  &:focus-within {
    outline: -webkit-focus-ring-color auto 5px;
  }
`;

type Props = {
  onSubmit: (str: string) => void,
  innerRef: HTMLInputElement => void,
  searchStack: string[],
  placeholder?: string,
};

type State = {
  value: string,
};

class SearchInput extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      value: props.searchStack ? props.searchStack[0] : '',
    };
  }

  static defaultProps = {
    placeholder: 'find',
  };

  state = { value: '', searchStackIndex: 0, lastManualValue: '' };

  onChange = e => {
    this.setState({
      value: e.target.value,
      lastManualValue: e.target.value,
    });
  };

  // 💁 ArrowDown and ArrowUp are not being recognized by onkeypress for whatever reason
  onKeyDown = e => {
    const direction = do {
      if (e.key === 'ArrowDown') {
        -1;
      } else if (e.key === 'ArrowUp') {
        1;
      }
    };

    if (direction) {
      /* 💁 👇 need this because by default the up arrow puts the caret at the start of the input! */
      e.preventDefault();
      const searchStackIndex = this.state.searchStackIndex + direction;
      if (
        searchStackIndex >= 0 &&
        searchStackIndex < this.props.searchStack.length
      ) {
        this.setState({
          searchStackIndex,
          value: this.props.searchStack[searchStackIndex],
        });

        e.target.selectionStart = e.target.selectionEnd = this.props.searchStack[
          searchStackIndex
        ].length;
      } else if (searchStackIndex === -1) {
        this.setState({
          searchStackIndex,
          value: this.state.lastManualValue,
        });
      }
    }
  };

  onKeyPress = e => {
    if (e.key === 'Enter') {
      this.props.onSubmit(this.state.value);
      this.setState({ lastManualValue: '' });
    }
  };

  render() {
    return (
      <Input
        padding={this.props.padding}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
        onKeyPress={this.onKeyPress}
        value={this.state.value}
        placeholder={this.props.placeholder}
        type="text"
        innerRef={this.props.innerRef}
      />
    );
  }
}

export default SearchInput;
