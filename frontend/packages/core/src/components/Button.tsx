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
  /** Open already as an input and focus (e.g. after scheduling a new activity). */
  startAsInput?: boolean;
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
  didAutoFocus = false;
  state: State = {
    height: 0,
    isInput: Boolean(this.props.startAsInput),
    width: 0,
  };

  focusInput = (element: HTMLTextAreaElement | null = this.transformedInput): void => {
    if (!element) return;
    element.focus();
    element.setSelectionRange(0, element.value.length);
  };

  transformIntoInput = (): void => {
    this.setState({ isInput: true }, () => {
      this.focusInput();
    });
  };

  componentDidMount(): void {
    if (!this.state.isInput) return;
    // react-modal focuses the dialog after open; steal focus back onto the name.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.focusInput());
    });
  }

  onKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (this.props.canBeBlank || event.currentTarget.value.length > 0) {
      this.props.submit(event.currentTarget.value);
      this.transformIntoButton();
    }
  };

  /** Keep document-level Trace/Timeline shortcuts from stealing edit keys (e.g. E → end). */
  stopShortcutKeys = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    event.stopPropagation();
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
        style={{ width: `${this.state.width || 160}px`, height: `${this.state.height || 28}px` }}
        placeholder={placeholder || childText}
        onBlur={this.transformIntoButton}
        onKeyDown={this.stopShortcutKeys}
        onKeyUp={this.stopShortcutKeys}
        onKeyPress={this.onKeyPress}
        defaultValue={placeholderIsDefaultValue ? placeholder || childText : undefined}
        ref={element => {
          this.transformedInput = element;
          if (element && this.state.isInput && !this.didAutoFocus) {
            this.didAutoFocus = true;
            this.focusInput(element);
          }
        }}
      />
    );
  }
}

export default Button;
