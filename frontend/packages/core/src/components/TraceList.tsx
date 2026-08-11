import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import Dropdown from './Dropdown';
import NewTrace from './NewTrace';

import { layout } from '../styles';
import type { Trace } from '../types/Trace';
import type { EntityId } from '../types/ids';

interface TraceListItemProps {
  current: boolean;
  deleteTrace: (id: EntityId) => unknown;
  selectTrace: (trace: Trace) => unknown;
  toggle: () => unknown;
  trace: Trace;
}

const TraceListItem = ({
  trace,
  deleteTrace,
  toggle,
  selectTrace,
  current,
}: TraceListItemProps) => (
  <li>
    <Link
      onClick={() => {
        toggle();
        selectTrace(trace);
      }}
      to={`/traces/${trace.id}`}
    >
      {trace.name}
    </Link>
    <button
      onClick={() => {
        deleteTrace(trace.id);
      }}
    >
      {current ? (
        <Link to={'/'} replace>
          delete me
        </Link>
      ) : (
        'delete'
      )}
    </button>
  </li>
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
}) => (
  <Dropdown style={{ top: layout.headerHeight }}>
    {traces.map(trace => (
      <TraceListItem
        key={trace.id}
        trace={trace}
        toggle={toggle}
        selectTrace={selectTrace}
        current={Boolean(currentTrace && trace.id === currentTrace.id)}
        deleteTrace={deleteTrace}
      />
    ))}
    <li style={{ textAlign: 'center' }}>
      <NewTrace />
    </li>
  </Dropdown>
);

export default TraceList;
