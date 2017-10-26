// @flow

import React, { Component } from 'react';
import { compose, gql, graphql } from 'react-apollo';
// flow-ignore
import Panel from 'components/Panel';
import { InputFromButton } from 'components/Button';
import { AllTodos } from 'containers/App';
import Todo from 'components/Todo';

// mutation returns an event!
// ⚠️ not sure if using TodocategoriesCategory is correct. I'm not really categories yet.
const SparkTodo = gql`
mutation SparkTodo($timestamp: DateTime!, $userId: ID! $message: String, $todoName: String!, $todoDescription: String, $todoCategories: [TodocategoriesCategory!]) {
  createEvent(
    timestamp: $timestamp,
    phase: "S",
    todo: {
      userId: $userId,    
      name: $todoName,
      description: $todoDescription,
      categories: $todoCategories
    },
    message: $message
  ) {
    id
    timestamp
    todo {
      id
      name
      description
      event {
        id
      }
      categories {
        id
        name
        color
      }
    }
  }
}
`;

class Todos extends Component {
  submitNewTodo = name => {
    console.log('submitting todo');
    const ts = new Date();
    this.props.sparkTodo({
      variables: {
        userId: this.props.userId,
        timestamp: ts.toISOString(),
        message: '',
        todoName: name,
        todoDescription: '', // ⚠️ implement
        todoCategories: [],
      },
    });
  };
  render() {
    return (
      <Panel>
        <h1>To Dos List</h1>
        <InputFromButton submit={this.submitNewTodo}>New Item</InputFromButton>
        <ul>
          {this.props.todos &&
            this.props.todos.map(todo => <Todo key={todo.name} todo={todo} />)}
        </ul>
      </Panel>
    );
  }
}

export default graphql(SparkTodo, {
  name: 'sparkTodo',
  options: {
    update: (store, { data: { createEvent } }) => {
      // Read the data from our cache for this query.
      const data = store.readQuery({
        query: AllTodos,
        variables: {
          user: 'cj75obgc8kecq0120mb7l3bej',
        },
      });

      // Add our newtodotrace from the mutation to the end of the todos list.
      data.User.todos.push(createEvent.todo);

      // Write our data back to the cache.
      store.writeQuery({ query: AllTodos, data });
    },
  },
})(Todos);
