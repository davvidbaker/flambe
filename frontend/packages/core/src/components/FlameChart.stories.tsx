import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChartHarness } from '../storybook/ChartHarness';
import { createAppChartFixture } from '../storybook/fixtureTrace';
import {
  createConcurrentAgentsFixture,
  createDenseTraceFixture,
  createEmptyTraceFixture,
  createParentSuspensionFixture,
  createQuestionOutcomesFixture,
  createResurrectionFixture,
  createSparseTraceFixture,
  createStrangeSequenceFixture,
} from '../storybook/scenarioFixtures';

const meta = {
  title: 'App/FlameChart',
  component: ChartHarness,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
} satisfies Meta<typeof ChartHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NestedWork: Story = {
  args: {
    fixture: createAppChartFixture(),
  },
};

export const ConcurrentAgents: Story = {
  args: {
    fixture: createConcurrentAgentsFixture(),
  },
};

export const ParentSuspensionAndResume: Story = {
  args: {
    fixture: createParentSuspensionFixture(),
  },
};

export const RepeatedResurrection: Story = {
  args: {
    fixture: createResurrectionFixture(),
  },
};

export const StrangeEventSequences: Story = {
  args: {
    fixture: createStrangeSequenceFixture(),
  },
};

export const QuestionsAndOutcomes: Story = {
  args: {
    fixture: createQuestionOutcomesFixture(),
  },
};

export const DenseShortWork: Story = {
  args: {
    fixture: createDenseTraceFixture(),
  },
};

export const SparseLongRunningWork: Story = {
  args: {
    fixture: createSparseTraceFixture(),
  },
};

export const CollapsedThread: Story = {
  args: {
    fixture: createAppChartFixture({ collapsedThreadIds: [2] }),
  },
};

export const EmptyTrace: Story = {
  args: {
    fixture: createEmptyTraceFixture(),
  },
};
