# ADR-024: Composable timeline panes

## Status
Accepted

## Context
David wants to embed Flambe's production flamechart without a timeseries, while retaining synchronized navigation when both are present. The canvases were already separate, but Timeline owned their layout, imperative redraws, gestures, and flamechart overlays together.

## Decision
Separate timeline coordination from pane composition. A shared coordinator owns the visible time range, navigation animation, gesture handling, and persistence. Mounted panes subscribe to its redraws and project the same time range into their own measured width.

The flamechart pane owns its canvas, selection/hover overlays, and thread detail UI. Overlay coordinates are relative to that pane. The default Timeline composes the timeseries, flamechart, and limbo panes; the external ChartHarness accepts children so consumers can compose only the panes they need.

## Rationale
The user preferred composition over a `hideTimeSeries` option. Retaining the existing canvas renderers and animation path limits behavioral changes during extraction.

## Alternatives considered
A `hideTimeSeries` option was considered in the conversation. It would address the immediate embed but leave layout and pane ownership coupled.

## Consequences
Embeds can render a standalone flamechart or arrange synchronized panes themselves. A composition supports one flamechart and any number of timeseries panes. The coordinator retains vertical navigation state for its flamechart, and production panes still use the existing Redux-backed data and settings. App-specific limbo layout is not required by custom compositions.
