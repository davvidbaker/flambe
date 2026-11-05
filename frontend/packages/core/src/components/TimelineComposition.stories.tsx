import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartHarness } from '../storybook/ChartHarness';
import { TimelineFlameChart } from './TimelineFlameChart';
import { TimelineTimeSeries } from './TimelineTimeSeries';
import { createAppChartFixture } from '../storybook/fixtureTrace';

const fixture = createAppChartFixture();
const meta = {
  title: 'App/Timeline Composition',
  component: ChartHarness,
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  args: { fixture },
} satisfies Meta<typeof ChartHarness>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FlamechartOnly: Story = {
  render: args => <ChartHarness {...args}><TimelineFlameChart /></ChartHarness>,
};

function ComposablePanes(args: React.ComponentProps<typeof ChartHarness>) {
  const [showSeries, setShowSeries] = useState(true);
  const [seriesWidth, setSeriesWidth] = useState('100%');
  return <ChartHarness {...args}>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, padding: 8 }}>
        <button onClick={() => setShowSeries(value => !value)}>Toggle timeseries</button>
        <button onClick={() => setSeriesWidth(value => value === '100%' ? '60%' : '100%')}>Resize timeseries</button>
      </div>
      {showSeries && <div style={{ height: 140, width: seriesWidth, marginLeft: 'auto', flexShrink: 0 }}>
        <TimelineTimeSeries />
      </div>}
      <div style={{ flex: 1, minHeight: 0 }}><TimelineFlameChart /></div>
    </div>
  </ChartHarness>;
}

export const SyncedPanes: Story = { render: args => <ComposablePanes {...args} /> };
