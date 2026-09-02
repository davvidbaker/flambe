import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlameChart } from './FlameChart';
import type { FlameLane, FlameSpan, FlameSpanId } from './types';
import { zoomTimeRange } from './zoom';

const meta = {
  title: 'FlameChart/Standalone',
  component: FlameChart,
  parameters: { layout: 'fullscreen' },
  args: {
    background: '#ffffff',
    textColor: '#222222',
    gridColor: 'rgba(0,0,0,0.10)',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, minHeight: '100vh', background: '#ffffff' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FlameChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const agentSpans: FlameSpan[] = [
  { id: 'task', label: 'Implement feature', start: 0, end: 8600, lane: 'agent', depth: 0, color: '#f97316', metadata: { kind: 'task' } },
  { id: 'inspect', label: 'Inspect repository', start: 100, end: 1350, lane: 'agent', depth: 1, color: '#60a5fa', metadata: { kind: 'analysis', filesRead: 8 } },
  { id: 'design', label: 'Design component API', start: 1450, end: 2650, lane: 'agent', depth: 1, color: '#a78bfa', metadata: { kind: 'reasoning' } },
  { id: 'code', label: 'Write implementation', start: 2750, end: 6250, lane: 'agent', depth: 1, color: '#34d399', metadata: { kind: 'code', filesChanged: 7 } },
  { id: 'types', label: 'Types', start: 2850, end: 3900, lane: 'agent', depth: 2 },
  { id: 'canvas', label: 'Canvas renderer', start: 4050, end: 6100, lane: 'agent', depth: 2 },
  { id: 'test', label: 'Build + verify', start: 6400, end: 8350, lane: 'agent', depth: 1, color: '#facc15', metadata: { kind: 'verification' } },
];

const traceLanes: FlameLane[] = [
  { id: 'agent', label: 'Agent' },
  { id: 'tools', label: 'Tools' },
  { id: 'review', label: 'Review' },
  { id: 'deploy', label: 'Deploy' },
];

const traceSpans: FlameSpan[] = [
  ...agentSpans,
  { id: 'search', label: 'Search codebase', start: 180, end: 1120, lane: 'tools', depth: 0, color: '#38bdf8' },
  { id: 'read', label: 'Read source', start: 1180, end: 2480, lane: 'tools', depth: 0, color: '#38bdf8' },
  { id: 'patch', label: 'Apply patch', start: 2900, end: 4680, lane: 'tools', depth: 0, color: '#38bdf8' },
  { id: 'build', label: 'Typecheck', start: 6320, end: 7300, lane: 'tools', depth: 0, color: '#38bdf8' },
  { id: 'diff', label: 'Review diff', start: 7260, end: 8340, lane: 'review', depth: 0, color: '#c084fc' },
  { id: 'feedback', label: 'Incorporate feedback', start: 7550, end: 8300, lane: 'review', depth: 1, color: '#c084fc' },
  { id: 'preview', label: 'Publish preview', start: 8380, end: 8580, lane: 'deploy', depth: 0, color: '#22c55e' },
];

export const AgentExecution: Story = {
  args: {
    spans: agentSpans,
    height: 260,
  },
};

export const MultipleLanes: Story = {
  args: {
    height: 360,
    spans: [
      ...agentSpans,
      { id: 'tool-1', label: 'GitHub fetch', start: 250, end: 900, lane: 'tools', depth: 0, color: '#38bdf8' },
      { id: 'tool-2', label: 'GitHub create files', start: 3200, end: 5800, lane: 'tools', depth: 0, color: '#38bdf8' },
      { id: 'tool-3', label: 'CI build', start: 6800, end: 8100, lane: 'tools', depth: 0, color: '#38bdf8' },
      { id: 'reason-1', label: 'Find coupling boundary', start: 900, end: 2300, lane: 'reasoning', depth: 0, color: '#fb7185' },
      { id: 'reason-2', label: 'Choose standalone span model', start: 2350, end: 3000, lane: 'reasoning', depth: 0, color: '#fb7185' },
    ],
  },
};

export const ScrollToZoom: Story = {
  render: (args) => {
    const spans = args.spans ?? traceSpans;
    const initialStart = Math.min(...spans.map((span) => span.start));
    const initialEnd = Math.max(...spans.map((span) => span.end));
    const [range, setRange] = useState({ start: initialStart, end: initialEnd });
    const [lanes, setLanes] = useState(args.lanes ?? traceLanes);
    const [selected, setSelected] = useState<FlameSpanId | null>('code');
    const [hovered, setHovered] = useState<FlameSpan | null>(null);
    const chartRef = useRef<HTMLDivElement | null>(null);
    const inspected = hovered ?? spans.find((span) => span.id === selected) ?? null;

    useEffect(() => {
      const chart = chartRef.current;
      if (!chart) return;

      const handleWheel = (event: WheelEvent) => {
        if (Math.abs(event.deltaX) >= Math.abs(event.deltaY) || event.shiftKey) return;
        event.preventDefault();
        const bounds = chart.getBoundingClientRect();
        const position = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        setRange((current) => {
          const zoomCenter = current.start + (current.end - current.start) * position;
          return zoomTimeRange(event.deltaY, zoomCenter, current.start, current.end, {
            min: initialStart,
            max: initialEnd,
          });
        });
      };

      chart.addEventListener('wheel', handleWheel, { passive: false });
      return () => chart.removeEventListener('wheel', handleWheel);
    }, [initialEnd, initialStart]);

    return (
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1fr) 250px' }}>
        <div ref={chartRef} style={{ minWidth: 0 }}>
          <FlameChart
            {...args}
            spans={spans}
            lanes={lanes}
            start={range.start}
            end={range.end}
            selectedSpanId={selected}
            onSpanClick={({ span }) => setSelected(span.id)}
            onSpanHover={(selection) => setHovered(selection?.span ?? null)}
            onLaneClick={({ lane }) => setLanes((current) => current.map((item) =>
              item.id === lane.id ? { ...item, collapsed: !item.collapsed } : item,
            ))}
          />
        </div>
        <aside style={{ color: '#222222', fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
          <strong>Trace explorer</strong>
          <p style={{ lineHeight: 1.5 }}>Scroll to zoom. Click a lane to collapse it. Click a span to inspect it.</p>
          <button
            type="button"
            onClick={() => setRange({ start: initialStart, end: initialEnd })}
            style={{ marginBottom: 12 }}
          >
            Reset zoom
          </button>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {JSON.stringify(inspected && {
              span: inspected.label,
              duration: inspected.end - inspected.start,
              lane: inspected.lane,
              depth: inspected.depth ?? 0,
            }, null, 2)}
          </pre>
        </aside>
      </div>
    );
  },
  args: {
    spans: traceSpans,
    lanes: traceLanes,
    height: 300,
  },
};

export const InteractiveInspector: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<FlameSpanId | null>('code');
    const [hovered, setHovered] = useState<FlameSpan | null>(null);
    const inspected = hovered ?? agentSpans.find((span) => span.id === selected) ?? null;

    return (
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1fr) 260px' }}>
        <FlameChart
          {...args}
          selectedSpanId={selected}
          onSpanClick={({ span }) => setSelected(span.id)}
          onSpanHover={(selection) => setHovered(selection?.span ?? null)}
        />
        <aside style={{ color: '#222222', fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
          <strong>{inspected?.label ?? 'Hover a span'}</strong>
          {inspected && (
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
              {JSON.stringify({ duration: inspected.end - inspected.start, lane: inspected.lane, depth: inspected.depth ?? 0, metadata: inspected.metadata }, null, 2)}
            </pre>
          )}
        </aside>
      </div>
    );
  },
  args: {
    spans: agentSpans,
    height: 280,
  },
};

export const Compact: Story = {
  args: {
    spans: agentSpans,
    height: 210,
    rowHeight: 18,
    laneGap: 4,
  },
};
