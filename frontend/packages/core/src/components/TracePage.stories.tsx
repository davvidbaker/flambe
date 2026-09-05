import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChartHarness } from '../storybook/ChartHarness';
import { demoTraces } from '../storybook/demoTraces';
import { StoryHeader } from '../storybook/StoryHeader';
import { createWinterStormUriFixture } from '../storybook/winterStormUriFixture';

const fixture = createWinterStormUriFixture();

const meta = {
  title: 'App/TracePage',
  component: ChartHarness,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
  args: {
    fixture,
    storeExtras: { traces: demoTraces(fixture) },
    chrome: <StoryHeader />,
  },
} satisfies Meta<typeof ChartHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeaderAndChart: Story = {};
