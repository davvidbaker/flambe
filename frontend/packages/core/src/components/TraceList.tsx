import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import tinycolor from 'tinycolor2';

import Dropdown from './Dropdown';
import NewTrace from './NewTrace';

import { colors, layout } from '../styles';
import type { Trace } from '../types/Trace';
import type { EntityId } from '../types/ids';

const TraceMenu = styled(Dropdown)`
  top: ${layout.headerHeight};
  left: 5px;
  width: 18rem;
  padding: 6px 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

  li {
    margin-bottom: 0;
  }

  button,
  textarea {
    font-size: 13px;
    font-weight: 600;
    min-width: 0;
  }
`;

const TraceRow = styled.li<{ $current?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: ${props => (props.$current ? colors['focus-activity-bg'] : 'transparent')};

  &:hover {
    background: ${colors['hover-activity-bg']};
  }
`;

const TraceName = styled(Link)<{ $current?: boolean }>`
  flex: 1;
  min-width: 0;
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: ${props => (props.$current ? 700 : 500)};

  &:hover {
    text-decoration: underline;
  }
`;

const DeleteTraceButton = styled.button`
  flex: 0 0 auto;
  margin: 0;
  padding: 2px 6px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: #888;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${colors.hover};
    color: ${colors.red};
  }
`;

const NewTraceRow = styled.li`
  display: flex;
  justify-content: center;
  padding: 8px 10px 4px;
  border-top: 1px solid ${tinycolor(colors.background).darken(10).toString()};
`;

interface TraceListItemProps {
  current: boolean;
  deleteTrace: (id: EntityId) => unknown;
  onDeleteCurrent: (id: EntityId) => void;
  selectTrace: (trace: Trace) => unknown;
  toggle: () => unknown;
  trace: Trace;
}

const TraceListItem = ({
  trace,
  deleteTrace,
  onDeleteCurrent,
  toggle,
  selectTrace,
  current,
}: TraceListItemProps) => (
  <TraceRow $current={current}>
    <TraceName
      $current={current}
      aria-current={current ? 'page' : undefined}
      onClick={() => {
        toggle();
        selectTrace(trace);
      }}
      to={`/traces/${trace.id}`}
    >
      {trace.name}
    </TraceName>
    <DeleteTraceButton
      type="button"
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();
        if (current) {
          onDeleteCurrent(trace.id);
        } else {
          deleteTrace(trace.id);
        }
      }}
    >
      Delete
    </DeleteTraceButton>
  </TraceRow>
);

const TraceList = ({
  traces,
  toggle,
  selectTrace,
  deleteTrace,
  currentTrace,
  deleteCurrentTrace,
}: {
  currentTrace?: Trace | null;
  deleteCurrentTrace: () => unknown;
  deleteTrace: (id: EntityId) => unknown;
  selectTrace: (trace: Trace) => unknown;
  toggle: () => unknown;
  traces: Trace[];
}) => {
  const navigate = useNavigate();

  const onDeleteCurrent = (id: EntityId) => {
    const remaining = traces.filter(trace => trace.id !== id);
    deleteCurrentTrace();
    deleteTrace(id);
    toggle();
    if (remaining[0]) {
      selectTrace(remaining[0]);
      navigate(`/traces/${remaining[0].id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <TraceMenu>
      {traces.map(trace => (
        <TraceListItem
          key={trace.id}
          trace={trace}
          toggle={toggle}
          selectTrace={selectTrace}
          current={Boolean(currentTrace && trace.id === currentTrace.id)}
          deleteTrace={deleteTrace}
          onDeleteCurrent={onDeleteCurrent}
        />
      ))}
      <NewTraceRow>
        <NewTrace />
      </NewTraceRow>
    </TraceMenu>
  );
};

export default TraceList;
