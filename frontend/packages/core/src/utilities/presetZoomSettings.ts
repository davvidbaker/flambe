export interface BezierNode {
  x: number;
  y: number;
  inX: number;
  inY: number;
  outX: number;
  outY: number;
}

export type PresetZoomCurve = BezierNode[];

export interface PresetZoomSettings {
  durationMs: number;
  curvesLinked: boolean;
  panCurve: PresetZoomCurve;
  zoomCurve: PresetZoomCurve;
}

export const DEFAULT_PRESET_ZOOM_CURVE: PresetZoomCurve = [
  { x: 0, y: 0, inX: 0, inY: 0, outX: 0.11, outY: 0.5 },
  { x: 0.52, y: 0.92, inX: 0.3, inY: 0.82, outX: 0.68, outY: 1.04 },
  { x: 1, y: 1, inX: 0.86, inY: 1, outX: 1, outY: 1 },
];

export const DEFAULT_PRESET_ZOOM_SETTINGS: PresetZoomSettings = {
  durationMs: 320,
  curvesLinked: false,
  panCurve: DEFAULT_PRESET_ZOOM_CURVE,
  zoomCurve: DEFAULT_PRESET_ZOOM_CURVE,
};

const storageKey = 'flambe.timeline.preset-zoom.v1';
const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.min(max, numeric)) : fallback;
};

export function clampPresetZoomDuration(value: unknown): number {
  return Math.round(clamp(value, 100, 1_000, 320));
}

export function normalizePresetZoomCurve(value: unknown): PresetZoomCurve {
  if (!Array.isArray(value) || value.length < 2 || value.length > 8) {
    return DEFAULT_PRESET_ZOOM_CURVE;
  }

  const nodes = value.map((raw, index) => {
    const fallback = DEFAULT_PRESET_ZOOM_CURVE[Math.min(index, 2)]!;
    const record = raw && typeof raw === 'object' ? raw as Partial<BezierNode> : {};
    return {
      x: clamp(record.x, 0, 1, fallback.x),
      y: clamp(record.y, -1, 2, fallback.y),
      inX: clamp(record.inX, 0, 1, fallback.inX),
      inY: clamp(record.inY, -1, 2, fallback.inY),
      outX: clamp(record.outX, 0, 1, fallback.outX),
      outY: clamp(record.outY, -1, 2, fallback.outY),
    };
  }).sort((left, right) => left.x - right.x);

  nodes[0] = { ...nodes[0]!, x: 0, y: 0, inX: 0, inY: 0 };
  nodes[nodes.length - 1] = {
    ...nodes[nodes.length - 1]!, x: 1, y: 1, outX: 1, outY: 1,
  };
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const left = nodes[index]!;
    const right = nodes[index + 1]!;
    left.outX = clamp(left.outX, left.x, right.x, left.x);
    right.inX = clamp(right.inX, left.x, right.x, right.x);
  }
  return nodes;
}

export function parsePresetZoomCurve(value: string): PresetZoomCurve {
  try {
    return normalizePresetZoomCurve(JSON.parse(value));
  } catch {
    return DEFAULT_PRESET_ZOOM_CURVE;
  }
}

export function serializePresetZoomCurve(curve: PresetZoomCurve): string {
  return JSON.stringify(normalizePresetZoomCurve(curve));
}

export function loadPresetZoomSettings(): PresetZoomSettings {
  if (typeof window === 'undefined') return DEFAULT_PRESET_ZOOM_SETTINGS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
    if (!stored || typeof stored !== 'object') return DEFAULT_PRESET_ZOOM_SETTINGS;
    const legacyCurve = stored.x1 !== undefined
      ? [
          { x: 0, y: 0, inX: 0, inY: 0, outX: stored.x1, outY: stored.y1 },
          { x: 1, y: 1, inX: stored.x2, inY: stored.y2, outX: 1, outY: 1 },
        ]
      : stored.curve;
    const previousCurve = stored.x1 !== undefined
      ? legacyCurve
      : stored.curve;
    return {
      durationMs: clampPresetZoomDuration(stored.durationMs),
      curvesLinked: Boolean(stored.curvesLinked),
      panCurve: normalizePresetZoomCurve(stored.panCurve ?? previousCurve),
      zoomCurve: normalizePresetZoomCurve(stored.zoomCurve ?? previousCurve),
    };
  } catch {
    return DEFAULT_PRESET_ZOOM_SETTINGS;
  }
}

export function savePresetZoomSettings(settings: PresetZoomSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // Ignore unavailable or full local storage.
  }
}
