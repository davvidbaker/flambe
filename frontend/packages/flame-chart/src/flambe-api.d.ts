import type { CSSProperties, ReactElement } from 'react';

export type EntityId = number | string;

export type ActivityStatus =
  | 'active'
  | 'complete'
  | 'parent_suspended'
  | 'suspended';

export interface Thread {
  collapsed?: boolean;
  currentLevel?: number;
  id: EntityId;
  name: string;
  rank?: number;
}

export interface Category {
  color_background: string;
  color_text: string;
  id: EntityId;
  name: string;
}

export interface Activity {
  agent_id?: string | null;
  agent_name?: string | null;
  categories: EntityId[];
  description?: string | null;
  endTime?: number;
  events?: EntityId[];
  flavor?: 'question' | 'task';
  id: EntityId;
  level?: number;
  name?: string;
  parent_id?: EntityId | null;
  startTime?: number;
  status?: ActivityStatus;
  suspendedChildren?: EntityId[];
  thread?: Thread;
  thread_id?: EntityId;
  weight?: number;
}

export type EventPhase = 'B' | 'E' | 'J' | 'Q' | 'R' | 'S' | 'V' | 'X';

export interface TraceEvent {
  activity: Activity | null;
  id: EntityId;
  message?: string;
  phase: EventPhase;
  timestamp: number;
}

export interface AttentionShift {
  timestamp: number;
  thread_id: EntityId;
}

export type AppChartFixture = {
  attentionShifts: AttentionShift[];
  categories: Category[];
  events: TraceEvent[];
  threads: Thread[];
  traceId: EntityId;
  traceName: string;
};

export type AppChartFixtureOptions = {
  collapsedThreadIds?: EntityId[];
  now?: number;
};

export type SnapshotViewport = {
  leftBoundaryTime: number;
  rightBoundaryTime: number;
};

export type SnapshotTimeLabels = {
  absoluteTimeLabels: boolean;
  twelveHourClock: boolean;
};

export type TimelineSnapshot = {
  version: 1;
  exportedAt: number;
  viewport: SnapshotViewport;
  timeLabels?: SnapshotTimeLabels;
  fixture: AppChartFixture;
};

export type ChartHarnessProps = {
  fixture: AppChartFixture;
  className?: string;
  style?: CSSProperties;
  /** CSS height of the chart shell. Storybook fullscreen uses the default `100vh`. */
  height?: number | string;
  viewport?: SnapshotViewport;
  timeLabels?: SnapshotTimeLabels;
  demoOverlays?: boolean;
};

export function ChartHarness(props: ChartHarnessProps): ReactElement;

export function createAppChartFixture(
  options?: AppChartFixtureOptions,
): AppChartFixture;

export function isTimelineSnapshot(value: unknown): value is TimelineSnapshot;
