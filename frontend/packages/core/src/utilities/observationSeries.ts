import type { Observation } from '../reducers/user';

export const CARBON_COLOR = '#C45C26';

export interface ObservationPoint {
  kind: string;
  time: number;
  value: number;
  unit?: string | null;
  dated: boolean;
}

export interface ObservationSeries {
  kind: string;
  dated: boolean;
  unit?: string | null;
  color: string;
  points: ObservationPoint[];
}

export interface HoverSample {
  kind: string;
  value: number;
  unit?: string | null;
  color: string;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

export function localMidnight(isoDate: string): number {
  const match = ISO_DATE.exec(isoDate.trim());
  if (!match) return Number.NaN;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day).getTime();
}

export function nextLocalMidnight(time: number): number {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
}

export function observationTime(observation: Observation): number {
  if (observation.observed_on) {
    const midnight = localMidnight(observation.observed_on);
    if (Number.isFinite(midnight)) return midnight;
  }
  return observation.timestamp;
}

export function kindColor(kind: string): string {
  if (kind === 'carbon') return CARBON_COLOR;
  let hash = 0;
  for (let index = 0; index < kind.length; index += 1) {
    hash = (hash * 31 + kind.charCodeAt(index)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 55% 38%)`;
}

export function groupObservationSeries(observations: Observation[] = []): ObservationSeries[] {
  const byKind = new Map<string, ObservationPoint[]>();

  observations.forEach(observation => {
    if (!Number.isFinite(observation.value)) return;
    const time = observationTime(observation);
    if (!Number.isFinite(time)) return;
    const dated = Boolean(observation.observed_on);
    const point: ObservationPoint = {
      kind: observation.kind,
      time,
      value: observation.value,
      unit: observation.unit,
      dated,
    };
    const points = byKind.get(observation.kind) ?? [];
    points.push(point);
    byKind.set(observation.kind, points);
  });

  return [...byKind.entries()].map(([kind, points]) => {
    const sorted = [...points].sort((left, right) => left.time - right.time);
    const dated = sorted.length > 0 && sorted.every(point => point.dated);
    const unit = [...sorted].reverse().find(point => point.unit)?.unit ?? null;
    return {
      kind,
      dated,
      unit,
      color: kindColor(kind),
      points: sorted,
    };
  });
}

export function independentScale(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
    return { min: min - pad, max: max + pad };
  }
  return { min, max };
}

function cleanFloat(value: number): number {
  return Number(value.toPrecision(12));
}

/** Graphics-Gems "nice number" for axis step / span. */
function niceNumber(span: number, round: boolean): number {
  if (!(span > 0) || !Number.isFinite(span)) return 1;
  const exponent = Math.floor(Math.log10(span));
  const fraction = span / 10 ** exponent;
  let niceFraction: number;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * 10 ** exponent;
}

export function niceScale(
  min: number,
  max: number,
  targetCount = 5,
): { min: number; max: number; ticks: number[] } {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return { min: 0, max: 1, ticks: [0, 1] };
  }
  if (min === max) {
    const padded = independentScale([min]);
    return niceScale(padded.min, padded.max, targetCount);
  }

  const range = niceNumber(max - min, false);
  const step = niceNumber(range / Math.max(1, targetCount - 1), true);
  const niceMin = cleanFloat(Math.floor(min / step) * step);
  const niceMax = cleanFloat(Math.ceil(max / step) * step);
  const ticks: number[] = [];
  const last = niceMax + step * 0.5;
  for (let value = niceMin; value <= last; value = cleanFloat(value + step)) {
    ticks.push(cleanFloat(value));
  }
  return { min: niceMin, max: niceMax, ticks };
}

/** Visible-window scale for an observation series: include 0 when unipolar, then nice ticks. */
export function observationScale(values: number[], targetCount = 5): {
  min: number;
  max: number;
  ticks: number[];
} {
  if (values.length === 0) return niceScale(0, 1, targetCount);
  const raw = independentScale(values);
  let { min, max } = raw;
  if (values.every(value => value >= 0)) min = 0;
  else if (values.every(value => value <= 0)) max = 0;
  return niceScale(min, max, targetCount);
}

export function pickAxisSeries(
  seriesList: ObservationSeries[],
  hover: HoverSample[],
): ObservationSeries | null {
  if (seriesList.length === 0) return null;
  if (hover.length === 0) return seriesList[0];
  return seriesList.find(series => series.kind === hover[0].kind) ?? seriesList[0];
}

export function pathPoints(
  series: ObservationSeries,
  left: number,
  right: number,
): ObservationPoint[] {
  const { points } = series;
  if (points.length === 0 || right < left) return [];

  const firstAtOrAfterLeft = points.findIndex(point => point.time >= left);
  const lastBeforeLeft = firstAtOrAfterLeft === -1 ? points.length - 1 : firstAtOrAfterLeft - 1;
  const result: ObservationPoint[] = [];

  if (lastBeforeLeft >= 0) {
    const carry = points[lastBeforeLeft];
    const next = points[lastBeforeLeft + 1];
    if (series.dated) {
      const holdEnd = next?.time ?? nextLocalMidnight(carry.time);
      if (holdEnd > left) result.push(carry);
    } else if (next && next.time >= left && carry.time <= right) {
      result.push(carry);
    }
  }

  points.forEach(point => {
    if (point.time >= left && point.time <= right) result.push(point);
  });

  return result;
}

export function sampleSeriesAtTime(series: ObservationSeries, time: number): number | null {
  const { points } = series;
  if (points.length === 0) return null;

  if (series.dated) {
    let held: ObservationPoint | null = null;
    for (const point of points) {
      if (point.time <= time) held = point;
      else break;
    }
    if (!held) return null;
    const next = points.find(point => point.time > held.time);
    const holdEnd = next?.time ?? nextLocalMidnight(held.time);
    return time < holdEnd ? held.value : null;
  }

  if (time < points[0].time || time > points[points.length - 1].time) return null;
  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index];
    const right = points[index + 1];
    if (time === left.time) return left.value;
    if (time > left.time && time <= right.time) {
      const span = right.time - left.time;
      if (span === 0) return right.value;
      const t = (time - left.time) / span;
      return left.value + (right.value - left.value) * t;
    }
  }
  return points[points.length - 1].value;
}

export function hoverSamples(
  seriesList: ObservationSeries[],
  time: number,
): HoverSample[] {
  return seriesList.flatMap(series => {
    const value = sampleSeriesAtTime(series, time);
    if (value === null) return [];
    return [{
      kind: series.kind,
      value,
      unit: series.unit,
      color: series.color,
    }];
  });
}

export function valueToY(
  value: number,
  min: number,
  max: number,
  chartHeight: number,
  paddingY: number,
): number {
  if (max === min) return paddingY + chartHeight / 2;
  return paddingY + chartHeight - ((value - min) * chartHeight) / (max - min);
}

export function formatObservationValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
