import React, { Component } from 'react';

import styled from 'styled-components';

import ColorPicker from './ColorPicker';
import ColorCircle from './ColorCircle';
import Popup from './Popup';

const Preview = styled.div<{ background: string; color: string }>`
  font-size: 12px;
  padding: 5px;
  display: inline-block;
  background-color: ${props => props.background};
  color: ${props => props.color};
`;

interface Props { id: number; name: string; color_background: string; color_text: string; updateCategory: (id: number, colors: { color_background: string; color_text: string }) => unknown }
interface State { color_background: string; color_text: string; colorPickerVisible: boolean; colorPickerFlavor: 'background' | 'text' | null }

class Category extends Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      color_background: props.color_background,
      color_text: props.color_text || '#000000',
      colorPickerVisible: false,
      colorPickerFlavor: null
    };
  }

  setColor = (color: { hex: string }): void => {
    if (this.state.colorPickerFlavor === 'background') this.setState({ color_background: color.hex });
    if (this.state.colorPickerFlavor === 'text') this.setState({ color_text: color.hex });
  };

  closeColorPicker = (): void => {
    this.props.updateCategory(this.props.id, {
      color_background: this.state.color_background,
      color_text: this.state.color_text
    });
    this.setState({ colorPickerVisible: false });
  };

  openColorPicker = (colorPickerFlavor: 'background' | 'text'): void => {
    // if (this.state.colorPickerVisible) {
    //   this.props.updateCategory(this.state.color);
    // }
    this.setState({
      colorPickerVisible: !this.state.colorPickerVisible,
      colorPickerFlavor
    });
  };

  render() {
    return (
      <div>
        <Preview
          background={this.props.color_background}
          color={this.props.color_text}
        >
          {this.props.name}
        </Preview>
        <Popup
          isOpen={this.state.colorPickerVisible}
          onClose={this.closeColorPicker}
          key="color-picker-popup"
        >
          {() => (
            <ColorPicker
              color={
                this.state.colorPickerFlavor === 'text'
                  ? this.state.color_text
                  : this.state.color_background
              }
              onChangeComplete={this.setColor}
            />
          )}
        </Popup>

        <button onClick={() => this.openColorPicker('background')}>
          <ColorCircle background={this.props.color_background} />
        </button>
        <button onClick={() => this.openColorPicker('text')}>
          <ColorCircle background={this.props.color_text || '#000000'} />
        </button>
      </div>
    );
  }
}

export default Category;
