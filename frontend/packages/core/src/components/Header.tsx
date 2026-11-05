import React from 'react';
import styled from 'styled-components';
import tinycolor from 'tinycolor2';

import ToggleButton from './ToggleButton';
import AppModal, { useMobileLayout } from './AppModal';
import TraceThreadFilter from './TraceThreadFilter';
import { InputFromButton } from './Button';
import TraceList from './TraceList';
import { colors, layout } from '../styles';
import { formatShortcut } from '../utilities/keyboardShortcuts';
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
  /** Opens the command palette (same as Mod+Shift+P). */
  onOpenCommander: () => unknown;
  selectTrace: (trace: Trace) => unknown;
  traces: Trace[];
}

function MobileHeader(props: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return <>
    <header data-mobile-header="true" style={{ display: 'flex', alignItems: 'center', gap: 8,
      padding: '4px 8px', minHeight: 52, flexShrink: 0, boxSizing: 'border-box', background: '#eee' }}>
      <select aria-label="Current trace" value={String(props.currentTrace?.id ?? '')}
        style={{ flex: 1, minWidth: 0, height: 44, fontSize: 16 }}
        onChange={event => {
          const trace = props.traces.find(item => String(item.id) === event.target.value);
          if (trace) props.selectTrace(trace);
        }}>
        {!props.currentTrace && <option value="">Choose trace</option>}
        {props.traces.map(trace => <option key={trace.id} value={String(trace.id)}>{trace.name}</option>)}
      </select>
      <button type="button" aria-label="Command palette" style={{ minHeight: 44 }} onClick={props.onOpenCommander}>＋</button>
      <button type="button" aria-label="Workspace menu" style={{ minHeight: 44 }} onClick={() => setMenuOpen(true)}>Menu</button>
    </header>
    <AppModal contentLabel="Workspace menu" isOpen={menuOpen} onRequestClose={() => setMenuOpen(false)}
      chrome={<div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <h2 style={{ margin: 0 }}>Workspace</h2><button type="button" style={{ minHeight: 44 }} onClick={() => setMenuOpen(false)}>Done</button>
      </div>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
        <TraceThreadFilter />
        <InputFromButton submit={props.createMantra} placeholderIsDefaultValue>{props.currentMantra || 'Note to self'}</InputFromButton>
        <TraceList traces={props.traces} currentTrace={props.currentTrace} selectTrace={props.selectTrace}
          deleteTrace={props.deleteTrace} deleteCurrentTrace={props.deleteCurrentTrace} toggle={() => setMenuOpen(false)} />
        <button type="button" style={{ minHeight: 44 }} onClick={props.logout}>Log out</button>
      </div>
    </AppModal>
  </>;
}

const Header = (props: Props) => {
  const mobile = useMobileLayout();
  return mobile ? <MobileHeader {...props} /> : <DesktopHeader {...props} />;
};

const DesktopHeader = ({
  traces,
  currentTrace,
  selectTrace,
  deleteTrace,
  deleteCurrentTrace,
  currentMantra,
  createMantra,
  onOpenCommander,
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
    <button
      type="button"
      onClick={onOpenCommander}
      title="Command palette"
      aria-label="Command palette"
    >
      {formatShortcut(['Mod', 'Shift', 'P'])}
    </button>
    <button type="button" onClick={logout}>Log out</button>
  </StyledHeader>
);

export default Header;
