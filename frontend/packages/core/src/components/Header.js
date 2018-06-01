import React from 'react';
import styled from 'styled-components';
import tinycolor from 'tinycolor2';

import ToggleButton from './ToggleButton';
import { InputFromButton } from './Button';
import TraceList from './TraceList';
import { colors, layout } from '../styles';

const StyledHeader = styled.header`
  font-weight: bold;
  font-size: large;
  width: 100%;
  padding: 5px;
  background: #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${layout.headerHeight};
  box-sizing: border-box;

  input,
  button {
    font-weight: bold;
    font-size: large;
  }

  h1 {
    margin: 0;
    /* flex: 1; */
    text-align: center;
    font-size: large;
    color: ${tinycolor(colors.background)
    .darken(25)
    .toString()};
  }
`;

const Header = ({
  traces,
  currentTrace,
  selectTrace,
  deleteTrace,
  deleteCurrentTrace,
  currentMantra,
  createMantra
}) => (
  <StyledHeader>
    {traces && (
      <ToggleButton
        toggles={toggle => (
          <TraceList
            key="traces-list"
            traces={traces}
            toggle={toggle}
            selectTrace={selectTrace}
            currentTrace={currentTrace}
            deleteCurrentTrace={deleteCurrentTrace}
            deleteTrace={deleteTrace}
          />
        )}
      >
        Traces
      </ToggleButton>
    )}
    <InputFromButton submit={createMantra} placeholderIsDefaultValue>
      {currentMantra || 'Note to self'}
    </InputFromButton>
    {currentTrace && <h1>{currentTrace.name}</h1>}
    {/* <div style={{ width: '50px' }} /> */}
  </StyledHeader>
);

export default Header;
