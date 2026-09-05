'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { setTimeline } from '../actions';
import ConnectedTimeline from '../containers/ConnectedTimeline';
import { colors } from '../styles';
import { createChartStore, seedChartViewport, viewportForFixture } from './createChartStore';
import type { AppChartFixture } from './fixtureTrace';

export type ChartHarnessProps = {
  fixture: AppChartFixture;
  className?: string;
  style?: CSSProperties;
  /** CSS height of the chart shell. Storybook fullscreen uses the default `100vh`. */
  height?: number | string;
  /** Optional app chrome (header, etc.) above the chart, sharing this store. */
  chrome?: ReactNode;
  storeExtras?: Parameters<typeof createChartStore>[2];
};

export function ChartHarness({
  fixture,
  className,
  style,
  height = '100vh',
  chrome,
  storeExtras,
}: ChartHarnessProps) {
  const [store] = useState(() => createChartStore(fixture, Date.now(), storeExtras));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    seedChartViewport(fixture);
    setMounted(true);
  }, [fixture]);

  useEffect(() => {
    if (!mounted) return undefined;
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
  }, [fixture, mounted, store]);

  const shellStyle: CSSProperties = {
    background: colors.background,
    display: 'flex',
    flexDirection: 'column',
    height,
    ...style,
  };

  if (!mounted) {
    return <div className={className} style={shellStyle} />;
  }

  return (
    <MemoryRouter>
      <Provider store={store}>
        <div className={className} style={shellStyle}>
          {chrome}
          <div style={{ flex: 1, minHeight: 0 }}>
            <ConnectedTimeline
              addCommand={() => undefined}
              submitCommand={() => undefined}
              trace_id={fixture.traceId}
            />
          </div>
        </div>
      </Provider>
    </MemoryRouter>
  );
}
