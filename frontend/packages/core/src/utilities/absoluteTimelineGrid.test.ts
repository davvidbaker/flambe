import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';

import {
  absoluteGridTimes,
  chooseAbsoluteGridStep,
} from './absoluteTimelineGrid';
import { DAY, HOUR, MINUTE } from './time';

describe('absoluteTimelineGrid', () => {
  it('chooses hour steps that fit the viewport instead of epoch residues', () => {
    const step = chooseAbsoluteGridStep(24 * HOUR, 900, 100);
    expect(step).toEqual({ kind: 'ms', ms: 3 * HOUR });
  });

  it('emits ticks on local hour boundaries', () => {
    const left = dayjs('2024-06-15T11:10:00').valueOf();
    const right = left + 12 * HOUR;
    const times = absoluteGridTimes(left, right, { kind: 'ms', ms: 3 * HOUR });

    expect(times.map(t => dayjs(t).format('HH:mm'))).toEqual([
      '12:00',
      '15:00',
      '18:00',
      '21:00',
    ]);
  });

  it('emits ticks on local midnights for day steps', () => {
    const left = dayjs('2024-06-15T11:10:00').valueOf();
    const right = left + 3 * DAY;
    const times = absoluteGridTimes(left, right, { kind: 'ms', ms: DAY });

    expect(times.map(t => dayjs(t).format('YYYY-MM-DD HH:mm'))).toEqual([
      '2024-06-16 00:00',
      '2024-06-17 00:00',
      '2024-06-18 00:00',
    ]);
  });

  it('emits minute-aligned ticks for short windows', () => {
    const left = dayjs('2024-06-15T12:04:00').valueOf();
    const right = left + 20 * MINUTE;
    const times = absoluteGridTimes(left, right, { kind: 'ms', ms: 5 * MINUTE });

    expect(times.map(t => dayjs(t).format('HH:mm'))).toEqual([
      '12:05',
      '12:10',
      '12:15',
      '12:20',
    ]);
  });
});
