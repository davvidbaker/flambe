import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LimboPane from './LimboPane';
import type { ProcessedActivity } from '../utilities/processTrace';

const activity = (overrides: Partial<ProcessedActivity>): ProcessedActivity => ({
  id: 1,
  name: 'Idea',
  categories: [],
  events: [],
  suspendedChildren: [],
  ...overrides,
});

describe('LimboPane', () => {
  it('renders actions that match what each card can actually do', () => {
    const markup = renderToStaticMarkup(
      <LimboPane
        activities={{
          unstarted: activity({
            id: 1,
            name: 'Draft the next step',
            status: 'unstarted',
            thread_id: 10,
          }),
          paused: activity({
            id: 2,
            name: 'Paused work',
            status: 'suspended',
            thread_id: 10,
          }),
        }}
        beginActivity={() => undefined}
        categories={[]}
        deleteActivity={() => undefined}
        focusActivity={() => undefined}
      />,
    );

    expect(markup).toContain('Not started');
    expect(markup).toContain('Paused');
    expect(markup).toContain('Begin');
    expect(markup).toContain('Give up');
    expect(markup).toContain('Select to view');
    expect(markup).not.toContain('Select to resume');
  });

  it('does not render action groups for scheduled unstarted work', () => {
    const markup = renderToStaticMarkup(
      <LimboPane
        activities={{
          scheduled: activity({
            id: 3,
            name: 'Scheduled work',
            status: 'unstarted',
            thread_id: 10,
            scheduled_start: 123,
          }),
        }}
        beginActivity={() => undefined}
        categories={[]}
        deleteActivity={() => undefined}
        focusActivity={() => undefined}
      />,
    );

    expect(markup).toContain('No unscheduled or paused work');
    expect(markup).not.toContain('Begin');
    expect(markup).not.toContain('Give up');
  });
});
