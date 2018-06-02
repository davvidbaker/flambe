// @flow

import React, { Component } from 'react';
import { DropTarget } from 'react-dnd';

import { ItemTypes } from '../components/Todo';
import StyledDropTarget from '../components/StyledDropTarget';

// ⚠️ rename, make more abstract
const todoTarget = {
  drop(props, monitor) {
    // ⚠️️️ ⚠️️️ ⚠️️️ ⚠️️️ hack for POC
    console.log('prippy props', props);
    return {
      hit: props.targetName,
      // ⚠️️️ ⚠️️️ ⚠️️️ ⚠️️️ hack for POC
      thread_id:
        monitor.getClientOffset().y > 250
          ? props.threads.find(thread => thread.name === 'Main').id
          : 12,
      trace_id: props.trace_id,
    };
  },
};

type Props = {
  // react-dnd stuff
  connectDropTarget: any => mixed,
  isOver: boolean,
  canDrop: boolean,
  children: any,
};

// 💁‍ using a decorator wasn't working right with class properties
const enhance = DropTarget(ItemTypes.TODO, todoTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
}));

class unenhancedDropTarget extends Component<Props> {
  render() {
    const { children, connectDropTarget, isOver, canDrop } = this.props;

    return connectDropTarget(
      <div style={{ position: 'relative', height: '100%' }}>
        {children}
        {canDrop && (
          <StyledDropTarget isOver={isOver}>
            <h2> Get to work! 👷</h2>
          </StyledDropTarget>
        )}
      </div>,
    );
  }
}

const WithDropTarget = enhance(unenhancedDropTarget);

export default WithDropTarget;
