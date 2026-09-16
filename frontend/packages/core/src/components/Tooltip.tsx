import * as React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import ActivityBlockDetails from './ActivityBlockDetails';
import { getTimeline } from '../reducers/timeline';
import { colors, timelineActivityFontFamily, timelineActivityFontSizePx } from '../styles';
import type { SettingsState } from '../reducers/settings';
import type { TimelineState } from '../reducers/timeline';
import type { FlameChartHandle } from '../types/FlameChartHandle';
import type { ProcessedActivity, TraceBlock } from '../utilities/processTrace';

const Div = styled.div`
  background: ${colors.background};
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.1);
  max-width: 80%;
  padding: 4px 8px;
  position: absolute;
  pointer-events: none;

  font-family: ${timelineActivityFontFamily};
  font-size: ${timelineActivityFontSizePx}px;
`;

const getTooltipPosition = (
  tooltipRef: React.RefObject<HTMLDivElement | null>,
  flameChartRef: React.RefObject<FlameChartHandle | null>,
  topOffset: number,
): { x: number; y: number } | null => {
  if (!tooltipRef.current || !flameChartRef.current) return null;
  const { x, y } = flameChartRef.current.calcTooltipOffset(tooltipRef.current);
  return { x, y: y + topOffset };
};

interface Props {
  activities: Record<string, ProcessedActivity>;
  blocks: TraceBlock[];
  flameChartRef: React.RefObject<FlameChartHandle | null>;
  focusedBlockActivity_id: number | string | null;
  focusedBlockIndex: number | null;
  hoveredBlockIndex?: number | null;
  showActivityIds: boolean;
  yOffset: number;
}

const Tooltip = ({
  activities,
  blocks,
  flameChartRef,
  hoveredBlockIndex,
  focusedBlockIndex,
  focusedBlockActivity_id,
  showActivityIds,
  yOffset,
}: Props) => {
  const hoveredBlock =
    flameChartRef.current &&
    hoveredBlockIndex !== null && hoveredBlockIndex !== undefined &&
    flameChartRef.current.getBlockDetails(hoveredBlockIndex);

  const hoveredActivity =
    hoveredBlock && hoveredBlockIndex !== null && hoveredBlockIndex !== undefined && blocks[hoveredBlockIndex]
      ? activities[String(blocks[hoveredBlockIndex].activity_id)]
      : null;

  const ending = hoveredBlock ? hoveredBlock.ending : undefined;
  const endMessage = hoveredBlock ? hoveredBlock.endMessage : undefined;

  const name = hoveredActivity
    ? (showActivityIds ? String(hoveredActivity.id) : hoveredActivity.name)
    : null;
  const startMessage = hoveredBlock ? hoveredBlock.startMessage : undefined;

  // ref={this.tooltip}
  // tooltipRef={this.tooltip}
  // left={`${tx}px`}
  // top={`${ty}px`

  const tooltipRef = React.useRef<HTMLDivElement>(null);

  let left, top;
  if (tooltipRef.current && flameChartRef && flameChartRef.current) {
    const position = getTooltipPosition(tooltipRef, flameChartRef, yOffset);
    if (position) {
      left = `${position.x}px`;
      top = `${position.y}px`;
    }
  }

  return (
    <Div
      ref={tooltipRef}
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
};
export default connect((state: { timeline: TimelineState; settings: SettingsState }) => {
  const timeline = getTimeline(state);
  return {
    focusedBlockActivity_id: timeline.focusedBlockActivity_id,
    focusedBlockIndex: timeline.focusedBlockIndex,
    hoveredBlockIndex: timeline.hoveredBlockIndex,
    showActivityIds: state.settings.showActivityIds,
  };
})(Tooltip);
