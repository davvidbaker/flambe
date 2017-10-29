import React, { Component } from 'react';
import { gql, graphql } from 'react-apollo';
import { connect } from 'react-redux';

import { AllTraces } from 'containers/App';
import { createTrace } from 'actions';

import { InputFromButton } from './Button';

const CreateTrace = gql`
  mutation CreateTraceWithMainThread($name: String!) {
    createTrace(userId: "cj75obgc8kecq0120mb7l3bej", name: $name, threads: { name: "Main" }) {
      id
      name
    }
  }
`;

class NewTrace extends Component {
  state = {
    isInput: false,
  };

  transformIntoInput = () => {
    this.setState({ isInput: true });
  };

  transformIntoButton = () => {
    this.setState({ isInput: false });
  };

  submitNewTrace = value => {
    console.log('submitting', value);
    this.props.createTrace(value);
    // this.props.createTrace({
    //   variables: {
    //     name: value,
    //   },
    // });
  };

  render() {
    return (
      <div>
        <InputFromButton submit={this.submitNewTrace}>
          New Trace
        </InputFromButton>
      </div>
    );
  }
}

const TraceSettings = () => (
  <div>
    <input type="text" placeholder="Trace Name" />
  </div>
);
/* 
export default graphql(CreateTrace, {
  name: 'createTrace',
  options: {
    update: (store, { data: { createTrace } }) => {
      // Read the data from our cache for this query.
      const data = store.readQuery({
        query: AllTraces,
        variables: {
          user: 'cj75obgc8kecq0120mb7l3bej',
        },
      });

      // Add our new trace from the mutation to the end of the traces list.
      data.User.traces.push(createTrace);

      // Write our data back to the cache.
      store.writeQuery({ query: AllTraces, data });
    },
  },
})
 */

export default connect(null, dispatch => ({
  createTrace: name => dispatch(createTrace(name)),
}))(NewTrace);
