import React, { Component } from 'react';
import {
  FlameChart as StandaloneFlameChart,
  type FlameLane,
  type FlameSpan,
} from '@davvidbaker/flame-chart';

import Measure, { type Bounds } from './Measure';
import type { EntityId } from '../types/ids';
import type { Category } from '../types/Category';
import type { Thread } from '../types/Thread';
import type { AttentionShift } from '../reducers/user';
import type { ProcessedActivity, ThreadLevel, TraceBlock } from '../utilities/processTrace';
import type { FlameBlockDetails } from '../types/FlameChartHandle';

interface ChartThread extends Thread { suspendedActivityCount?: number }
interface DividerData { offsets: Array<{ position: number }> }

interface Props {
  activities: Record<string, ProcessedActivity>;
  attentionShifts: AttentionShift[];
  blocks: TraceBlock[];
  categories: Category[];
  currentAttention: EntityId | null;
  focusBlock: (input: { index: number | null; activity_id: EntityId | null; activityStatus?: string | null; thread_id: EntityId | null }) => unknown;
  focusedBlockIndex?: number | null;
  hoverBlock: (index: number | string | null) => unknown;
  hoveredBlockIndex?: number | null;
  modifiers: { shift: boolean };
  pan?: (...args: any[]) => unknown;
  showThreadDetail: (id: EntityId) => unknown;
  threadLevels: Record<string, ThreadLevel>;
  threads: Record<string, ChartThread>;
  toggleThread: (id: EntityId, isCollapsed?: boolean) => unknown;
  topOffset?: number;
  updateEvent: (id: EntityId, updates: Record<string, unknown>) => unknown;
  zoom?: (...args: any[]) => unknown;
}

interface State {
  canvasHeight: number;
  leftBoundaryTime: number;
  rightBoundaryTime: number;
  width: number;
}

const ROW_HEIGHT = 23;
const LANE_HEADER_HEIGHT = 20;
const LANE_GAP = 4;
const PADDING = 12;

