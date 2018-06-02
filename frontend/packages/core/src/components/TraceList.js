import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import Dropdown from './Dropdown';
import NewTrace from './NewTrace';

import { layout } from '../styles';

const TraceListItem = ({
  trace,
  deleteTrace,
  toggle,
  selectTrace,
  current,
  deleteCurrentTrace
}) => (
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
  deleteCurrentTrace
}) => (
  <Dropdown style={{ top: layout.headerHeight }}>
    {traces.map(trace => (
      <TraceListItem
        key={trace.id}
        trace={trace}
        toggle={toggle}
        selectTrace={selectTrace}
        current={currentTrace && trace.id === currentTrace.id}
        deleteCurrentTrace={
          currentTrace && trace.id === currentTrace.id && deleteCurrentTrace
        }
        deleteTrace={deleteTrace}
      />
    ))}
    <li style={{ textAlign: 'center' }}>
      <NewTrace />
    </li>
  </Dropdown>
);

export default TraceList;
