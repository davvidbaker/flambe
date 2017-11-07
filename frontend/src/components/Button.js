// @flow

import React, { Component } from 'react';
import styled from 'styled-components';
import tinycolor from 'tinycolor2';

import { colors } from 'styles';

const commonStyles = `
  background: ${colors.background};
  outline: none;
  border: 1px solid transparent;
  padding: 1px 7px 2px;
  border-radius: 4px;
  text-align: center;

  &:focus {
    border: 1px solid ${colors.flames.main};
  }
`;

const Button = styled.button`
  ${commonStyles} cursor: pointer;

  &:hover {
    background: ${tinycolor(colors.hover)
    .darken(5)
    .toString()};
  }

  &:active {
    background: ${tinycolor(colors.hover)
    .darken(10)
    .toString()};
  }
  ${props => (props.looksLikeButton ? 'border-color: #ccc' : '')};
`;

const StyledInputFromButton = styled.input`
  min-width: unset;
  ${commonStyles};
`;

type Props = {
  canBeBlank: boolean,
  looksLikeButton: boolean,
  children: Component<*>,
  placeholder: ?string,
  submit: (value: string) => mixed,
};

export class InputFromButton extends Component<Props, { isInput: boolean }> {
  state = {
    isInput: false,
  };

  focus = () => {
    this.transformIntoInput();
  };

  transformIntoInput = () => {
    this.setState({ isInput: true }, () => {
      this.transformedInput.focus();
    });
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
        onClick={this.transformIntoInput}
        looksLikeButton={this.props.looksLikeButton}
      >
        {this.props.children}
      </Button>
    ) : (
      <StyledInputFromButton
        type="text"
        placeholder={this.props.placeholder || this.props.children}
        onBlur={this.transformIntoButton}
        onKeyPress={this.onKeyPress}
        innerRef={input => {
          this.transformedInput = input;
        }}
      />
    );
  }
}

export default Button;
