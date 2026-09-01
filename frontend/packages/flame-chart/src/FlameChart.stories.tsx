import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlameChart } from './FlameChart';
import type { FlameSpan, FlameSpanId } from './types';

const meta = {
  title: 'FlameChart/Standalone',
  component: FlameChart,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, minHeight: '100vh', background: '#0b1020' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FlameChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const agentSpans: FlameSpan[] = [
  { id: 'task', label: 'Implement feature', start: 0, end: 8600, lane: 'agent', depth: 0, color: '#f97316' },
  { id: 'inspect', label: 'Inspect repository', start: 100, end: 1350, lane: 'agent', depth: 1, color: '#60a5fa' },
  { id: 'design', label: 'Design component API', start: 1450, end: 2650, lane: 'agent', depth: 1, color: '#a78bfa' },
  { id: 'code', label: 'Write implementation', start: 2750, end: 6250, lane: 'agent', depth: 1, color: '#34d399' },
  { id: 'types', label: 'Types', start: 2850, end: 3900, lane: 'agent', depth: 2 },
  { id: 'canvas', label: 'Canvas renderer', start: 4050, end: 6100, lane: 'agent', depth: 2 },
  { id: 'test', label: 'Build + verify', start: 6400, end: 8350, lane: 'agent', depth: 1, color: '#facc15' },
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

export const Selection: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<FlameSpanId | null>('code');
    return (
      <div>
        <div style={{ color: '#e5e7eb', marginBottom: 12, fontFamily: 'sans-serif' }}>
          Selected: {String(selected ?? 'none')}
        </div>
        <FlameChart
          {...args}
          selectedSpanId={selected}
          onSpanClick={({ span }) => setSelected(span.id)}
        />
      </div>
    );
  },
  args: {
    spans: agentSpans,
    height: 260,
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
