// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createTodo, beginTodo } from 'actions';
import Panel from 'components/Panel';
import { InputFromButton } from 'components/Button';
import Todo from 'components/Todo';

class Todos extends Component {
  createTodo = name => {
    this.props.createTodo(name);
  };
  render() {
    return (
      <Panel style={{ position: 'absolute', bottom: 0, right: 0 }}>
        <h1>To Dos List</h1>
        <InputFromButton submit={this.createTodo}>New Item</InputFromButton>
        <ul>
          {this.props.todos &&
            this.props.todos.map(todo => (
              <Todo
                key={todo.name}
                beginTodo={this.props.beginTodo}
                todo={todo}
              />
            ))}
        </ul>
      </Panel>
    );
  }
}

export default connect(null, dispatch => ({
  createTodo: (name, description = '') =>
    dispatch(createTodo(name, description)),
  beginTodo: ({ todo_id, thread_id, timestamp, name, description = '' }) =>
    dispatch(beginTodo({ todo_id, thread_id, timestamp, name, description })),
}))(Todos);
