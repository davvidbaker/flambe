// @flow

import React from 'react';
import type { Todo as TYPE_TODO } from 'types/Todo';

type Props = {
  todo: TYPE_TODO,
};

const Todo = ({ todo }: Props) => <li>{todo.name}</li>;

export default Todo;
