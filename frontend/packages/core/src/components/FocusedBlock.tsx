import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { getTimeline } from '../reducers/timeline';
import { colors } from '../styles';
import type { TimelineState } from '../reducers/timeline';
import type { FlameChartHandle } from '../types/FlameChartHandle';

interface OwnProps {
  flameChartRef: React.RefObject<FlameChartHandle | null>;
  yOffset: number;
}

interface StateProps {
  focusedBlockIndex: number | null;
  hoveredBlockIndex?: number | null;
}

type Props = OwnProps & StateProps;

const FocusBlock = styled.div`
  position: absolute;
  pointer-events: none;
  background: ${colors['focus-activity-bg']};
  outline: solid black 2px;
  outline-offset: -2px;
`;

const HoverBlock = styled.div`
  position: absolute;
  pointer-events: none;
  background: ${colors['hover-activity-bg']};
`;

class FocusedBlock extends React.Component<Props> {
  render() {
    const {
      flameChartRef,
      focusedBlockIndex,
      hoveredBlockIndex,
      yOffset,
    } = this.props;

    const focusedBlock = focusedBlockIndex !== null
      ? flameChartRef.current?.getBlockDetails(focusedBlockIndex)
      : null;

    const hoveredBlock = hoveredBlockIndex !== null && hoveredBlockIndex !== undefined
      ? flameChartRef.current?.getBlockDetails(hoveredBlockIndex)
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
                height: `${hoveredBlock.blockHeight}px`,
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
                height: `${focusedBlock.blockHeight}px`,
              }}
            />
          )}
      </>
    );
  }
}

export default connect(
  (state: { timeline: TimelineState }): StateProps => ({
    focusedBlockIndex: getTimeline(state).focusedBlockIndex,
    hoveredBlockIndex: getTimeline(state).hoveredBlockIndex,
  }),
  null,
  null,
  { forwardRef: true },
)(FocusedBlock);
