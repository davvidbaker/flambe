import dayjs from 'dayjs';

import { DAY, HOUR, MINUTE, SECOND } from './time';

/** Wall-clock-friendly steps for absolute timeline ticks. */
const NICE_STEPS_MS = [
  1,
  2,
  5,
  10,
  20,
  25,
  50,
  100,
  200,
  250,
  500,
  SECOND,
  2 * SECOND,
  5 * SECOND,
  10 * SECOND,
  15 * SECOND,
  30 * SECOND,
  MINUTE,
  2 * MINUTE,
  5 * MINUTE,
  10 * MINUTE,
  15 * MINUTE,
  30 * MINUTE,
  HOUR,
  2 * HOUR,
  3 * HOUR,
  4 * HOUR,
  6 * HOUR,
  12 * HOUR,
  DAY,
  2 * DAY,
  7 * DAY,
  14 * DAY,
];

const MONTH_MS = 30 * DAY;
const YEAR_MS = 365 * DAY;

export type AbsoluteGridStep =
  | { kind: 'ms'; ms: number }
  | { kind: 'month' }
  | { kind: 'year' };

/** Choose a step large enough that ticks stay about `minSlicePx` apart. */
export function chooseAbsoluteGridStep(
  visibleSpanMs: number,
  widthPx: number,
  minSlicePx: number,
): AbsoluteGridStep {
  const targetCount = Math.max(1, widthPx / Math.max(1, minSlicePx));
  const ideal = visibleSpanMs / targetCount;

  for (const ms of NICE_STEPS_MS) {
    if (ms >= ideal) return { kind: 'ms', ms };
  }
  if (ideal <= MONTH_MS) return { kind: 'month' };
  return { kind: 'year' };
}

function ceilToLocalMsStep(time: number, stepMs: number): number {
  if (stepMs >= DAY) {
    const days = Math.round(stepMs / DAY);
    if (days === 7 || days === 14) {
      let tick = dayjs(time).startOf('week');
      if (tick.valueOf() < time) tick = tick.add(days === 14 ? 2 : 1, 'week');
      return tick.valueOf();
    }
    let tick = dayjs(time).startOf('day');
    if (tick.valueOf() < time) tick = tick.add(1, 'day');
    if (days > 1) {
      // Keep multi-day steps on local midnights; spacing may be exact days.
      const dayIndex = Math.floor(tick.startOf('day').valueOf() / DAY);
      const rem = ((dayIndex % days) + days) % days;
      if (rem !== 0) tick = tick.add(days - rem, 'day');
    }
    return tick.valueOf();
  }

  // Steps that evenly divide a local day align from local midnight, so labels
  // land on :00 / :15 / :30 rather than awkward epoch residues.
  if (DAY % stepMs === 0) {
    const dayStart = dayjs(time).startOf('day').valueOf();
    if (time <= dayStart) return dayStart;
    return dayStart + Math.ceil((time - dayStart) / stepMs) * stepMs;
  }

  return Math.ceil(time / stepMs) * stepMs;
}

function advanceAbsoluteGridTime(time: number, step: AbsoluteGridStep): number {
  if (step.kind === 'year') return dayjs(time).add(1, 'year').valueOf();
  if (step.kind === 'month') return dayjs(time).add(1, 'month').valueOf();
  if (step.ms >= DAY) {
    const days = Math.round(step.ms / DAY);
    if (days === 7) return dayjs(time).add(1, 'week').valueOf();
    if (days === 14) return dayjs(time).add(2, 'week').valueOf();
    return dayjs(time).add(days, 'day').valueOf();
  }
  return time + step.ms;
}

function ceilToAbsoluteGridTime(time: number, step: AbsoluteGridStep): number {
  if (step.kind === 'year') {
    let tick = dayjs(time).startOf('year');
    if (tick.valueOf() < time) tick = tick.add(1, 'year');
    return tick.valueOf();
  }
  if (step.kind === 'month') {
    let tick = dayjs(time).startOf('month');
    if (tick.valueOf() < time) tick = tick.add(1, 'month');
    return tick.valueOf();
  }
  return ceilToLocalMsStep(time, step.ms);
}

/** Inclusive-start tick times covering [left, right] for absolute labels. */
export function absoluteGridTimes(
  leftBoundaryTime: number,
  rightBoundaryTime: number,
  step: AbsoluteGridStep,
): number[] {
  const times: number[] = [];
  let time = ceilToAbsoluteGridTime(leftBoundaryTime, step);
  while (time <= rightBoundaryTime) {
    times.push(time);
    const next = advanceAbsoluteGridTime(time, step);
    if (next <= time) break;
    time = next;
    if (times.length > 500) break;
  }
  return times;
}

export function absoluteGridStepMs(step: AbsoluteGridStep): number {
  if (step.kind === 'year') return YEAR_MS;
  if (step.kind === 'month') return MONTH_MS;
  return step.ms;
}
