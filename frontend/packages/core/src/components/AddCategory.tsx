import React, { Component, type ReactNode } from 'react';

import { InputFromButton } from './Button';
import Fuzzy from './Fuzzy';
import { colors } from '../styles';
import Popup from './Popup';
import ColorPicker from './ColorPicker';
import type { Category as CategoryType } from '../types/Category';
import type { EntityId } from '../types/ids';

type Props = {
  categories: CategoryType[];
  addNewCategory: (name: string, color: string, optimistic?: boolean) => unknown;
  addExistingCategory: (id: EntityId) => unknown;
};

type State = {
  colorPickerVisible: boolean;
  color_background: { hex: string };
  name: string | null;
  colorPickerFlavor: 'background';
};

export class AddCategory extends Component<Props, State> {
  state: State = {
    colorPickerVisible: false,
    color_background: { hex: colors.flames.main },
    name: null,
    colorPickerFlavor: 'background'
  };

  submit = (name: string): void => {
    this.showColorPicker(name);
  };

  showColorPicker = (name: string): void => {
    this.setState({
      name
    });
    this.setState({ colorPickerVisible: true });
  };

  closeColorPicker = (): void => {
    this.setState({ colorPickerVisible: false });
    this.props.addNewCategory(
      this.state.name ?? '',
      this.state.color_background.hex,
      true
    );
  };

  selectExistingCategory = ({ id }: CategoryType): void => {
    this.props.addExistingCategory(id);
  };

  // idk what shape of color object is 🤷‍
  setColor = (color: { hex: string }): void => {
    this.setState({ color_background: color });
  };

  render(): ReactNode {
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
