// @flow

import React, { Component } from 'react';
import styled from 'styled-components';
import tinycolor from 'tinycolor2';

import { colors } from '../styles';

const commonStyles = `
  background: ${colors.background};
  outline: none;
  border: 1px solid transparent;
  padding: 1px 7px 2px;
  border-radius: 4px;
  text-align: center;
  min-width: 100px;

  &:focus {
    border: 1px solid ${colors.flames.main};
  }
`;

const Button = styled.button`
  ${commonStyles}
   cursor: ${props => (props.disabled ? 'default' : 'pointer')};

  ${props =>
    (props.disabled
      ? ''
      : `&:hover {
    background: ${tinycolor(colors.hover)
        .darken(5)
        .toString()};
  }`)}

  &:active {
    background: ${tinycolor(colors.hover)
    .darken(10)
    .toString()};
  }

  ${props => (props.looksLikeButton ? 'border-color: #ccc' : '')};
  ${props => (props.additionalStyles ? props.additionalStyles : '')};
`;

const StyledInputFromButton = styled.textarea`
  /* min-width: unset; */
  /* width: unset; */
  ${commonStyles};
`;

type Props = {
  canBeBlank: boolean,
  looksLikeButton: boolean,
  children: Component<*>,
  placeholder?: string,
  placeholderIsDefaultValue?: boolean,
  submit: (value: string) => mixed
};

/* 💁 aka MagicButton */
export class InputFromButton extends Component<
  Props,
  { isInput: boolean, width: number }
> {
  state = {
    isInput: false
  };

  transformIntoInput = () => {
    this.setState(
      { isInput: true, width: this.button.getBoundingClientRect().width },
      () => {
        this.transformedInput.focus();
        this.transformedInput.setSelectionRange(
          0,
          this.transformedInput.value.length
        );
      }
    );
  };

  onKeyPress = e => {
    if (
      e.key === 'Enter' &&
      (this.props.canBeBlank || e.target.value.length > 0)
    ) {
      this.props.submit(e.target.value);
      this.transformIntoButton();
    }
  };

  transformIntoButton = () => {
    this.setState({ isInput: false });
  };

  render() {
    return this.state.isInput === false ? (
      <Button
        innerRef={b => {
          this.button = b;
        }}
        onClick={this.transformIntoInput}
        looksLikeButton={this.props.looksLikeButton}
      >
        {this.props.children}
      </Button>
    ) : (
      <StyledInputFromButton
        type="text"
        style={{ width: `${this.state.width}px` }}
        placeholder={this.props.placeholder || this.props.children}
        onBlur={this.transformIntoButton}
        onKeyPress={this.onKeyPress}
        size={1}
        defaultValue={
          this.props.placeholderIsDefaultValue
            ? this.props.placeholder || this.props.children
            : undefined
        }
        innerRef={input => {
          this.transformedInput = input;
        }}
      />
    );
  }
}

export default Button;
