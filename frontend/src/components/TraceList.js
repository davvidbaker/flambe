import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { gql, graphql } from 'react-apollo';

import Dropdown from './Dropdown';
import NewTrace from './NewTrace';
import { AllTraces } from 'containers/App';
import { layout } from 'styles';
// import DeleteTrace from './DeleteTrace';

// I don't think the events and thread are actually returned...
const DeleteTrace = gql`
  mutation DeleteTrace($id: ID!) {
    deleteTrace(id: $id) {
      id
      events {
        id
      }
      threads {
        id
      }
    }
  }
`;

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
      to={`/trace/${trace.id}`}
    >
      {trace.name}
    </Link>
    <button
      onClick={() => {
        // for local redux store
        deleteCurrentTrace();

        // operates on database
        deleteTrace({
          variables: { id: trace.id },
        });
      }}
    >
      {current ? <Link to={'/'} replace>delete me</Link> : 'delete'}
    </button>
  </li>
);

const DeletableTraceListItem = graphql(DeleteTrace, {
  name: 'deleteTrace',
  options: {
    update: (store, { data: { deleteTrace } }) => {
      // Read the data from our cache for this query.
      const data = store.readQuery({
        query: AllTraces,
        variables: {
          user: 'cj75obgc8kecq0120mb7l3bej',
        },
      });

      // Add our new trace from the mutation to the end of the traces list.
      data.User.traces = data.User.traces.filter(
        trace => trace.id !== deleteTrace.id
      );

      // Write our data back to the cache.
      store.writeQuery({ query: AllTraces, data });
    },
  },
})(TraceListItem);

const TraceList = ({
  traces,
  toggle,
  selectTrace,
  currentTrace,
  deleteCurrentTrace,
}) => (
  <Dropdown style={{ top: layout.headerHeight }}>
    {traces.map(trace => (
      <DeletableTraceListItem
        key={trace.id}
        trace={trace}
        toggle={toggle}
        selectTrace={selectTrace}
        current={currentTrace && trace.id === currentTrace.id}
        deleteCurrentTrace={currentTrace && trace.id === currentTrace.id && deleteCurrentTrace}
      />
    ))}
    <li style={{ textAlign: 'center' }}>
      <NewTrace />
    </li>
  </Dropdown>
);

export default TraceList;
