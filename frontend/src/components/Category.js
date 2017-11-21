// @flow

import React, { Component } from 'react';
// flow-ignore
import Downshift from 'downshift';

import ColorPicker from 'components/ColorPicker';
import ColorCircle from 'components/ColorCircle';
import ToggleButton from 'components/ToggleButton';
import Popup from 'components/Popup';
import { InputFromButton } from 'components/Button';
import { colors } from 'styles';
import Fuzzy from 'components/Fuzzy';

import type { Category as CategoryType } from 'types/Category';

class Category extends Component<{
  id: number,
  name: string,
  color: string,
  updateCategory: () => mixed,
}> {
  state = { color: null, colorPickerVisible: false };

  componentWillMount() {
    this.setState({ color: this.props.color });
  }

  setColor = color => {
    this.setState({ color: color.hex });
  };

  closeColorPicker = () => {
    console.log('closing color picker');
    this.props.updateCategory(this.props.id, { color: this.state.color });
    this.setState({ colorPickerVisible: false });
  };

  openColorPicker = () => {
    // if (this.state.colorPickerVisible) {
    //   this.props.updateCategory(this.state.color);
    // }
    this.setState({ colorPickerVisible: !this.state.colorPickerVisible });
  };

  render() {
    return (
      <div>
        {this.props.name}
        <Popup
          isOpen={this.state.colorPickerVisible}
          onClose={this.closeColorPicker}
          key="color-picker-popup"
        >
          {() => (
            <ColorPicker
              color={this.state.color}
              onChangeComplete={this.setColor}
            />
          )}
        </Popup>

        <button onClick={this.openColorPicker}>
          <ColorCircle background={this.props.color} />
        </button>
      </div>
    );
  }
}

type Props = {
  categories: Category[],
  addNewCategory: (name: string, color: string) => mixed,
  addExistingCategory: (id: number) => mixed,
};

type State = {
  colorPickerVisible: boolean,
  color: string,
  name: ?string,
};

export class AddCategory extends Component<Props, State> {
  state = {
    colorPickerVisible: false,
    color: { hex: colors.flames.main },
    name: null,
  };

  submit = (name: string) => {
    this.showColorPicker(name);
  };

  showColorPicker = (name: string) => {
    this.setState({
      name,
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
    this.setState({ color });
  };

  render() {
    console.log('this.props.categories', this.props.categories);
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
              background: cat.color || colors.flame.main,
              copy: ' ', // 👈 U+2003 EM space
            },
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
