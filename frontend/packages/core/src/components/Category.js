// @flow
import React, { Component } from 'react';

import styled from 'styled-components';

import ColorPicker from './ColorPicker';
import ColorCircle from './ColorCircle';
import Popup from './Popup';

import type { Category as CategoryType } from '../types/Category';

const Preview = styled.div`
  font-size: 12px;
  padding: 5px;
  display: inline-block;
  background-color: ${props => props.background};
  color: ${props => props.color};
`;

class Category extends Component<{
  id: number,
  name: string,
  color_background: string,
  color_text: string,
  updateCategory: () => mixed
}> {
  state = {
    color_background: null,
    color_text: null,
    colorPickerVisible: false,
    colorPickerFlavor: null
  };

  constructor(props) {
    super(props);
    this.state = {
      color_background: props.color_background,
      color_text: props.color_text || '#000000',
      colorPickerVisible: false,
      colorPickerFlavor: null
    };
  }

  setColor = color => {
    this.setState({ [`color_${this.state.colorPickerFlavor}`]: color.hex });
  };

  closeColorPicker = () => {
    this.props.updateCategory(this.props.id, {
      color_background: this.state.color_background,
      color_text: this.state.color_text
    });
    this.setState({ colorPickerVisible: false });
  };

  openColorPicker = colorPickerFlavor => {
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
