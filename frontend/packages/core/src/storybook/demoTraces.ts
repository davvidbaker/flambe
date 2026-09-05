import type { AppChartFixture } from './fixtureTrace';

export function demoTraces(fixture: AppChartFixture) {
  return [
    { id: fixture.traceId, name: fixture.traceName },
    { id: 9002, name: 'Main' },
    { id: 9003, name: 'Incident review' },
  ];
}
