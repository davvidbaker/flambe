import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChartHarness } from '../storybook/ChartHarness';
import { createAppChartFixture } from '../storybook/fixtureTrace';
import {
  createConcurrentAgentsFixture,
  createDenseTraceFixture,
  createEmptyTraceFixture,
  createParentSuspensionFixture,
  createQuestionOutcomesFixture,
  createResumeDuringConcurrentWorkFixture,
  createHumanResumeDuringConcurrentWorkFixture,
  createResurrectionFixture,
  createShortAgentFlamesFixture,
  createIndependentAgentRootsFixture,
  createLimboFixture,
  createScheduledActivitiesFixture,
  createSparseTraceFixture,
  createStackedAgentWorkFixture,
  createStrangeSequenceFixture,
} from '../storybook/scenarioFixtures';
import { createFrontiersFixture } from '../storybook/frontiersFixture';
import { createNationalTreasureFixture } from '../storybook/nationalTreasureFixture';
import { createPowerPlantFixture } from '../storybook/powerPlantFixture';
import { createWinterStormUriFixture } from '../storybook/winterStormUriFixture';

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

export const Frontiers: Story = {
  args: {
    fixture: createFrontiersFixture(),
  },
};

export const WinterStormUri: Story = {
  args: {
    fixture: createWinterStormUriFixture(),
  },
};

export const NationalTreasure: Story = {
  args: {
    fixture: createNationalTreasureFixture(),
  },
};

export const PowerPlantGantt: Story = {
  args: {
    fixture: createPowerPlantFixture(),
  },
};

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

/** Pan so agent starts are off the left; wash, rail, and label should stay pinned. */
export const AgentStartOffLeft: Story = {
  args: (() => {
    const now = Date.now();
    return {
      fixture: createConcurrentAgentsFixture(now),
      viewport: {
        leftBoundaryTime: now - 45 * 60 * 1000,
        rightBoundaryTime: now - 15 * 60 * 1000,
      },
    };
  })(),
};

export const ParentSuspensionAndResume: Story = {
  args: {
    fixture: createParentSuspensionFixture(),
  },
};

export const ResumeDuringConcurrentWork: Story = {
  args: {
    fixture: createResumeDuringConcurrentWorkFixture(),
  },
};

export const HumanResumeDuringConcurrentWork: Story = {
  args: {
    fixture: createHumanResumeDuringConcurrentWorkFixture(),
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

export const ShortAgentFlames: Story = {
  args: {
    fixture: createShortAgentFlamesFixture(),
  },
};

export const IndependentAgentRoots: Story = {
  args: {
    fixture: createIndependentAgentRootsFixture(),
  },
};

export const StackedAgentWork: Story = {
  args: {
    fixture: createStackedAgentWorkFixture(),
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

/** Plans to the right of now: a span, an end-only point, and a start-only plan open to the edge. */
export const ScheduledActivities: Story = {
  args: (() => {
    const now = Date.now();
    return {
      fixture: createScheduledActivitiesFixture(now),
      viewport: {
        leftBoundaryTime: now - 100 * 60 * 1000,
        rightBoundaryTime: now + 180 * 60 * 1000,
      },
    };
  })(),
};

/** Suspended work and untimed plans both land in the limbo pane under the chart. */
export const Limbo: Story = {
  args: {
    fixture: createLimboFixture(),
  },
};

export const EmptyTrace: Story = {
  args: {
    fixture: createEmptyTraceFixture(),
  },
};

export const Swyzzle: Story = {
  args: {
    fixture: createAppChartFixture(),
    storeExtras: { settings: { swyzzle: true } },
  },
};

export const SwyzzleFluid: Story = {
  args: {
    fixture: createAppChartFixture(),
    storeExtras: { settings: { swyzzle: true, swyzzleEffect: 'fluid' } },
  },
};
