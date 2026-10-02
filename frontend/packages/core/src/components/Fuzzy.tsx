import React from 'react';
import fuzzaldrin from 'fuzzaldrin-plus';
import { useCombobox } from 'downshift';
import styled from 'styled-components';

import Button from './Button';

export interface FuzzyItem {
  [key: string]: unknown;
  label?: { background?: string; copy: React.ReactNode };
  shortcut?: React.ReactNode;
}
interface Props<T extends FuzzyItem> {
  autoFocus?: boolean;
  onBlur?: () => void;
  onChange: (item: T) => void;
  placeholder?: string;
  items: T[];
  itemStringKey: keyof T & string;
}

interface MagicFuzzyProps<T extends FuzzyItem> extends Omit<Props<T>, 'autoFocus' | 'onBlur'> {
  children: React.ReactNode;
}

const Wrap = styled.div<{ $open: boolean }>`
  position: relative;
  z-index: ${props => (props.$open ? 8 : 'auto')};
`;

const StyledResults = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 8;
  max-height: 180px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  visibility: ${props => (props.$open ? 'visible' : 'hidden')};
  pointer-events: ${props => (props.$open ? 'auto' : 'none')};

  .commander-result {
    padding: 6px 8px;
    display: flex;
    cursor: pointer;
  }

  .commander-result-item {
    flex: auto;
    min-width: 0;
  }
`;

const Fuzzy = <T extends FuzzyItem,>({
  autoFocus = false,
  onBlur,
  onChange,
  placeholder,
  items,
  itemStringKey,
}: Props<T>) => {
  const itemToString = (item: T | null): string => item ? String(item[itemStringKey] ?? '') : '';
  const [filterValue, setFilterValue] = React.useState('');
  const filteredItems = filterValue.length === 0
    ? items
    : fuzzaldrin.filter(items, filterValue, { key: itemStringKey as never });
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
    selectedItem: null,
    defaultHighlightedIndex: 0,
    itemToString,
    onInputValueChange: ({ inputValue }) => setFilterValue(inputValue || ''),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        onChange(selectedItem);
        setFilterValue('');
      }
    },
  });

  const menuOpen = isOpen && filteredItems.length > 0;

  return (
    <Wrap $open={menuOpen}>
      <label {...getLabelProps()} />
      <input
        autoFocus={autoFocus}
        style={{ width: '100%' }}
        {...getInputProps({ placeholder, 'aria-label': placeholder, onBlur })}
      />
      <StyledResults {...getMenuProps()} $open={menuOpen}>
        {menuOpen && filteredItems.map((item, index) => (
          <div
            className="commander-result"
            key={String(item[itemStringKey] ?? index)}
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
                <span>{String(item[itemStringKey] ?? '')}</span>
              ) : (
                <span
                  dangerouslySetInnerHTML={{
                    __html: fuzzaldrin.wrap(String(item[itemStringKey] ?? ''), filterValue),
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
    </Wrap>
  );
};

export default Fuzzy;

/** A value button that turns into a fuzzy autocomplete while it is being changed. */
export const MagicFuzzy = <T extends FuzzyItem,>({
  children,
  onChange,
  ...fuzzyProps
}: MagicFuzzyProps<T>) => {
  const [editing, setEditing] = React.useState(false);

  if (!editing) {
    return (
      <Button onClick={() => setEditing(true)}>
        {children}
      </Button>
    );
  }

  return (
    <Fuzzy
      {...fuzzyProps}
      autoFocus
      onBlur={() => setEditing(false)}
      onChange={item => {
        onChange(item);
        setEditing(false);
      }}
    />
  );
};
