// @flow

import React, { Component } from 'react';
import ColorPicker from 'components/ColorPicker';
import ColorCircle from 'components/ColorCircle';
import Popup from 'components/Popup';
import { InputFromButton } from 'components/Button';
import { colors } from 'styles';
import Fuzzy from 'components/Fuzzy';
import styled from 'styled-components';

const Preview = styled.div`
  font-size: 12px;
  padding: 5px;
  display: inline-block;
  background-color: ${props => props.background};
  color: ${props => props.color};
`;

import type { Category as CategoryType } from 'types/Category';

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

type Props = {
  categories: Category[],
  addNewCategory: (name: string, color: string) => mixed,
  addExistingCategory: (id: number) => mixed
};

type State = {
  colorPickerVisible: boolean,
  color: string,
  name: ?string
};

export class AddCategory extends Component<Props, State> {
  state = {
    colorPickerVisible: false,
    color: { hex: colors.flames.main },
    name: null
  };

  submit = (name: string) => {
    this.showColorPicker(name);
  };

  showColorPicker = (name: string) => {
    this.setState({
      name
    });
    this.setState({ colorPickerVisible: true });
  };

  closeColorPicker = () => {
    this.setState({ colorPickerVisible: false });
    this.props.addNewCategory(this.state.name, this.state.color.hex, true);
  };

  selectExistingCategory = ({ id, name, color }: CategoryType) => {
    console.log('selected existing category', id, name, color);
    this.props.addExistingCategory(id);
  };

  // idk what shape of color object is 🤷‍
  setColor = (color: any) => {
    this.setState({ [`color_${this.state.colorPickerFlavor}`]: color });
  };

  render() {
    return (
      <div>
        <InputFromButton looksLikeButton submit={this.showColorPicker}>
          New Category
        </InputFromButton>
        <Fuzzy
          itemStringKey="name"
          onChange={this.selectExistingCategory}
          placeholder="Category"
          items={this.props.categories.map(cat => ({
            ...cat,
            label: {
              background: cat.color_background || colors.flame.main,
              copy: ' ' // 👈 U+2003 EM space
            }
          }))}
        />
        <Popup
          isOpen={this.state.colorPickerVisible}
          onClose={this.closeColorPicker}
        >
          {() => (
            <ColorPicker
              color={this.state.color}
              onChangeComplete={this.setColor}
            />
          )}
        </Popup>
      </div>
    );
  }
}

export default Category;
