import React from 'react';
import fuzzaldrin from 'fuzzaldrin-plus';
import { useCombobox } from 'downshift';
import styled from 'styled-components';

const StyledResults = styled.div`
  overflow-y: scroll;
  max-height: 100px;
  position: absolute;
  width: 100%;

  .commander-result {
    padding: 5px;
    display: flex;

    &:first-child {
      border-top: 1px solid #ccc;
    }
  }

  .commander-result-item {
    flex: auto;
  }
`;
const Fuzzy = ({
  onChange,
  placeholder,
  items,
  itemStringKey,
}) => {
  const itemToString = item => (item ? item[itemStringKey] : '');
  const [filterValue, setFilterValue] = React.useState('');
  const filteredItems = filterValue.length === 0
    ? items
    : fuzzaldrin.filter(items, filterValue, { key: itemStringKey });
  const {
    getInputProps,
    getItemProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    isOpen,
  } = useCombobox({
    items: filteredItems,
    inputValue: filterValue,
    defaultHighlightedIndex: 0,
    itemToString,
    onInputValueChange: ({ inputValue }) => setFilterValue(inputValue || ''),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onChange(selectedItem);
    },
  });

  return (
    <div style={{ position: 'relative' }}>
      <label {...getLabelProps()} />
      <input
        style={{ width: '100%' }}
        {...getInputProps({ placeholder })}
      />
      {isOpen && (
        <StyledResults {...getMenuProps()}>
          {filteredItems.map((item, index) => (
            <div
              className="commander-result"
              key={itemStringKey ? item[itemStringKey] : item}
              {...getItemProps({
                index,
                item,
                style: {
                  backgroundColor:
                    highlightedIndex === index ? '#f5f5f5' : 'white',
                },
              })}
            >
              <div className="commander-result-item">
                {item.label && (
                  <span
                    className="item-label"
                    style={{
                      background: item.label.background,
                      color: 'white',
                      padding: '1px 3px',
                      borderRadius: '2px',
                      marginRight: '5px',
                    }}
                  >
                    {item.label.copy}
                  </span>
                )}
                {filterValue.length === 0 ? (
                  <span>{item[itemStringKey]}</span>
                ) : (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: fuzzaldrin.wrap(item[itemStringKey], filterValue),
                    }}
                  />
                )}
              </div>
              {item.shortcut && (
                <div className="item-shortcut">
                  <span
                    className="item-shortcut"
                    style={{ textAlign: 'right', color: 'steelblue' }}
                  >
                    {item.shortcut}
                  </span>
                </div>
              )}
            </div>
          ))}
        </StyledResults>
      )}
    </div>
  );
};

export default Fuzzy;
