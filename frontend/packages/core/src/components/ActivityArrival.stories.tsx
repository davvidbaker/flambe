import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react-vite';

import ConnectedTimeline from '../containers/ConnectedTimeline';
import { processTimelineTrace } from '../actions';
import { TIMELINE_EVENT_RECEIVED } from '../constants/liveEvents';
import { createChartStore, seedChartViewport } from '../storybook/createChartStore';
import { createEmptyTraceFixture } from '../storybook/scenarioFixtures';
import type { Activity } from '../types/Activity';

function ArrivalDemo() {
  const [demo] = useState(() => {
    const now = Date.now();
    const fixture = createEmptyTraceFixture();
    fixture.threads[0].name = 'Live activity arrivals';
    const previous: Activity = { id: 999, name: 'Earlier activity', thread_id: 1, categories: [1] };
    fixture.events = [
      { id: 998, activity: previous, phase: 'B', timestamp: now - 8 * 60_000 },
      { id: 999, activity: previous, phase: 'E', timestamp: now - 6 * 60_000 },
    ];
    const viewport = { leftBoundaryTime: now - 10 * 60_000, rightBoundaryTime: now + 5 * 60_000 };
    return { now, fixture, viewport, store: createChartStore(fixture, now, { viewport, demoOverlays: false }), nextId: 1000 };
  });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    seedChartViewport(demo.fixture, demo.now, demo.viewport);
    setReady(true);
  }, [demo]);

  const arrive = (count: number, scheduled = false, scheduledStart = demo.now + 60_000) => {
    for (let index = 0; index < count; index += 1) {
      const id = demo.nextId++;
      const activity: Activity = {
        id, name: `${scheduled ? 'Planned' : 'Incoming'} activity ${id - 999}`,
        thread_id: 1, categories: [(id % 3) + 1],
        agent_id: `demo:${id % 3}`, agent_name: ['Ember', 'Spark', 'Flare'][id % 3],
      };
      if (scheduled) {
        const state = demo.store.getState().timeline;
        const unstarted = Object.values(state.activities).filter(candidate => candidate.status === 'unstarted');
        demo.store.dispatch(processTimelineTrace(state.events, Object.values(state.threads), [
          ...unstarted, { ...activity, scheduled_start: scheduledStart, scheduled_end: scheduledStart + 90_000 },
        ]));
      } else {
        demo.store.dispatch({
          type: TIMELINE_EVENT_RECEIVED, trace_id: demo.fixture.traceId,
          event: { id, activity, phase: 'B', timestamp: demo.now - (id % 4) * 30_000 },
        });
      }
    }
  };

  return (
    <MemoryRouter>
      <Provider store={demo.store}>
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', gap: 12, padding: 16, alignItems: 'center' }}>
            <button onClick={() => arrive(1)}>New activity</button>
            <button onClick={() => arrive(3)}>Three at once</button>
            <button onClick={() => arrive(1, true)}>Scheduled activity</button>
            <span style={{ fontSize: 13 }}>Preview live and scheduled arrivals.</span>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {ready && <ConnectedTimeline
              trace_id={demo.fixture.traceId}
              addCommand={() => undefined}
              submitCommand={() => undefined}
            />}
          </div>
        </div>
      </Provider>
    </MemoryRouter>
  );
}

export default {
  title: 'App/Activity arrivals', component: ArrivalDemo, parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ArrivalDemo>;

export const Splash: StoryObj<typeof ArrivalDemo> = {};
