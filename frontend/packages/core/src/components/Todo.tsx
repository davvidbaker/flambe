import React from 'react';

import type { Todo as TodoModel } from '../types/Todo';

interface Props {
  todo: TodoModel;
}

const Todo = ({ todo }: Props) => <li>{todo.name}</li>;

export default Todo;
