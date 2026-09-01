import type { CSSProperties } from 'react';

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

export interface FlameChartSelection {
  span: FlameSpan;
  x: number;
  y: number;
}

export interface FlameChartProps {
  spans: FlameSpan[];
  start?: number;
  end?: number;
  height?: number;
  rowHeight?: number;
  laneGap?: number;
  padding?: number;
  background?: string;
  textColor?: string;
  gridColor?: string;
  className?: string;
  style?: CSSProperties;
  selectedSpanId?: FlameSpanId | null;
  onSpanClick?: (selection: FlameChartSelection) => void;
  onSpanHover?: (selection: FlameChartSelection | null) => void;
  formatTime?: (value: number) => string;
}
