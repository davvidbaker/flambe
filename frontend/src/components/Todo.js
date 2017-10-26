// @flow

import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
// flow-ignore
import { gql, graphql } from 'react-apollo';

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

      // only main thread right now
      const mainThreadId = dropResult.threads.find(
        thread => thread.name === 'Main'
      ).id;

      const garbage = JSON.stringify({
        threadId: mainThreadId,
        traceId: dropResult.traceId,
      });

      props.markTodo({
        variables: {
          todoId: todo.id,
          garbage,
        },
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
  markTodo: () => mixed,
};

// flow-ignore
@DragSource(ItemTypes.TODO, draggableSource, collect)
class Todo extends Component<Props> {
  render() {
    if (this.props.isDragging === 'asdf') return null;
    return this.props.connectDragSource(<li>{this.props.todo.name}</li>);
  }
}

// Triggers server-side function cascacde 💥 -> 💥 -> 💥
const MarkTodo = gql`
  mutation MarkTodo($todoId: ID!, $garbage: String!) {
    updateTodo(id: $todoId, garbage: $garbage) {
      id
      garbage
    }
  }
`;

export default graphql(MarkTodo, {
  name: 'markTodo',
  options: {
    // not very efficient ⚠️ think about this . Is this right? I don't think so.
    refetchQueries: ['AllEventsInTrace', 'AllTodos'],
  },
})(Todo);
