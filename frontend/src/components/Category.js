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

import type { Category as CategoryType } from 'types/Category';

const Category = ({ name, color }) => (
  <div>
    {name}
    <ToggleButton toggles={toggle => <ColorPicker key="color-picker" />}>
      <ColorCircle background={color} />
    </ToggleButton>
  </div>
);

type Props = {
  categories: Category[],
  addNewCategory: (name: string, color: string) => mixed,
  addExistingCategory: (id: string) => mixed,
};

type State = {
  colorPickerVisible: boolean,
  color: string,
  name: ?string,
};

export class AddCategory extends Component<Props, State> {
  state = {
    colorPickerVisible: false,
    color: colors.flames.main,
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
    return (
      <div>
        <InputFromButton looksLikeButton submit={this.showColorPicker}>
          Add Category
        </InputFromButton>
        <Downshift onChange={this.selectExistingCategory}>
          {({
            getInputProps,
            getItemProps,
            getLabelProps,
            isOpen,
            inputValue,
            highlightedIndex,
            selectedItem,
          }) => (
            <div>
              <label {...getLabelProps()}>Enter a fruit</label>
              <input {...getInputProps()} />
              {isOpen
                ? <div>
                  {this.props.categories
                    .filter(i => !inputValue || i.name.includes(inputValue))
                    .map((item, index) => (
                      <div
                        {...getItemProps({
                          key: item.id,
                          index,
                          item,
                          style: {
                            backgroundColor: highlightedIndex === index
                              ? 'lightgray'
                              : 'white',
                            fontWeight: selectedItem === item
                              ? 'bold'
                              : 'normal',
                          },
                        })}
                      >
                        {item.name}
                      </div>
                    ))}
                </div>
                : null}
            </div>
          )}
        </Downshift>
        <Popup
          isOpen={this.state.colorPickerVisible}
          close={this.closeColorPicker}
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
