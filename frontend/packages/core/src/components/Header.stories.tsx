import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { createChartStore } from '../storybook/createChartStore';
import { demoTraces } from '../storybook/demoTraces';
import { StoryHeader } from '../storybook/StoryHeader';
import { createWinterStormUriFixture } from '../storybook/winterStormUriFixture';

const fixture = createWinterStormUriFixture();
const traces = demoTraces(fixture);

function HeaderShell({ openTraces = false }: { openTraces?: boolean }) {
  const [store] = useState(() => createChartStore(fixture, Date.now(), { traces }));

  return (
    <MemoryRouter>
      <Provider store={store}>
        <StoryHeader />
        {openTraces ? <TracesOpener /> : null}
      </Provider>
    </MemoryRouter>
  );
}

function TracesOpener() {
  useEffect(() => {
    document.querySelector<HTMLButtonElement>('[title="Toggle traces"]')?.click();
  }, []);
  return null;
}

const meta = {
  title: 'App/Header',
  component: HeaderShell,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
} satisfies Meta<typeof HeaderShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { openTraces: false },
};

export const TracesMenuOpen: Story = {
  args: { openTraces: true },
};
