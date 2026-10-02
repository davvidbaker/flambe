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
  createScheduledStackingEdgesFixture,
  createScheduledUnderBegunFixture,
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


export const GridObservatory: Story = {
  args: (() => {
    const now = Date.now();
    const start = now - 8 * 60 * 60 * 1000;
    const observations = Array.from({ length: 9 }, (_, index) => {
      const timestamp = start + index * 60 * 60 * 1000;
      const wave = Math.sin(index / 1.5);
      return [
        {
          kind: 'carbon',
          value: 310 + wave * 25,
          unit: 'gCO2eq/kWh',
          timestamp,
          payload: {
            series: {
              CISO: 190 + wave * 35 + index * 2,
              ERCO: 360 - wave * 20 + index * 3,
              PJM: 405 + wave * 18 - index * 2,
              MISO: 445 - wave * 28,
              NYIS: 245 + wave * 22 + index,
            },
          },
        },
        {
          kind: 'hub_price',
          value: 42 + wave * 9,
          unit: '$/MWh',
          timestamp,
          payload: {
            series: {
              'CAISO · NP15': 31 + wave * 14 + index,
              'CAISO · SP15': 28 + wave * 17 + index * 1.5,
              'MISO · ILLINOIS.HUB': 39 - wave * 8 + index * 0.8,
              'MISO · MICHIGAN.HUB': 41 - wave * 7 + index,
              'ERCOT · HB_NORTH': 47 + wave * 12 - index * 0.4,
              'ERCOT · HB_HOUSTON': 50 + wave * 10 - index * 0.2,
            },
          },
        },
        {
          kind: 'generation',
          value: 32_000 + wave * 2_000,
          unit: 'MW',
          timestamp,
          payload: {
            series: {
              CAISO: 27_000 + wave * 2_400 + index * 300,
              ERCOT: 48_000 - wave * 3_000 + index * 450,
              MISO: 52_000 + wave * 1_800 - index * 250,
              NYISO: 18_000 + wave * 1_200 + index * 120,
            },
          },
        },
      ];
    }).flat();

    return {
      fixture: createAppChartFixture({ now }),
      demoOverlays: false,
      storeExtras: { observations },
      viewport: {
        leftBoundaryTime: start,
        rightBoundaryTime: now,
      },
    };
  })(),
};

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

/** Canonical bug: past/future plans must sit below an open begun block, never above. */
export const ScheduledUnderBegun: Story = {
  args: (() => {
    const now = Date.now();
    return {
      fixture: createScheduledUnderBegunFixture(now),
      viewport: {
        leftBoundaryTime: now - 80 * 60 * 1000,
        rightBoundaryTime: now + 140 * 60 * 1000,
      },
    };
  })(),
};

/** Nested open work, completed+missed plan, and non-overlapping future plan. */
export const ScheduledStackingEdges: Story = {
  args: (() => {
    const now = Date.now();
    return {
      fixture: createScheduledStackingEdgesFixture(now),
      viewport: {
        leftBoundaryTime: now - 120 * 60 * 1000,
        rightBoundaryTime: now + 120 * 60 * 1000,
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
