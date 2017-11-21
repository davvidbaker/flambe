import React, { Component } from 'react';
import PropTypes from 'prop-types';
import fuzzaldrin from 'fuzzaldrin-plus';
import Downshift from 'downshift';
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
  itemReturnKey = null,
}) => (
  <Downshift
    onChange={onChange}
    defaultInputValue=""
    defaultHighlightedIndex={0}
    itemToString={i => (i ? i[itemStringKey] : '')}
  >
    {({
      getInputProps,
      getItemProps,
      getLabelProps,
      highlightedIndex,
      inputValue,
      isOpen,
      selectedItem,
    }) => (
      <div style={{ position: 'relative' }}>
        <label {...getLabelProps()} />
        <input
          style={{ width: '100%' }}
          {...getInputProps({
            placeholder,
          })}
        />
        {isOpen && (
          <StyledResults>
            {/* 💁 fuzzaldrin returns an empty array if the input is an empty string, but I want to show all the options instead */}
            {(inputValue.length === 0
              ? items
              : fuzzaldrin.filter(items, inputValue, {
                key: itemStringKey,
              })
            ).map((item, index) => {
              console.log(item, item.label);
              return (
                <div
                  className="commander-result"
                  {...getItemProps({
                    key: itemStringKey ? item[itemStringKey] : item,
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
                    {inputValue.length === 0 ? (
                      <span>{item[itemStringKey]}</span>
                    ) : (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: fuzzaldrin.wrap(
                            item[itemStringKey],
                            inputValue,
                          ),
                        }}
                      />
                    )}
                  </div>
                  {item.shortcut && (
                    <div className="item-shortcut">
                      <span
                        className="item-shortcut"
                        style={{
                          textAlign: 'right',
                          color: 'steelblue',
                        }}
                      >
                        {item.shortcut}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </StyledResults>
        )}
      </div>
    )}
  </Downshift>
);

export default Fuzzy;
