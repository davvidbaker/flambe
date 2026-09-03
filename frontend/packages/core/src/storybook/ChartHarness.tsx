import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import { setTimeline } from '../actions';
import ConnectedTimeline from '../containers/ConnectedTimeline';
import { colors } from '../styles';
import { createChartStore, seedChartViewport, viewportForFixture } from './createChartStore';
import type { AppChartFixture } from './fixtureTrace';

type ChartHarnessProps = {
  fixture: AppChartFixture;
};

export function ChartHarness({ fixture }: ChartHarnessProps) {
  const [store] = useState(() => {
    seedChartViewport(fixture);
    return createChartStore(fixture);
  });

  useEffect(() => {
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        const { minTime, maxTime } = viewportForFixture(fixture);
        store.dispatch(setTimeline(minTime, maxTime + 1));
      });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [fixture, store]);

  return (
    <Provider store={store}>
      <div style={{ background: colors.background, height: '100vh' }}>
        <ConnectedTimeline
          addCommand={() => undefined}
          submitCommand={() => undefined}
          trace_id={fixture.traceId}
        />
      </div>
    </Provider>
  );
}
