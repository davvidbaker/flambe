import * as React from 'react';
import TimeSeries from './TimeSeries';
import Measure from './Measure';
import { useTimelineContext } from './TimelineContext';
import type { TimelinePaneProps } from './TimelineFlameChart';

/** Timeseries pane sharing the composition's time viewport. Fills its parent. */
export function TimelineTimeSeries({ className, style }: TimelinePaneProps) {
  const { controller, props } = useTimelineContext();
  const chart = React.useRef<TimeSeries>(null);
  const surface = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => controller.subscribeDraw((left, right) => {
    const width = surface.current?.getBoundingClientRect().width ?? 0;
    if (width > 0) chart.current?.draw(left, right, width);
  }), [controller]);

  return (
    <Measure bounds onResize={controller.scheduleDrawChildren}>
      {({ measureRef }) => (
        <div ref={element => { surface.current = element; measureRef(element); }}
          data-timeline-pane="timeseries" className={className}
          style={{ position: 'relative', height: '100%', minHeight: 0, ...style }}>
          <TimeSeries ref={chart} mantras={props.mantras} observations={props.observations ?? []}
            searchTerms={props.searchTerms} tabs={props.tabs} />
        </div>
      )}
    </Measure>
  );
}
