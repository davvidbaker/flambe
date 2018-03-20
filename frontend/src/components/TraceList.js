import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import Dropdown from './Dropdown';
import NewTrace from './NewTrace';
import { AllTraces } from 'containers/App';
import { layout } from 'styles';

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
      {current ? <Link to={'/'} replace>delete me</Link> : 'delete'}
    </button>
  </li>
);

// const DeletableTraceListItem = graphql(DeleteTrace, {
//   name: 'deleteTrace',
//   options: {
//     update: (store, { data: { deleteTrace } }) => {
//       // Read the data from our cache for this query.
//       const data = store.readQuery({
//         query: AllTraces,
//         variables: {
//           user: 'cj75obgc8kecq0120mb7l3bej',
//         },
//       });

//       // Add our new trace from the mutation to the end of the traces list.
//       data.User.traces = data.User.traces.filter(
//         trace => trace.id !== deleteTrace.id
//       );

//       // Write our data back to the cache.
//       store.writeQuery({ query: AllTraces, data });
//     },
//   },
// })(TraceListItem);

const TraceList = ({
  traces,
  toggle,
  selectTrace,
  deleteTrace,
  currentTrace,
  deleteCurrentTrace,
}) => (
  <Dropdown style={{ top: layout.headerHeight }}>
    {traces.map(trace => (
      <TraceListItem
        key={trace.id}
        trace={trace}
        toggle={toggle}
        selectTrace={selectTrace}
        current={currentTrace && trace.id === currentTrace.id}
        deleteCurrentTrace={currentTrace && trace.id === currentTrace.id && deleteCurrentTrace}
        deleteTrace={deleteTrace}
      />
    ))}
    <li style={{ textAlign: 'center' }}>
      <NewTrace />
    </li>
  </Dropdown>
);

export default TraceList;
