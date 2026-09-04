import type { CSSProperties, ReactElement } from 'react';

export type FlameSpanId = string | number;

export interface FlameSpan {
  id: FlameSpanId;
  label: string;
  start: number;
  end: number;
  lane?: string;
  depth?: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface FlameLane {
  id: string;
  label?: string;
  collapsed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FlameChartSelection {
  span: FlameSpan;
  x: number;
  y: number;
}

export interface FlameLaneSelection {
  lane: FlameLane;
  x: number;
  y: number;
}

export interface FlameChartProps {
  spans: FlameSpan[];
  lanes?: FlameLane[];
  start?: number;
  end?: number;
  height?: number;
  rowHeight?: number;
  laneHeaderHeight?: number;
  laneGap?: number;
  padding?: number;
  background?: string;
  textColor?: string;
  gridColor?: string;
  className?: string;
  style?: CSSProperties;
  selectedSpanId?: FlameSpanId | null;
  hoveredSpanId?: FlameSpanId | null;
  onSpanClick?: (selection: FlameChartSelection) => void;
  onSpanHover?: (selection: FlameChartSelection | null) => void;
  onLaneClick?: (selection: FlameLaneSelection) => void;
  onBackgroundClick?: (input: { x: number; y: number }) => void;
  formatTime?: (value: number) => string;
}

export function FlameChart(props: FlameChartProps): ReactElement;

export interface TimeRange {
  start: number;
  end: number;
}

export interface ZoomBounds {
  min?: number;
  max?: number;
}

export function zoomTimeRange(
  deltaY: number,
  zoomCenterTime: number,
  start: number,
  end: number,
  bounds?: ZoomBounds,
): TimeRange;
