import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { getTimeline } from '../reducers/timeline';
import { colors } from '../styles';

const FocusBlock = styled.div`
  position: absolute;
  pointer-events: none;
  background: ${colors['focus-activity-bg']};
  outline: solid black 2px;
`;

const HoverBlock = styled.div`
  position: absolute;
  pointer-events: none;
  background: ${colors['hover-activity-bg']};
`;

class FocusedBlock extends React.Component {
  render() {
    const {
      flameChartRef,
      focusedBlockIndex,
      hoveredBlockIndex,
      yOffset,
    } = this.props;

    const focusedBlock = focusedBlockIndex
      ? flameChartRef.current.getBlockDetails(focusedBlockIndex)
      : null;

    const hoveredBlock = hoveredBlockIndex
      ? flameChartRef.current.getBlockDetails(hoveredBlockIndex)
      : null;
    return (
      <>
        {hoveredBlock &&
          hoveredBlock.blockWidth > 0 && (
            <HoverBlock
              key="hover"
              style={{
                left: `${hoveredBlock.blockX}px`,
                top: `${hoveredBlock.blockY + yOffset}px`,
                width: `${hoveredBlock.blockWidth}px`,
                height: `${flameChartRef.current.blockHeight}px`,
              }}
            />
          )}
        {focusedBlock &&
          focusedBlock.blockWidth > 0 && (
            <FocusBlock
              key="focus"
              style={{
                left: `${focusedBlock.blockX}px`,
                top: `${focusedBlock.blockY + yOffset}px`,
                width: `${focusedBlock.blockWidth}px`,
                height: `${flameChartRef.current.blockHeight}px`,
              }}
            />
          )}
      </>
    );
  }
}

export default connect(
  state => ({
    focusedBlockIndex: getTimeline(state).focusedBlockIndex,
    hoveredBlockIndex: getTimeline(state).hoveredBlockIndex,
  }),
  null,
  null,
  { forwardRef: true },
)(FocusedBlock);
