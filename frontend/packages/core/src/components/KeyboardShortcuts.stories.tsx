import { useState } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react-vite';

import KeyboardShortcuts from './KeyboardShortcuts';
import { showKeyboardShortcuts } from '../actions';
import { createChartStore } from '../storybook/createChartStore';
import { createAppChartFixture } from '../storybook/fixtureTrace';

const fixture = createAppChartFixture();

const meta = {
  title: 'App/KeyboardShortcuts',
  component: KeyboardShortcuts,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
} satisfies Meta<typeof KeyboardShortcuts>;

export default meta;
type Story = StoryObj<typeof meta>;

function OpenKeyboardShortcuts() {
  const [store] = useState(() => {
    const next = createChartStore(fixture);
    next.dispatch(showKeyboardShortcuts());
    return next;
  });

  return (
    <MemoryRouter>
      <Provider store={store}>
        <div style={{ minHeight: '100vh', background: '#eee' }} />
        <KeyboardShortcuts />
      </Provider>
    </MemoryRouter>
  );
}

export const Open: Story = {
  render: () => <OpenKeyboardShortcuts />,
};
