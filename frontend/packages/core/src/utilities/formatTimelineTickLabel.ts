import dayjs from 'dayjs';

import shortEnglishHumanizer from './shortEnglishHumanizer';
import { DAY, HOUR, MINUTE, MONTH, SECOND } from './time';

type ClockFormats = {
  withMs: string;
  withSeconds: string;
  withMinutes: string;
};

const CLOCK_24: ClockFormats = {
  withMs: 'HH:mm:ss.SSS',
  withSeconds: 'HH:mm:ss',
  withMinutes: 'HH:mm',
};

const CLOCK_12: ClockFormats = {
  withMs: 'h:mm:ss.SSS A',
  withSeconds: 'h:mm:ss A',
  withMinutes: 'h:mm A',
};

/** Format a timeline axis tick as relative age or absolute clock time. */
export default function formatTimelineTickLabel(
  timestamp: number,
  {
    absolute = false,
    twelveHour = false,
    visibleSpanMs,
    previousTimestamp,
  }: {
    absolute?: boolean;
    /** When absolute, use 12-hour clock with AM/PM. */
    twelveHour?: boolean;
    /** Width of the visible time window; drives absolute-label granularity. */
    visibleSpanMs: number;
    /** Prior tick timestamp; used to omit redundant date prefixes. */
    previousTimestamp?: number | null;
  },
): string {
  if (!absolute) {
    return shortEnglishHumanizer(Date.now() - timestamp);
  }

  const instant = dayjs(timestamp);
  const span = Number.isFinite(visibleSpanMs) ? Math.max(0, visibleSpanMs) : 0;
  const clock = twelveHour ? CLOCK_12 : CLOCK_24;
  const dayChanged = previousTimestamp == null
    || !instant.isSame(dayjs(previousTimestamp), 'day');
  const monthChanged = previousTimestamp == null
    || !instant.isSame(dayjs(previousTimestamp), 'month');
  const yearChanged = previousTimestamp == null
    || !instant.isSame(dayjs(previousTimestamp), 'year');

  // Finer zoom → more precise clock fields; coarser zoom → date/year.
  // Include the date only when it changes so neighboring ticks stay short.
  if (span <= 2 * SECOND) return instant.format(clock.withMs);
  if (span <= 2 * MINUTE) return instant.format(clock.withSeconds);
  if (span <= 12 * HOUR) {
    return dayChanged
      ? instant.format(`MMM D ${clock.withMinutes}`)
      : instant.format(clock.withMinutes);
  }
  if (span <= 2 * DAY) {
    return dayChanged
      ? instant.format(`MMM D ${clock.withMinutes}`)
      : instant.format(clock.withMinutes);
  }
  if (span <= 6 * MONTH) {
    return dayChanged ? instant.format('MMM D') : instant.format('D');
  }
  if (span <= 3 * 365 * DAY) {
    return monthChanged ? instant.format('MMM YYYY') : instant.format('MMM');
  }
  return yearChanged ? instant.format('YYYY') : '';
}
