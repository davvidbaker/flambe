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
  blockHeight: number;
  calcTooltipOffset(element: HTMLElement): { x: number; y: number };
  getBlockDetails(index: number): FlameBlockDetails | false | undefined;
}
