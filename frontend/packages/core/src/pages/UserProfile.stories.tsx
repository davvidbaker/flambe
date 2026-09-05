import { useState } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react-vite';

import UserProfile from './UserProfile';
import { createChartStore } from '../storybook/createChartStore';
import { demoTraces } from '../storybook/demoTraces';
import { createWinterStormUriFixture } from '../storybook/winterStormUriFixture';

const fixture = createWinterStormUriFixture();

const meta = {
  title: 'App/UserProfile',
  component: UserProfile,
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
} satisfies Meta<typeof UserProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

function ProfileShell() {
  const [store] = useState(() =>
    createChartStore(fixture, Date.now(), { traces: demoTraces(fixture) }),
  );

  return (
    <MemoryRouter>
      <Provider store={store}>
        <UserProfile />
      </Provider>
    </MemoryRouter>
  );
}

export const Default: Story = {
  render: () => <ProfileShell />,
};
