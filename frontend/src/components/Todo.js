// @flow

import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
// flow-ignore

import type { ConnectDragSource } from 'react-dnd';
import type { Todo as TYPE_TODO } from 'types/Todo';

export const ItemTypes = {
  TODO: 'TODO',
};

const draggableSource = {
  beginDrag(props) {
    console.log();
    return {
      todo: props.todo,
    };
  },

  endDrag(props, monitor) {
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();

    if (dropResult && dropResult.hit === 'flame-chart') {
      const todo = item.todo;

      const client_offset = monitor.getClientOffset();

      // /** ⚠️ change for multiple threads */
      // const mainThreadId = dropResult.threads.find(
      //   thread => thread.name === 'Main',
      // ).id;

      props.beginTodo({
        todo_id: item.todo.id,
        thread_id: dropResult.thread_id,
        name: item.todo.name,
        description: item.todo.description,
        timestamp: Date.now(),
      });
    }
  },
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  };
}

type Props = {
  todo: TYPE_TODO,
  connectDragSource: ConnectDragSource,
  isDragging: boolean,
  beginTodo: () => mixed,
};

// flow-ignore
@DragSource(ItemTypes.TODO, draggableSource, collect)
class Todo extends Component<Props> {
  render() {
    if (this.props.isDragging === 'asdf') return null;
    return this.props.connectDragSource(<li>{this.props.todo.name}</li>);
  }
}

export default Todo;
