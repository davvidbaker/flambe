import type { Meta, StoryObj } from '@storybook/react-vite';
import { Provider } from 'react-redux';

import { focusBlock } from '../actions';
import { createChartStore } from '../storybook/createChartStore';
import { createAppChartFixture } from '../storybook/fixtureTrace';
import ActivityDetail from './ActivityDetail';

const now = 1_700_000_000_000;
const fixture = createAppChartFixture({ now });
const store = createChartStore(fixture, now, { demoOverlays: false });
store.dispatch(focusBlock({
  index: 0,
  activity_id: 12,
  activityStatus: 'complete',
  thread_id: 1,
}));

const state = store.getState();

const meta = {
  title: 'App/ActivityDetail',
  component: ActivityDetail,
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
} satisfies Meta<typeof ActivityDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithReducerDecision: Story = {
  args: {
    activities: state.timeline.activities,
    blocks: state.timeline.blocks,
    submitCommand: () => undefined,
  },
  decorators: [
    StoryFn => (
      <Provider store={store}>
        <div style={{ maxWidth: 420 }}>
          <StoryFn />
        </div>
      </Provider>
    ),
  ],
};
