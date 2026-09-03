import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import dayjs from 'dayjs';

import formatTimelineTickLabel from './formatTimelineTickLabel';
import { DAY, HOUR, MINUTE, MONTH, SECOND } from './time';

describe('formatTimelineTickLabel', () => {
  const noon = new Date('2024-06-15T12:34:56.789').getTime();

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(noon + 5 * MINUTE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats relative age by default', () => {
    expect(formatTimelineTickLabel(noon, { visibleSpanMs: HOUR })).toBe('5m');
  });

  it('picks absolute granularity from the visible span', () => {
    const instant = dayjs(noon);

    expect(formatTimelineTickLabel(noon, {
      absolute: true,
      visibleSpanMs: SECOND,
    })).toBe(instant.format('HH:mm:ss.SSS'));

    expect(formatTimelineTickLabel(noon, {
      absolute: true,
      visibleSpanMs: MINUTE,
    })).toBe(instant.format('HH:mm:ss'));

    expect(formatTimelineTickLabel(noon, {
      absolute: true,
      visibleSpanMs: HOUR,
    })).toBe(instant.format('MMM D HH:mm'));

    expect(formatTimelineTickLabel(noon, {
      absolute: true,
      visibleSpanMs: HOUR,
      previousTimestamp: noon - MINUTE,
    })).toBe(instant.format('HH:mm'));

    expect(formatTimelineTickLabel(noon, {
      absolute: true,
      visibleSpanMs: DAY,
    })).toBe(instant.format('MMM D HH:mm'));

    expect(formatTimelineTickLabel(noon, {
      absolute: true,
      visibleSpanMs: DAY,
      previousTimestamp: noon - HOUR,
    })).toBe(instant.format('HH:mm'));

    expect(formatTimelineTickLabel(noon, {
      absolute: true,
      visibleSpanMs: MONTH,
    })).toBe(instant.format('MMM D'));

    expect(formatTimelineTickLabel(noon, {
      absolute: true,
      visibleSpanMs: 2 * 365 * DAY,
    })).toBe(instant.format('MMM YYYY'));

    expect(formatTimelineTickLabel(noon, {
      absolute: true,
      visibleSpanMs: 10 * 365 * DAY,
    })).toBe(instant.format('YYYY'));
  });

  it('formats absolute labels with a 12-hour clock when requested', () => {
    const instant = dayjs(noon);

    expect(formatTimelineTickLabel(noon, {
      absolute: true,
      twelveHour: true,
      visibleSpanMs: HOUR,
      previousTimestamp: noon - MINUTE,
    })).toBe(instant.format('h:mm A'));

    expect(formatTimelineTickLabel(noon, {
      absolute: true,
      twelveHour: true,
      visibleSpanMs: DAY,
    })).toBe(instant.format('MMM D h:mm A'));
  });
});
