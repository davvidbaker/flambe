# @davvidbaker/flame-chart

A standalone React flame chart component extracted from Flambe. It renders generic time spans and deliberately has no dependency on Flambe Redux state, Phoenix, backend trace types, or application routing.

The Flambe app does not render this package as its chart. Flambe Storybook lives in `frontend/` and demonstrates the production Timeline / FlameChart with fixture data.

## Install

```bash
npm install @davvidbaker/flame-chart
```

React and React DOM are peer dependencies.

## Basic usage

```tsx
import { FlameChart, type FlameSpan } from '@davvidbaker/flame-chart';

const spans: FlameSpan[] = [
  { id: 'task', label: 'Implement task', start: 0, end: 8200, lane: 'agent', depth: 0 },
  { id: 'inspect', label: 'Inspect repo', start: 100, end: 1200, lane: 'agent', depth: 1 },
  { id: 'code', label: 'Write code', start: 1500, end: 6100, lane: 'agent', depth: 1 },
  { id: 'verify', label: 'Verify', start: 6400, end: 8000, lane: 'agent', depth: 1 },
];

export function AgentWork() {
  return <FlameChart spans={spans} height={280} />;
}
```

`start` and `end` are arbitrary numeric units. Milliseconds are a natural default for agent execution traces, but epoch timestamps or seconds work as long as every span uses the same unit.

## Span model

```ts
interface FlameSpan {
  id: string | number;
  label: string;
  start: number;
  end: number;
  lane?: string;
  depth?: number;
  color?: string;
  metadata?: Record<string, unknown>;
}
```

Use `lane` for independent tracks such as `agent`, `tools`, or `reasoning`. Use `depth` for nested work within a lane.

## Interaction

```tsx
<FlameChart
  spans={spans}
  selectedSpanId={selectedId}
  onSpanClick={({ span }) => setSelectedId(span.id)}
  onSpanHover={(selection) => setHovered(selection?.span ?? null)}
/>
```

## Relationship to Flambe

The Flambe application chart is a feature-rich canvas tightly coupled to application state and Flambe-specific trace types. This package is a generic span renderer for npm consumers. Develop and review the product chart in the app Storybook, not here.
