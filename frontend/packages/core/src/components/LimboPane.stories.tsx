import type { Meta, StoryObj } from '@storybook/react-vite';

import LimboPane from './LimboPane';
import type { Category } from '../types/Category';
import type { ProcessedActivity } from '../utilities/processTrace';

const categories: Category[] = [
  { id: 1, name: 'coding', color_background: '#efc360', color_text: '#000000' },
  { id: 2, name: 'investigation', color_background: '#60a5fa', color_text: '#000000' },
  { id: 3, name: 'review', color_background: '#a78bfa', color_text: '#000000' },
  { id: 4, name: 'operations', color_background: '#34d399', color_text: '#000000' },
];

function item(
  id: number,
  name: string,
  status: 'suspended' | 'unstarted',
  options: { category?: number; weight?: number } = {},
): ProcessedActivity {
  return {
    id,
    name,
    status,
    thread_id: 1,
    categories: [options.category ?? 1],
    events: [],
    suspendedChildren: [],
    ...(options.weight === undefined ? {} : { weight: options.weight }),
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
    categories,
    deleteActivity: () => undefined,
    focusActivity: () => undefined,
  },
} satisfies Meta<typeof LimboPane>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Weighted items are hexes sized by weight, heaviest in the middle; the rest wait in the side list. */
export const Mixed: Story = {
  args: {
    activities: byId([
      item(1, 'Bring back the hex field', 'unstarted', { category: 3, weight: 8 }),
      item(2, 'Rework reducer placement', 'suspended', { category: 2, weight: 5 }),
      item(3, 'Detail the interior', 'unstarted', { category: 4, weight: 3 }),
      item(4, 'Write a CLI walkthrough', 'unstarted', { category: 3, weight: 2 }),
      item(5, 'Tiny idea', 'unstarted', { weight: 1 }),
      item(6, 'Maybe a mobile view', 'unstarted', { category: 2 }),
      item(7, 'Touch up scratch on rear', 'suspended', { category: 4 }),
    ]),
  },
};

/** Many weighted items, to check the honeycomb spiral stays readable and scrolls. */
export const ManyWeighted: Story = {
  args: {
    activities: byId(
      Array.from({ length: 19 }, (_, index) =>
        item(index + 1, `Idea ${index + 1}`, index % 4 === 0 ? 'suspended' : 'unstarted', {
          category: (index % 4) + 1,
          weight: (index % 6) + 1,
        })),
    ),
  },
};

/** A long name must stay inside its hex and show in full on hover. */
export const LongNames: Story = {
  args: {
    activities: byId([
      item(1, 'Reconcile the reducer placement rules with the new limbo semantics end to end', 'unstarted', {
        category: 2, weight: 4,
      }),
      item(2, 'Supercalifragilisticexpialidociousrefactor', 'unstarted', { category: 1, weight: 1 }),
      item(3, 'A plain list entry whose name is far too long to fit in the side column', 'unstarted', {
        category: 3,
      }),
    ]),
  },
};

export const OnlyUnweighted: Story = {
  args: {
    activities: byId([
      item(1, 'Find a buyer', 'unstarted', { category: 4 }),
      item(2, 'Maybe a mobile view', 'unstarted', { category: 2 }),
      item(3, 'Touch up scratch on rear', 'suspended', { category: 4 }),
    ]),
  },
};

export const Empty: Story = {};
