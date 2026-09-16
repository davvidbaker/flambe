import type { EventPhase } from './TraceEvent';

export interface FlameBlockDetails {
  blockWidth: number;
  blockX: number;
  blockY: number;
  endMessage?: string;
  ending?: EventPhase;
  otherMessages: Array<{ endMessage?: string; startMessage?: string }>;
  startMessage?: string;
}

export interface FlameChartHandle {
  appliedTopOffset: number;
  blockHeight: number;
  maxTopOffset: number;
  calcTooltipOffset(element: HTMLElement): { x: number; y: number };
  draw(leftBoundaryTime: number, rightBoundaryTime: number, width: number, dividersData: { offsets: Array<{ position: number }> }, topOffset?: number): void;
  getBlockDetails(index: number): FlameBlockDetails | false | undefined;
}
