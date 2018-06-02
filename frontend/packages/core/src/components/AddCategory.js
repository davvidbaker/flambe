import React, { Component } from 'react';

import { InputFromButton } from './Button';
import Fuzzy from './Fuzzy';
import { colors } from '../styles';
import Popup from './Popup';
import ColorPicker from './ColorPicker';
import type { Category as CategoryType } from '../types/Category';

type Props = {
  categories: Category[],
  addNewCategory: (name: string, color: string) => mixed,
  addExistingCategory: (id: number) => mixed
};

type State = {
  colorPickerVisible: boolean,
  color_background: string,
  color_text: string,
  name: ?string,
  colorPickerFlavor: string
};

export class AddCategory extends Component<Props, State> {
  state = {
    colorPickerVisible: false,
    color_background: { hex: colors.flames.main },
    name: null,
    colorPickerFlavor: 'background'
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
    this.props.addNewCategory(
      this.state.name,
      this.state.color_background.hex,
      true
    );
  };

  selectExistingCategory = ({ id, name, color }: CategoryType) => {
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
              background: cat.color_background || colors.flames.main,
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
              color={this.state.color_background}
              onChangeComplete={this.setColor}
            />
          )}
        </Popup>
      </div>
    );
  }
}
export default AddCategory;
