import { createContext, useContext } from 'react';
import type TimelineController from './TimelineController';
import type { TimelineProps } from './TimelineController';

// Each composition has one coordinator; panes register only while mounted.
export const TimelineContext = createContext<{
  controller: TimelineController;
  props: TimelineProps;
} | null>(null);

export function useTimelineContext() {
  const context = useContext(TimelineContext);
  if (!context) throw new Error('Timeline panes must be rendered inside a Timeline or ChartHarness.');
  return context;
}
