import React, { Component, type ChangeEvent, type KeyboardEvent, type Ref } from 'react';
import styled from 'styled-components';

const Input = styled.input<{ padding?: string }>`
  border-width: 0;
  flex-grow: 1;
  padding: ${props => props.padding ?? '10px'};
  width: 100%;
  &:focus-within { outline: -webkit-focus-ring-color auto 5px; }
`;

interface Props {
  inputRef?: Ref<HTMLInputElement>;
  onSubmit: (value: string) => void;
  padding?: string;
  placeholder?: string;
  searchStack: string[];
}
interface State { value: string; searchStackIndex: number; lastManualValue: string }

class SearchInput extends Component<Props, State> {
  static defaultProps = { placeholder: 'find' };
  state: State = { value: this.props.searchStack?.[0] ?? '', searchStackIndex: 0, lastManualValue: '' };

  onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ value: event.target.value, lastManualValue: event.target.value });
  };

  onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    const direction = event.key === 'ArrowDown' ? -1 : event.key === 'ArrowUp' ? 1 : 0;
    if (!direction) return;
    event.preventDefault();
    const searchStackIndex = this.state.searchStackIndex + direction;
    if (searchStackIndex >= 0 && searchStackIndex < this.props.searchStack.length) {
      const value = this.props.searchStack[searchStackIndex];
      this.setState({ searchStackIndex, value });
      event.currentTarget.selectionStart = event.currentTarget.selectionEnd = value.length;
    } else if (searchStackIndex === -1) {
      this.setState({ searchStackIndex, value: this.state.lastManualValue });
    }
  };

  onKeyPress = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      this.props.onSubmit(this.state.value);
      this.setState({ lastManualValue: '' });
    }
  };

  render() {
    return <Input padding={this.props.padding} onChange={this.onChange} onKeyDown={this.onKeyDown} onKeyPress={this.onKeyPress} value={this.state.value} placeholder={this.props.placeholder} type="text" ref={this.props.inputRef} />;
  }
}

export default SearchInput;
