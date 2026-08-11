import React, { Component, type KeyboardEvent, type ReactNode } from 'react';
import styled from 'styled-components';
import tinycolor from 'tinycolor2';

import { colors } from '../styles';
import Measure, { type Bounds } from './Measure';

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

interface ButtonStyleProps {
  additionalStyles?: string;
  looksLikeButton?: boolean;
  unstyled?: boolean;
}

const Button = styled.button<ButtonStyleProps>`
  ${props => (props.unstyled ? '' : commonStyles)}
  cursor: ${props => (props.disabled ? 'default' : 'pointer')};

  ${props => props.disabled ? '' : `&:hover {
    background: ${tinycolor(colors.hover).darken(5).toString()};
  }`}

  &:active {
    background: ${tinycolor(colors.hover).darken(10).toString()};
  }

  ${props => (props.looksLikeButton ? 'border-color: #ccc' : '')};
  ${props => props.additionalStyles || ''};
`;

const StyledTextarea = styled.textarea`
  vertical-align: middle;
  line-height: unset;
  ${commonStyles};
`;

interface Props {
  canBeBlank?: boolean;
  children: ReactNode;
  looksLikeButton?: boolean;
  placeholder?: string;
  placeholderIsDefaultValue?: boolean;
  submit: (value: string) => unknown;
}

interface State {
  height: number;
  isInput: boolean;
  width: number;
}

/* Also known as MagicButton. */
export class InputFromButton extends Component<Props, State> {
  button: HTMLButtonElement | null = null;
  transformedInput: HTMLTextAreaElement | null = null;
  state: State = { height: 0, isInput: false, width: 0 };

  transformIntoInput = (): void => {
    this.setState({ isInput: true }, () => {
      this.transformedInput?.focus();
      this.transformedInput?.setSelectionRange(0, this.transformedInput.value.length);
    });
  };

  onKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (this.props.canBeBlank || event.currentTarget.value.length > 0) {
      this.props.submit(event.currentTarget.value);
      this.transformIntoButton();
    }
  };

  transformIntoButton = (): void => this.setState({ isInput: false });

  setTextareaSize = ({ width, height }: Bounds): void => this.setState({ width, height });

  render(): ReactNode {
    const { children, looksLikeButton, placeholder, placeholderIsDefaultValue } = this.props;
    const childText = typeof children === 'string' ? children : '';

    if (!this.state.isInput) {
      return (
        <Measure
          bounds
          onResize={({ bounds }) => {
            if (bounds.height !== this.state.height) this.setTextareaSize(bounds);
          }}
        >
          {({ measureRef }) => (
            <Button
              ref={element => {
                measureRef(element);
                this.button = element;
              }}
              onClick={this.transformIntoInput}
              looksLikeButton={looksLikeButton}
            >
              {children}
            </Button>
          )}
        </Measure>
      );
    }

    return (
      <StyledTextarea
        style={{ width: `${this.state.width}px`, height: `${this.state.height}px` }}
        placeholder={placeholder || childText}
        onBlur={this.transformIntoButton}
        onKeyPress={this.onKeyPress}
        defaultValue={placeholderIsDefaultValue ? placeholder || childText : undefined}
        ref={element => { this.transformedInput = element; }}
      />
    );
  }
}

export default Button;
