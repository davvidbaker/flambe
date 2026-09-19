import { describe, expect, it } from 'vitest';

import type { Observation } from '../reducers/user';
import { DAY, HOUR } from './time';
import {
  CARBON_COLOR,
  formatObservationValue,
  groupObservationSeries,
  hoverSamples,
  independentScale,
  localMidnight,
  niceScale,
  observationScale,
  pickAxisSeries,
  nextLocalMidnight,
  observationTime,
  pathPoints,
  sampleSeriesAtTime,
  valueToY,
} from './observationSeries';

const carbon = (
  on: string,
  value: number,
  timestamp = Date.parse(`${on}T18:00:00Z`),
): Observation => ({
  kind: 'carbon',
  value,
  unit: 'gCO2eq/kWh',
  observed_on: on,
  timestamp,
});

const mood = (timestamp: number, value: number): Observation => ({
  kind: 'mood',
  value,
  timestamp,
});

describe('observationTime', () => {
  it('maps observed_on to local midnight, not the record timestamp or UTC date parse', () => {
    const time = observationTime(carbon('2026-09-04', 312.4));
    const local = new Date(time);

    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(8);
    expect(local.getDate()).toBe(4);
    expect(local.getHours()).toBe(0);
    expect(local.getMinutes()).toBe(0);
    expect(time).toBe(localMidnight('2026-09-04'));
    expect(time).not.toBe(Date.parse('2026-09-04T18:00:00Z'));
  });

  it('uses timestamp when observed_on is missing', () => {
    const timestamp = Date.parse('2026-09-04T15:30:00');
    expect(observationTime(mood(timestamp, 4))).toBe(timestamp);
  });
});

describe('groupObservationSeries', () => {
  it('groups finite values by kind and skips non-finite values', () => {
    const series = groupObservationSeries([
      carbon('2026-09-03', 300),
      carbon('2026-09-04', 320),
      { kind: 'carbon', value: Number.NaN, timestamp: 1, observed_on: '2026-09-05' },
      mood(Date.parse('2026-09-04T12:00:00'), 5),
    ]);

    expect(series.map(({ kind }) => kind)).toEqual(['carbon', 'mood']);
    expect(series[0].dated).toBe(true);
    expect(series[0].color).toBe(CARBON_COLOR);
    expect(series[0].points.map(point => point.value)).toEqual([300, 320]);
    expect(series[1].dated).toBe(false);
    expect(series[1].points).toHaveLength(1);
  });
});

describe('pathPoints', () => {
  it('carries a dated value into the window when the day started before the left edge', () => {
    const [carbonSeries] = groupObservationSeries([
      carbon('2026-09-04', 280),
      carbon('2026-09-05', 310),
    ]);
    const left = localMidnight('2026-09-04') + 12 * HOUR;
    const right = localMidnight('2026-09-05') + 6 * HOUR;

    expect(pathPoints(carbonSeries, left, right).map(point => point.value)).toEqual([280, 310]);
  });

  it('includes an undated point before the left edge when the polyline crosses in', () => {
    const t0 = Date.parse('2026-09-04T08:00:00');
    const t1 = Date.parse('2026-09-04T16:00:00');
    const [moodSeries] = groupObservationSeries([mood(t0, 2), mood(t1, 6)]);
    const left = t0 + 4 * HOUR;
    const right = t1 + HOUR;

    expect(pathPoints(moodSeries, left, right).map(point => point.value)).toEqual([2, 6]);
  });
});

describe('independentScale and sampleSeriesAtTime', () => {
  it('scales each series from its own min and max', () => {
    expect(independentScale([280, 320])).toEqual({ min: 280, max: 320 });
    expect(independentScale([3, 5])).toEqual({ min: 3, max: 5 });
    expect(independentScale([10])).toEqual({ min: 9, max: 11 });
  });

  it('nices a domain onto round ticks', () => {
    expect(niceScale(0, 320).ticks).toEqual([0, 100, 200, 300, 400]);
    expect(niceScale(0, 320).max).toBe(400);
  });

  it('includes zero for unipolar observation values so magnitude is readable', () => {
    const scale = observationScale([280, 320]);
    expect(scale.min).toBe(0);
    expect(scale.max).toBe(400);
    expect(scale.ticks[0]).toBe(0);
    expect(scale.ticks).toContain(400);
  });

  it('keeps a bipolar domain across zero', () => {
    const scale = observationScale([-4, 6]);
    expect(scale.min).toBeLessThan(0);
    expect(scale.max).toBeGreaterThan(0);
    expect(scale.ticks.some(tick => tick === 0)).toBe(true);
  });

  it('picks the first series until hover names a kind', () => {
    const series = groupObservationSeries([
      carbon('2026-09-04', 280),
      mood(localMidnight('2026-09-04') + 4 * HOUR, 2),
    ]);
    expect(pickAxisSeries(series, [])?.kind).toBe('carbon');
    expect(pickAxisSeries(series, [{
      kind: 'mood',
      value: 2,
      unit: null,
      color: series[1].color,
    }])?.kind).toBe('mood');
    expect(pickAxisSeries([], [])).toBeNull();
  });

  it('holds a dated value through the local day and interpolates undated points', () => {
    const [carbonSeries, moodSeries] = groupObservationSeries([
      carbon('2026-09-04', 280),
      carbon('2026-09-05', 310),
      mood(localMidnight('2026-09-04') + 4 * HOUR, 2),
      mood(localMidnight('2026-09-04') + 12 * HOUR, 6),
    ]);
    const morning = localMidnight('2026-09-04') + 8 * HOUR;

    expect(sampleSeriesAtTime(carbonSeries, morning)).toBe(280);
    expect(sampleSeriesAtTime(carbonSeries, localMidnight('2026-09-05') + HOUR)).toBe(310);
    expect(sampleSeriesAtTime(carbonSeries, localMidnight('2026-09-06'))).toBeNull();
    expect(sampleSeriesAtTime(moodSeries, morning)).toBe(4);

    const samples = hoverSamples([carbonSeries, moodSeries], morning);
    expect(samples).toEqual([
      {
        kind: 'carbon',
        value: 280,
        unit: 'gCO2eq/kWh',
        color: CARBON_COLOR,
      },
      {
        kind: 'mood',
        value: 4,
        unit: null,
        color: moodSeries.color,
      },
    ]);
  });
});

describe('valueToY and formatObservationValue', () => {
  it('maps higher values toward the top of the chart', () => {
    expect(valueToY(10, 0, 10, 100, 0)).toBe(0);
    expect(valueToY(0, 0, 10, 100, 0)).toBe(100);
    expect(valueToY(5, 0, 10, 100, 15)).toBe(65);
  });

  it('formats values compactly', () => {
    expect(formatObservationValue(312)).toBe('312');
    expect(formatObservationValue(312.44)).toBe('312.4');
  });
});

describe('nextLocalMidnight', () => {
  it('advances one calendar day from local midnight', () => {
    const start = localMidnight('2026-09-04');
    expect(nextLocalMidnight(start) - start).toBe(DAY);
  });
});
