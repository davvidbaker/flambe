import * as React from 'react';
import FlameChart, { FlameChart as FlameChartComponent } from './FlameChart';
import FocusedBlock from './FocusedBlock';
import Tooltip from './Tooltip';
import ThreadDetail from './ThreadDetail';
import ActivityDetailModal from './ActivityDetailModal';
import Measure from './Measure';
import { useTimelineContext } from './TimelineContext';
import { rankThreadsByAttention } from '../utilities/timelineGeometry';
import { loadSuspendedActivityCount } from '../utilities/timeline';
import type { EntityId } from '../types/ids';

export interface TimelinePaneProps {
  className?: string;
  style?: React.CSSProperties;
}

// Redraw overlays alongside canvas geometry without rerendering the pane tree.
class FlameChartOverlays extends React.Component<{
  chart: React.RefObject<FlameChartComponent | null>;
  activities: React.ComponentProps<typeof Tooltip>['activities'];
  blocks: React.ComponentProps<typeof Tooltip>['blocks'];
}, { geometryRevision: number }> {
  state = { geometryRevision: 0 };

  redraw = () => this.setState(({ geometryRevision }) => ({ geometryRevision: geometryRevision + 1 }));

  render() {
    return <>
      <FocusedBlock flameChartRef={this.props.chart} yOffset={0} geometryRevision={this.state.geometryRevision} />
      <Tooltip flameChartRef={this.props.chart} yOffset={0} geometryRevision={this.state.geometryRevision}
        activities={this.props.activities} blocks={this.props.blocks} />
    </>;
  }
}

/** Production flamechart, including selection and tooltip overlays. Fills its parent. */
export function TimelineFlameChart({ className, style }: TimelinePaneProps) {
  const { controller, props } = useTimelineContext();
  const chart = React.useRef<FlameChartComponent>(null);
  const surface = React.useRef<HTMLDivElement>(null);
  const overlays = React.useRef<FlameChartOverlays>(null);
  const [threadId, setThreadId] = React.useState<EntityId | null>(null);
  const threads = loadSuspendedActivityCount(props.activities, props.attentionDrivenThreadOrder
    ? rankThreadsByAttention(props.attentionShifts, props.threads)
    : props.threads);

  React.useLayoutEffect(() => {
    const instance = chart.current;
    if (controller.flameChart.current && controller.flameChart.current !== instance) {
      throw new Error('Use one TimelineFlameChart per timeline coordinator.');
    }
    controller.flameChart.current = instance;
    const unsubscribe = controller.subscribeDraw((left, right) => {
      const width = surface.current?.getBoundingClientRect().width ?? 0;
      if (!chart.current || width <= 0) return;
      chart.current.draw(left, right, width,
        controller.calculateGridOffsets(left, right, width), controller.topOffset);
      overlays.current?.redraw();
    });
    return () => {
      unsubscribe();
      if (controller.flameChart.current === instance) controller.flameChart.current = null;
    };
  }, [controller]);

  return (
    <Measure bounds onResize={controller.scheduleDrawChildren}>
      {({ measureRef }) => (
        <div ref={element => { surface.current = element; measureRef(element); }}
          data-timeline-pane="flamechart" className={className}
          style={{ position: 'relative', height: '100%', minHeight: 0, overflow: 'hidden', ...style }}>
          <FlameChart ref={chart}
            activities={props.activities} attentionShifts={props.attentionShifts}
            blocks={props.blocks} categories={props.categories}
            currentAttention={props.attentionShifts.at(-1)?.thread_id ?? null}
            modifiers={props.modifiers} pan={controller.pan} zoom={controller.zoom}
            showThreadDetail={setThreadId} threadLevels={props.threadLevels}
            hoverBlock={props.hoverBlock} focusBlock={props.focusBlock}
            focusedBlockIndex={props.focusedBlockIndex} hoveredBlockIndex={props.hoveredBlockIndex}
            onPreviewGeometryChange={() => overlays.current?.redraw()}
            onCursorTimeChange={props.onCursorTimeChange}
            threads={threads} toggleThread={props.toggleThread}
            updateEvent={props.updateEvent} updateScheduled={props.updateActivity}
            dropLimboActivity={props.dropLimboActivity ?? props.updateActivity}
            createAt={props.createActivityAt} />
          <FlameChartOverlays ref={overlays} chart={chart} activities={props.activities} blocks={props.blocks} />
          <ActivityDetailModal blocks={props.blocks} activities={props.activities} submitCommand={props.submitCommand} />
          <ThreadDetail closeThreadDetail={() => setThreadId(null)}
            id={threadId === null ? null : Number(threadId)}
            name={threadId === null ? undefined : props.threads[String(threadId)]?.name}
            activities={props.activities} />
        </div>
      )}
    </Measure>
  );
}
