// @flow

import React, { Component } from 'react';
import Measure from 'react-measure';
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
    box-shadow: 0 0 20px ${colors.flames.main};
  }
`;

const Button = styled.button`
  ${props => (props.unstyled ? '' : commonStyles)}
   cursor: ${props => (props.disabled ? 'default' : 'pointer')};

  ${props =>
    props.disabled
      ? ''
      : `&:hover {
    background: ${tinycolor(colors.hover)
      .darken(5)
      .toString()};
  }`}

  &:active {
    background: ${tinycolor(colors.hover)
      .darken(10)
      .toString()};
  }

  ${props => (props.looksLikeButton ? 'border-color: #ccc' : '')};
  ${props => (props.additionalStyles ? props.additionalStyles : '')};
`;

const StyledTextarea = styled.textarea`
  /* min-width: unset; */
  /* width: unset; */
  vertical-align: middle;
  line-height: unset;
  ${commonStyles};
`;

type Props = {
  canBeBlank: boolean,
  children: Component<*>,
  looksLikeButton: boolean,
  submit: (value: string) => mixed,
  placeholder?: string,
  placeholderIsDefaultValue?: boolean,
};

/* 💁 aka MagicButton */
export class InputFromButton extends Component<
  Props,
  { isInput: boolean, width: number },
> {
  state = {
    isInput: false,
  };

  transformIntoInput = () => {
    this.setState(
      { isInput: true /* width: this.button.getBoundingClientRect().width */ },
      () => {
        this.transformedInput.focus();
        this.transformedInput.setSelectionRange(
          0,
          this.transformedInput.value.length,
        );
      },
    );
  };

  onKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.props.canBeBlank || e.target.value.length > 0) {
        this.props.submit(e.target.value);
        this.transformIntoButton();
      }
    }
  };

  transformIntoButton = () => {
    this.setState({ isInput: false });
  };

  setTextareaSize = ({ width, height }) => {
    this.setState({
      width,
      height,
    });
  };

  render() {
    return this.state.isInput === false ? (
      <Measure
        bounds
        onResize={contentRect => {
          /* 🤔 I feel like this shouldn't be necessary, but otherwise I get stuck in a render loop.bind.. */
          if (
            // contentRect.bounds.width !== this.state.textareaWidth ||
            contentRect.bounds.height !== this.state.height
          ) {
            this.setTextareaSize(contentRect.bounds);
          }
        }}
      >
        {({ measureRef }) => (
          <Button
            innerRef={b => {
              measureRef(b);
              this.button = b;
            }}
            onClick={this.transformIntoInput}
            looksLikeButton={this.props.looksLikeButton}
          >
            {this.props.children}
          </Button>
        )}
      </Measure>
    ) : (
      <StyledTextarea
        style={{
          width: `${this.state.width}px`,
          height: `${this.state.height}px`,
        }}
        placeholder={this.props.placeholder || this.props.children}
        onBlur={this.transformIntoButton}
        onKeyPress={this.onKeyPress}
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
