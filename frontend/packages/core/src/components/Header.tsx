import React from 'react';
import styled from 'styled-components';
import tinycolor from 'tinycolor2';

import ToggleButton from './ToggleButton';
import TraceThreadFilter from './TraceThreadFilter';
import { InputFromButton } from './Button';
import TraceList from './TraceList';
import { colors, layout } from '../styles';
import type { Trace } from '../types/Trace';
import type { EntityId } from '../types/ids';

const StyledHeader = styled.header`
  position: relative;
  width: 100%;
  padding: 5px;
  background: #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${layout.headerHeight};
  box-sizing: border-box;

  /* Only header chrome — not the traces dropdown nested inside ToggleButton. */
  > button,
  > textarea {
    font-weight: bold;
    font-size: large;
  }

  h1 {
    margin: 0;
    /* flex: 1; */
    text-align: center;
    font-size: 2em;
    color: ${tinycolor(colors.background)
      .darken(25)
      .toString()};
  }
`;

interface Props {
  createMantra: (name: string) => unknown;
  currentMantra?: string;
  currentTrace?: Trace | null;
  deleteCurrentTrace: () => unknown;
  deleteTrace: (id: EntityId) => unknown;
  logout: () => unknown;
  selectTrace: (trace: Trace) => unknown;
  traces: Trace[];
}

const Header = ({
  traces,
  currentTrace,
  selectTrace,
  deleteTrace,
  deleteCurrentTrace,
  currentMantra,
  createMantra,
  logout,
}: Props) => (
  <StyledHeader>
    {traces && (
      <ToggleButton
        title="Toggle traces"
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
    <TraceThreadFilter />
    <InputFromButton submit={createMantra} placeholderIsDefaultValue>
      {currentMantra || 'Note to self'}
    </InputFromButton>
    {currentTrace && <h1>{currentTrace.name}</h1>}
    <button type="button" onClick={logout}>Log out</button>
  </StyledHeader>
);

export default Header;
