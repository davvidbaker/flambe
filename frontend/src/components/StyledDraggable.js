// @flow

import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import styled from 'styled-components';

const ItemTypes = {
  VIEW: 'VIEW',
};

const draggableSource = {
  beginDrag(props) {
    return {};
  },
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  };
}

const Wrapper = styled.div`
  max-width: 50rem;
  border: solid black 2px;
`;

// flow-ignore
@DragSource(ItemTypes.VIEW, draggableSource, collect)
class StyledDraggable
  extends Component<{
    children: Component<*>,
    connectDragSource: () => mixed,
    isDragging: boolean,
  }> {
  render() {
    const { connectDragSource, isDragging, children } = this.props;
    // flow-ignore
    return connectDragSource(
      <div>
        <Wrapper>
          {children}
        </Wrapper>
      </div>
    );
  }
}

export default StyledDraggable;
