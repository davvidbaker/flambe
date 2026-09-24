import type { Meta, StoryObj } from '@storybook/react-vite';

import LimboPane from './LimboPane';
import type { ProcessedActivity } from '../utilities/processTrace';

function item(
  id: number,
  name: string,
  status: 'suspended' | 'unstarted',
  weight?: number,
): ProcessedActivity {
  return {
    id,
    name,
    status,
    thread_id: 1,
    categories: [],
    events: [],
    suspendedChildren: [],
    ...(weight === undefined ? {} : { weight }),
  };
}

function byId(items: ProcessedActivity[]): Record<string, ProcessedActivity> {
  return Object.fromEntries(items.map(activity => [String(activity.id), activity]));
}

const meta = {
  title: 'App/LimboPane',
  component: LimboPane,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
  decorators: [
    Story => (
      <div style={{ height: 360 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    activities: {},
    beginActivity: () => undefined,
    deleteActivity: () => undefined,
    focusActivity: () => undefined,
  },
} satisfies Meta<typeof LimboPane>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Weighted items are hexes sized by weight; the rest wait in the side list. */
export const Mixed: Story = {
  args: {
    activities: byId([
      item(1, 'Bring back the hex field', 'unstarted', 8),
      item(2, 'Rework reducer placement', 'suspended', 5),
      item(3, 'Detail the interior', 'unstarted', 3),
      item(4, 'Write a CLI walkthrough', 'unstarted', 2),
      item(5, 'Tiny idea', 'unstarted', 1),
      item(6, 'Maybe a mobile view', 'unstarted'),
      item(7, 'Touch up scratch on rear', 'suspended'),
    ]),
  },
};

/** Many weighted items, to check the honeycomb spiral stays readable. */
export const ManyWeighted: Story = {
  args: {
    activities: byId(
      Array.from({ length: 19 }, (_, index) =>
        item(index + 1, `Idea ${index + 1}`, index % 4 === 0 ? 'suspended' : 'unstarted', (index % 6) + 1)),
    ),
  },
};

export const OnlyUnweighted: Story = {
  args: {
    activities: byId([
      item(1, 'Find a buyer', 'unstarted'),
      item(2, 'Maybe a mobile view', 'unstarted'),
      item(3, 'Touch up scratch on rear', 'suspended'),
    ]),
  },
};

export const Empty: Story = {};
