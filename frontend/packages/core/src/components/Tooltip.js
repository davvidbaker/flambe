import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import Component from '@reach/component-component';

import ActivityBlockDetails from './ActivityBlockDetails';
import { getTimeline } from '../reducers/timeline';
import { colors } from '../styles';

const Div = styled.div`
  background: ${colors.background};
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.1);
  max-width: 80%;
  padding: 4px 8px;
  position: absolute;
  pointer-events: none;

  font-size: 11px;
`;

const getTooltipPosition = (tooltipRef, flameChartRef, topOffset) => {
  let tx, ty;
  const { x, y } = flameChartRef.current.calcTooltipOffset(tooltipRef.current);
  tx = x;
  ty = y + topOffset;
  return { x: tx, y: ty };
};

const Tooltip = ({
  // tooltipRef,
  // name,
  // left,
  // top,
  // startMessage,
  // endMessage,
  // otherMessages,
  activities,
  blocks,
  flameChartRef,
  hoveredBlockIndex,
  focusedBlockIndex,
  focusedBlockActivity_id,
  yOffset,
}) => {
  const focusedBlock =
    flameChartRef &&
    flameChartRef.current &&
    flameChartRef.current.getBlockDetails(activities && focusedBlockIndex);

  const hoveredBlock =
    flameChartRef &&
    flameChartRef.current &&
    flameChartRef.current.getBlockDetails(activities && hoveredBlockIndex);

  const hoveredActivity =
    blocks && hoveredBlock
      ? activities[blocks[hoveredBlockIndex].activity_id]
      : null;

  const ending = hoveredBlock ? hoveredBlock.ending : null;
  const endMessage = hoveredBlock ? hoveredBlock.endMessage : null;

  const name = hoveredActivity ? hoveredActivity.name : null;
  const startMessage = hoveredBlock ? hoveredBlock.startmessage : null;

  const otherMessages = hoveredBlock ? hoveredBlock.otherMessages : null;

  // ref={this.tooltip}
  // tooltipRef={this.tooltip}
  // left={`${tx}px`}
  // top={`${ty}px`

  return (
    <Component refs={{ tooltip: null }}>
      {({ refs }) => {
        let left, top;
        if (
          refs.tooltip &&
          refs.tooltip.current &&
          flameChartRef &&
          flameChartRef.current
        ) {
          const { x, y } = getTooltipPosition(
            refs.tooltip,
            flameChartRef,
            yOffset,
          );
          left = `${x}px`;
          top = `${y}px`;
        }
        return (
          <Div
            ref={node => {
              refs.tooltip = node;
            }}
            innerRef={refs.tooltip}
            style={left && top && name ? { left, top } : { top: 0, opacity: 0 }}
          >
            <div>{name}</div>
            <ActivityBlockDetails
              key={startMessage || endMessage}
              startMessage={startMessage}
              endMessage={endMessage}
              ending={ending}
            />
          </Div>
        );
      }}
    </Component>
  );
};
export default connect(state => {
  const timeline = getTimeline(state);
  return {
    focusedBlockActivity_id: timeline.focusedBlockActivity_id,
    focusedBlockIndex: timeline.focusedBlockIndex,
    hoveredBlockIndex: timeline.hoveredBlockIndex,
  };
})(Tooltip);
