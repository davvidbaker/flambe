import React, { type FocusEventHandler, type KeyboardEvent } from 'react';
import styled from 'styled-components';

const Input = styled.input`
  width: 50px;
  text-align: center;
  &[type=number]::-webkit-inner-spin-button, 
  &[type=number]::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }

  &::before {
    content: '${props => props.placeholder}';
  }
`;

interface Props { placeholder: string; onSubmit: (value: string) => void; onBlur: FocusEventHandler<HTMLInputElement> }
const NumberInput = ({ placeholder, onSubmit, onBlur }: Props) => {
  return (
    <Input
      type="number"
      placeholder={placeholder}
      onBlur={onBlur}
      onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          onSubmit(e.currentTarget.value);
        }
      }}
    />
  );
};

/*
This was the content editable approach, that I got tired of dealing with.
const onlyNumbersRegex = /^\d*$/;

const Input = styled.span`
  min-width: 40px;
  text-align: center;
  cursor: text;

  &::before {
    content: '${props => props.placeholder}';
  }
`;

type Props = {
  placeholder: string,
  onSubmit: () => void,
  onBlur: () => void,
};

type State = {
  value: string,
};

class NumberInput extends Component<Props, State> {
  state = {
    html: '',
  };

  handleInput = e => {
    const html = this.input.innerHTML;
    e.target.selectionStart = e.target.selectionEnd = html.length;

    const target = e.target;

    if (html.includes('<br>')) {
      this.input.innerHTML = this.state.html;

      return;
    }
    if (onlyNumbersRegex.test(html)) {
      this.setState({ html }, () => {
        target.selectionStart = target.selectionEnd = html.length;
      });
    } else {
      this.input.innerHTML = this.state.html;
    }

    // this.setState({ value: e.target.value });
  };

  render() {
    const { placeholder, onSubmit, onBlur } = this.props;
    return (
      <Input
        contentEditable
        type="number"
        ref={i => {
          this.input = i;
        }}
        placeholder={this.state.html.length === 0 ? placeholder : undefined}
        onInput={this.handleInput}
        onBlur={this.handleInput}
        dangerouslySetInnerHTML={{ __html: this.state.html }}
      />
    );
  }
}
*/
export default NumberInput;
