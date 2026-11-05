import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartHarness } from '../storybook/ChartHarness';
import { createAppChartFixture } from '../storybook/fixtureTrace';
import Header from './Header';

const now = Date.now();
const fixture = createAppChartFixture({ now });
const thread = fixture.threads[0];
const child = { id: 1001, thread_id: thread.id, thread, parent_id: 10, categories: [1],
  name: 'Keep the mobile active stack readable while preserving the zoomable timeline' };
const leaf = { id: 1002, thread_id: thread.id, thread, parent_id: 1001, categories: [2],
  name: 'Verify a long current activity label wraps without clipping or overlapping its ancestors' };
fixture.events.push(
  { id: 1001, timestamp: now - 240_000, phase: 'B', activity: child },
  { id: 1002, timestamp: now - 120_000, phase: 'B', activity: leaf },
);
fixture.threads.push(...Array.from({ length: 16 }, (_, index) => ({
  id: 100 + index, name: `Idle thread ${index + 1}`, rank: 2 + index,
})));
fixture.unstarted = [{ id: 2001, thread_id: thread.id, thread, categories: [1], name: 'Plan the next mobile improvement' }];
const trace = { id: fixture.traceId, name: 'Main workspace' };
const noop = () => undefined;
const chrome = <Header traces={[trace]} currentTrace={trace} selectTrace={noop} deleteTrace={noop}
  deleteCurrentTrace={noop} createMantra={noop} currentMantra="Stay focused" onOpenCommander={noop} logout={noop} />;

const meta = {
  title: 'App/Mobile Workspace', component: ChartHarness,
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  args: { fixture, chrome, height: '100dvh' },
} satisfies Meta<typeof ChartHarness>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Navigator: Story = {};
