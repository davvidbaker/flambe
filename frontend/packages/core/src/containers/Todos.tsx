import React, { Component, type ReactNode } from 'react';
import { connect } from 'react-redux';

import { createTodo } from '../actions';
import Panel from '../components/Panel';
import { InputFromButton } from '../components/Button';
import Todo from '../components/Todo';
import type { Todo as TodoModel } from '../types/Todo';

interface Props { createTodo: (name: string, description?: string) => unknown; todos?: TodoModel[] }

class Todos extends Component<Props> {
  createTodo = (name: string): void => {
    this.props.createTodo(name);
  };
  render(): ReactNode {
    return (
      <Panel style={{ position: 'absolute', bottom: 0, right: 0 }}>
        <h1>To Dos List</h1>
        <InputFromButton submit={this.createTodo}>New Item</InputFromButton>
        <ul>
          {this.props.todos &&
            this.props.todos.map(todo => (
              <Todo
                key={todo.name}
                todo={todo}
              />
            ))}
        </ul>
      </Panel>
    );
  }
}

export default connect(null, dispatch => ({
  createTodo: (name: string, description = '') =>
    dispatch(createTodo(name, description)),
}))(Todos);
