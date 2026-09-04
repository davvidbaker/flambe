# @davvidbaker/flame-chart

Two exports:

- **`@davvidbaker/flame-chart`** — a generic span renderer. No Flambe types, Redux, or Phoenix.
- **`@davvidbaker/flame-chart/flambe`** — Flambe’s production Timeline / FlameChart, seeded from fixture trace data (the same ChartHarness Storybook uses). No login and no backend.

The Flambe app does not render the generic export as its chart. Develop the product chart in the app Storybook.

## Install

From npm (when published):

```bash
npm install @davvidbaker/flame-chart
```

From this repo, after building the package:

```bash
cd frontend/packages/flame-chart
npm install
npm run build

# in the consuming app
npm install /absolute/path/to/flambe/frontend/packages/flame-chart
```

React and React DOM are peer dependencies. The `/flambe` embed also needs `styled-components` (peer).

## Flambe chart (fixture / trace)

This is the API for embedding Flambe’s chart on another site (for example a Next.js page). Pass activities, events, and threads as an `AppChartFixture`. Mark the module as a client component; the chart uses `window`, `canvas`, and `localStorage`.

```tsx
'use client';

import { ChartHarness, type AppChartFixture } from '@davvidbaker/flame-chart/flambe';

const you = { id: 1, name: 'you', rank: 0 };
const sketch = {
  id: 10,
  name: 'Ship a weekend sketch',
  categories: [1],
  thread: you,
  thread_id: 1,
};

const fixture: AppChartFixture = {
  traceId: 1,
  traceName: 'demo',
  threads: [you],
  categories: [
    { id: 1, name: 'coding', color_background: '#efc360', color_text: '#000000' },
  ],
  attentionShifts: [],
  events: [
    { id: 101, timestamp: Date.now() - 12_000, phase: 'B', activity: sketch },
    { id: 102, timestamp: Date.now() - 1_000, phase: 'E', activity: sketch },
  ],
};

export function Demo() {
  return <ChartHarness fixture={fixture} height={480} />;
}
```

`createAppChartFixture()` and `createFrontiersFixture()` are also exported for the Storybook samples.

Next.js: import from a Client Component (or `next/dynamic` with `ssr: false`). The chart will not render during SSR.

## Generic spans

```tsx
import { FlameChart, type FlameSpan } from '@davvidbaker/flame-chart';

const spans: FlameSpan[] = [
  { id: 'task', label: 'Implement task', start: 0, end: 8200, lane: 'agent', depth: 0 },
  { id: 'inspect', label: 'Inspect repo', start: 100, end: 1200, lane: 'agent', depth: 1 },
];

export function AgentWork() {
  return <FlameChart spans={spans} height={280} />;
}
```

`start` and `end` are arbitrary numeric units. Milliseconds are a natural default.

## Publish

This package is public on npm as `@davvidbaker/flame-chart`. CI publishes from `frontend/packages/flame-chart` via trusted publishing when `package.json` on `main` changes. Local `npm publish` needs npm access to `@davvidbaker`.
