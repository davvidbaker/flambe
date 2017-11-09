import React from 'react';
import Downshift from 'downshift';
import matchSorter from 'match-sorter';
import styled from 'styled-components';

const Item = styled.div`
  ${({ isActive, isSelected }) => `
  background-color: ${isActive ? 'red' : 'white'};
  font-weigth: ${isSelected ? 'bold' : 'normal'};

  &:hover, &:focus {
    border: 2px solid blue;
    box-shadow: 0 2px 3px 0 rgba(34,36,38,.15);
`};
`;

const BasicAutocomplete = ({
  items,
  onChange,
  label,
  placeholder,
  defaultInputValue,
}) => (
  <Downshift defaultInputValue={defaultInputValue} onChange={onChange}>
    {({
      getInputProps,
      getItemProps,
      getLabelProps,
      highlightedIndex,
      inputValue,
      isOpen,
      selectedItem,
    }) => (
      <div>
        <label {...getLabelProps()}>{label}</label>
        <input {...getInputProps({ placeholder })} />
        {isOpen && (
          <div
            style={{
              border: '1px solid rgba(34,36,38,.15)',
              maxHeight: 100,
              overflowY: 'scroll',
            }}
          >
            {(inputValue
              ? matchSorter(items, inputValue)
              : items
            ).map((item, index) => (
              <Item
                key={item}
                {...getItemProps({
                  item,
                  isActive: highlightedIndex === index,
                  isSelected: selectedItem === item,
                })}
              >
                {item}
              </Item>
            ))}
          </div>
        )}
      </div>
    )}
  </Downshift>
);

export default BasicAutocomplete;