function constrain(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class FlameChart extends Component<Props, State> {
  blockHeight = ROW_HEIGHT - 3;
  cursor = { x: 0, y: 0 };

  state: State = {
    canvasHeight: 150,
    leftBoundaryTime: Date.now(),
    rightBoundaryTime: Date.now() + 1000,
    width: 300,
  };

  setCanvasSize = ({ width, height }: Pick<Bounds, 'width' | 'height'>): void => {
    if (width === this.state.width && height === this.state.canvasHeight) return;
    this.setState({ width, canvasHeight: height });
  };

  sortedThreads(): ChartThread[] {
    return Object.values(this.props.threads ?? {}).sort(
      (left, right) => (left.rank ?? 0) - (right.rank ?? 0),
    );
  }

  flameLanes(): FlameLane[] {
    return this.sortedThreads().map(thread => ({
      id: String(thread.id),
      label: thread.name,
      collapsed: Boolean(thread.collapsed),
      metadata: { threadId: thread.id },
    }));
  }

  flameSpans(): FlameSpan[] {
    const categoryById = new Map(this.props.categories.map(category => [String(category.id), category]));
    const now = Date.now();

    return this.props.blocks.flatMap((block, index) => {
      const activity = this.props.activities[String(block.activity_id)];
      if (!activity || activity.thread_id === undefined) return [];
      const firstCategory = activity.categories[0] === undefined
        ? undefined
        : categoryById.get(String(activity.categories[0]));

      return [{
        id: index,
        label: activity.name || activity.description || `Activity ${String(activity.id)}`,
        start: block.startTime,
        end: block.endTime ?? now,
        lane: String(activity.thread_id),
        depth: block.level,
        color: firstCategory?.color_background,
        metadata: {
          activityId: block.activity_id,
          activityStatus: activity.status,
          threadId: activity.thread_id,
        },
      }];
    });
  }

  draw(
    leftBoundaryTime: number,
    rightBoundaryTime: number,
    width: number,
    _dividersData: DividerData,
  ): void {
    if (
      leftBoundaryTime === this.state.leftBoundaryTime
      && rightBoundaryTime === this.state.rightBoundaryTime
      && width === this.state.width
    ) return;

    this.setState({ leftBoundaryTime, rightBoundaryTime, width });
  }

  laneTop(threadId: EntityId): number | null {
    let top = 0;
    for (const thread of this.sortedThreads()) {
      if (String(thread.id) === String(threadId)) return top;
      top += LANE_HEADER_HEIGHT;
      if (!thread.collapsed) {
        const levels = this.props.blocks
          .filter(block => String(this.props.activities[String(block.activity_id)]?.thread_id) === String(thread.id))
          .map(block => block.level);
        if (levels.length > 0) top += (Math.max(...levels) + 1) * ROW_HEIGHT;
      }
      top += LANE_GAP;
    }
    return null;
  }

  getBlockDetails = (blockIndex: number): FlameBlockDetails | false | undefined => {
    const block = this.props.blocks[blockIndex];
    if (!block) return false;
    const activity = this.props.activities[String(block.activity_id)];
    if (!activity || activity.thread_id === undefined) return false;
    const thread = this.props.threads[String(activity.thread_id)];
    if (thread?.collapsed) return false;

    const laneTop = this.laneTop(activity.thread_id);
    if (laneTop === null) return false;

    const { leftBoundaryTime, rightBoundaryTime, width } = this.state;
    const duration = Math.max(1, rightBoundaryTime - leftBoundaryTime);
    const labelWidth = Math.min(140, Math.max(72, width * 0.18));
    const chartLeft = labelWidth + PADDING;
    const chartWidth = Math.max(1, width - chartLeft - PADDING);
    const xFor = (value: number) => chartLeft + ((value - leftBoundaryTime) / duration) * chartWidth;
    const blockX = xFor(block.startTime);
    const blockEndX = xFor(block.endTime ?? Date.now());
    const blockWidth = Math.max(1, blockEndX - blockX);
    const blockY = laneTop + LANE_HEADER_HEIGHT + block.level * ROW_HEIGHT;

    const otherMessages = this.props.blocks
      .filter((candidate, index) => candidate.activity_id === block.activity_id && index !== blockIndex)
      .map(({ startMessage, endMessage }) => ({ startMessage, endMessage }));

    return {
      blockWidth,
      blockX,
      blockY,
      startMessage: block.startMessage,
      ending: block.ending,
      endMessage: block.endMessage,
      otherMessages,
    };
  };

  calcTooltipOffset(tooltip: HTMLElement): { x: number; y: number } {
    const tooltipWidth = tooltip.clientWidth;
    const tooltipHeight = tooltip.clientHeight;
    const parentWidth = tooltip.parentElement?.clientWidth ?? this.state.width;
    const parentHeight = tooltip.parentElement?.clientHeight ?? this.state.canvasHeight;

    let x = 0;
    let y = 0;
    for (let quadrant = 0; quadrant < 4; ++quadrant) {
      const dx = quadrant & 2 ? -10 - tooltipWidth : 10;
      const dy = quadrant & 1 ? -6 - tooltipHeight : 6;
      x = constrain(this.cursor.x + dx, 0, parentWidth - tooltipWidth);
      y = constrain(this.cursor.y + dy, 0, parentHeight - tooltipHeight);
      if (
        x >= this.cursor.x
        || this.cursor.x >= x + tooltipWidth
        || y >= this.cursor.y
        || this.cursor.y >= y + tooltipHeight
      ) break;
    }
    return { x, y };
  }

  render() {
    const spans = this.flameSpans();
    const lanes = this.flameLanes();
    const focusedIndex = this.props.focusedBlockIndex ?? null;
    const hoveredIndex = this.props.hoveredBlockIndex ?? null;

    return (
      <div
        id="chart-wrapper"
        style={{ height: '100%', position: 'absolute', width: '100%' }}
      >
        <Measure
          bounds
          onResize={contentRect => this.setCanvasSize(contentRect.bounds)}
        >
          {({ measureRef }) => (
            <div ref={measureRef} style={{ width: '100%', height: '100%' }}>
              <StandaloneFlameChart
                spans={spans}
                lanes={lanes}
                start={this.state.leftBoundaryTime}
                end={this.state.rightBoundaryTime}
                height={this.state.canvasHeight}
                rowHeight={ROW_HEIGHT}
                laneHeaderHeight={LANE_HEADER_HEIGHT}
                laneGap={LANE_GAP}
                padding={PADDING}
                background="#ffffff"
                textColor="#222222"
                gridColor="rgba(0,0,0,0.10)"
                selectedSpanId={focusedIndex}
                hoveredSpanId={hoveredIndex}
                formatTime={value => `${Math.round(value / 1000)}s`}
                onLaneClick={({ lane }) => {
                  const threadId = lane.metadata?.threadId as EntityId | undefined;
                  const id = threadId ?? lane.id;
                  const thread = this.props.threads[String(id)];
                  if (thread) this.props.toggleThread(id, thread.collapsed);
                }}
                onSpanClick={({ span, x, y }) => {
                  this.cursor = { x, y };
                  const index = Number(span.id);
                  const block = this.props.blocks[index];
                  const activity = block && this.props.activities[String(block.activity_id)];
                  if (!block || !activity) return;
                  this.props.focusBlock({
                    index,
                    activity_id: block.activity_id,
                    activityStatus: activity.status,
                    thread_id: activity.thread_id ?? null,
                  });
                }}
                onBackgroundClick={() => this.props.focusBlock({
                  index: null,
                  activity_id: null,
                  activityStatus: null,
                  thread_id: null,
                })}
                onSpanHover={selection => {
                  if (!selection) {
                    this.props.hoverBlock(null);
                    return;
                  }
                  this.cursor = { x: selection.x, y: selection.y };
                  this.props.hoverBlock(Number(selection.span.id));
                }}
              />
            </div>
          )}
        </Measure>
      </div>
    );
  }
}

export default FlameChart;
