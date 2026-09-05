import { useState } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react-vite';

import Settings from './Settings';
import { showSettings } from '../actions';
import { createChartStore } from '../storybook/createChartStore';
import { createAppChartFixture } from '../storybook/fixtureTrace';

const fixture = createAppChartFixture();

const meta = {
  title: 'App/Settings',
  component: Settings,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
} satisfies Meta<typeof Settings>;

export default meta;
type Story = StoryObj<typeof meta>;

function OpenSettings() {
  const [store] = useState(() => {
    const next = createChartStore(fixture);
    next.dispatch(showSettings());
    return next;
  });

  return (
    <MemoryRouter>
      <Provider store={store}>
        <div style={{ minHeight: '100vh', background: '#eee' }} />
        <Settings />
      </Provider>
    </MemoryRouter>
  );
}

export const Open: Story = {
  render: () => <OpenSettings />,
};
