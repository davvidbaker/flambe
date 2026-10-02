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
  it('puts weighted work in the hex field and unweighted work in the side list', () => {
    const markup = renderToStaticMarkup(
      <LimboPane
        activities={{
          weighted: activity({
            id: 1,
            name: 'Draft the next step',
            status: 'unstarted',
            thread_id: 10,
            weight: 4,
          }),
          plain: activity({
            id: 2,
            name: 'No weight yet',
            status: 'unstarted',
            thread_id: 10,
          }),
          suspended: activity({
            id: 3,
            name: 'Suspended work',
            status: 'suspended',
            thread_id: 10,
          }),
        }}
        beginActivity={() => undefined}
        categories={[]}
        deleteActivity={() => undefined}
        focusActivity={() => undefined}
        onToggleCollapsed={() => undefined}
        threads={{ 10: { id: 10, name: 'app 🔥' } }}
        updateActivity={() => undefined}
      />,
    );

    expect(markup).toContain('Limbo hex field');
    expect(markup).toContain('Draft the next step');
    expect(markup).toContain('🔥');
    expect(markup).toContain('No weight yet');
    expect(markup).toContain('Suspended work');
    expect(markup).toContain('Begin');
    expect(markup).toContain('Give up');
    expect(markup).toContain('View');
    expect(markup.match(/draggable="true"/g)).toHaveLength(3);
    expect(markup).toContain('placeholder="🏋️"');
    expect(markup).toContain('Collapse limbo');
  });

  it('shows each hex tile with its own thread emoji', () => {
    const markup = renderToStaticMarkup(
      <LimboPane
        activities={{
          app: activity({
            id: 1,
            name: 'App work',
            status: 'unstarted',
            thread_id: 1,
            weight: 3,
          }),
          van: activity({
            id: 2,
            name: 'Van work',
            status: 'suspended',
            thread_id: 2,
            weight: 5,
          }),
        }}
        beginActivity={() => undefined}
        categories={[]}
        deleteActivity={() => undefined}
        focusActivity={() => undefined}
        threads={{
          1: { id: 1, name: 'flambé🔥' },
          2: { id: 2, name: 'sell van 🚐' },
        }}
      />,
    );

    expect(markup).toContain('🔥');
    expect(markup).toContain('🚐');
    expect(markup).toContain('App work');
    expect(markup).toContain('Van work');
  });

  it('renders a bottom strip when collapsed', () => {
    const markup = renderToStaticMarkup(
      <LimboPane
        activities={{
          weighted: activity({
            id: 1,
            name: 'Draft the next step',
            status: 'unstarted',
            thread_id: 10,
            weight: 4,
          }),
          plain: activity({
            id: 2,
            name: 'No weight yet',
            status: 'suspended',
            thread_id: 10,
          }),
        }}
        beginActivity={() => undefined}
        categories={[]}
        collapsed
        deleteActivity={() => undefined}
        focusActivity={() => undefined}
        onToggleCollapsed={() => undefined}
      />,
    );

    expect(markup).toContain('Expand limbo');
    expect(markup).toContain('1 weighted · 1 unweighted');
    expect(markup).not.toContain('Begin');
    expect(markup).not.toContain('Give up');
  });

  it('shows New when planInLimbo is provided', () => {
    const markup = renderToStaticMarkup(
      <LimboPane
        activities={{}}
        beginActivity={() => undefined}
        categories={[]}
        deleteActivity={() => undefined}
        focusActivity={() => undefined}
        planInLimbo={() => undefined}
      />,
    );

    expect(markup).toContain('New limbo activity');
    expect(markup).toContain('>New</button>');
  });

  it('shows New on the collapsed strip when planInLimbo is provided', () => {
    const markup = renderToStaticMarkup(
      <LimboPane
        activities={{}}
        beginActivity={() => undefined}
        categories={[]}
        collapsed
        deleteActivity={() => undefined}
        focusActivity={() => undefined}
        onToggleCollapsed={() => undefined}
        planInLimbo={() => undefined}
      />,
    );

    expect(markup).toContain('New limbo activity');
    expect(markup).toContain('Expand limbo');
  });

  it('does not treat scheduled unstarted work as limbo', () => {
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

    expect(markup).toContain('Limbo is empty.');
    expect(markup).not.toContain('Begin');
    expect(markup).not.toContain('Give up');
  });
});
