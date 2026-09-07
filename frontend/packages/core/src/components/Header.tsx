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
  gap: 4px;
  height: ${layout.headerHeight};
  box-sizing: border-box;

  > * {
    min-width: 0;
  }

  /* Only header chrome — not the traces dropdown nested inside ToggleButton. */
  > button,
  > textarea {
    font-weight: bold;
    font-size: large;
  }

  h1 {
    margin: 0;
    min-width: 0;
    text-align: center;
    font-size: 2em;
    color: ${tinycolor(colors.background)
      .darken(25)
      .toString()};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    justify-content: flex-start;
    gap: 4px;
    height: 44px;
    padding: 4px;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }

    > * {
      flex: 0 0 auto;
    }

    > button {
      min-height: 34px;
      font-size: 12px;
    }

    > textarea {
      min-height: 34px;
      font-size: 16px;
    }

    h1 {
      max-width: 40vw;
      font-size: 14px;
      line-height: 34px;
      text-align: left;
    }
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