import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  FlameChartProps,
  FlameChartSelection,
  FlameLane,
  FlameLaneSelection,
  FlameSpan,
} from './types';

const DEFAULT_COLORS = ['#f97316', '#fb7185', '#facc15', '#34d399', '#60a5fa', '#a78bfa'];

type SpanHit = { type: 'span'; span: FlameSpan; x: number; y: number; width: number; height: number };
type LaneHit = { type: 'lane'; lane: FlameLane; x: number; y: number; width: number; height: number };
type HitRect = SpanHit | LaneHit;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hash(value: string) {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) result = ((result << 5) - result + value.charCodeAt(i)) | 0;
  return Math.abs(result);
}

function spanColor(span: FlameSpan) {
  if (span.color) return span.color;
  return DEFAULT_COLORS[hash(String(span.lane ?? span.label)) % DEFAULT_COLORS.length];
}

export function FlameChart({
  spans,
  lanes,
  start,
  end,
  height = 320,
  rowHeight = 24,
  laneHeaderHeight = 20,
  laneGap = 8,
  padding = 12,
  background = '#111827',
  textColor = '#f9fafb',
  gridColor = 'rgba(255,255,255,0.10)',
  className,
  style,
  selectedSpanId,
  hoveredSpanId,
  onSpanClick,
  onSpanHover,
  onLaneClick,
  onBackgroundClick,
  formatTime = (value) => `${value.toFixed(0)} ms`,
}: FlameChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRects = useRef<HitRect[]>([]);
  const [canvasWidth, setCanvasWidth] = useState(0);

  const domain = useMemo(() => {
    if (spans.length === 0) return { start: start ?? 0, end: end ?? 1 };
    const derivedStart = Math.min(...spans.map((span) => span.start));
    const derivedEnd = Math.max(...spans.map((span) => span.end));
    const resolvedStart = start ?? derivedStart;
    const resolvedEnd = end ?? derivedEnd;
    return { start: resolvedStart, end: resolvedEnd > resolvedStart ? resolvedEnd : resolvedStart + 1 };
  }, [spans, start, end]);

  const layout = useMemo(() => {
    const spansByLane = new Map<string, FlameSpan[]>();
    for (const span of spans) {
      const laneId = span.lane ?? 'default';
      if (!spansByLane.has(laneId)) spansByLane.set(laneId, []);
      spansByLane.get(laneId)!.push(span);
    }

    const explicit = lanes ?? [];
    const laneIds = new Set(explicit.map((lane) => lane.id));
    const inferred: FlameLane[] = [...spansByLane.keys()]
      .filter((laneId) => !laneIds.has(laneId))
      .map((laneId) => ({ id: laneId, label: laneId }));

    return [...explicit, ...inferred].map((lane) => {
      const laneSpans = spansByLane.get(lane.id) ?? [];
      return {
        lane,
        spans: [...laneSpans].sort((a, b) => a.start - b.start || (a.depth ?? 0) - (b.depth ?? 0)),
        maxDepth: Math.max(0, ...laneSpans.map((span) => span.depth ?? 0)),
      };
    });
  }, [lanes, spans]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateWidth = () => setCanvasWidth(canvas.getBoundingClientRect().width);
    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(canvas);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasWidth <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, canvasWidth);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const labelWidth = Math.min(140, Math.max(72, width * 0.18));
    const chartLeft = labelWidth + padding;
    const chartWidth = Math.max(1, width - chartLeft - padding);
    const duration = domain.end - domain.start;
    const xFor = (value: number) => chartLeft + ((value - domain.start) / duration) * chartWidth;

    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 5; i += 1) {
      const t = domain.start + (duration * i) / 5;
      const x = xFor(t);
      ctx.strokeStyle = gridColor;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.65;
      ctx.fillText(formatTime(t - domain.start), x + 4, 10);
      ctx.globalAlpha = 1;
    }

    const nextRects: HitRect[] = [];
    let y = 0;
    for (const entry of layout) {
      if (y >= height) break;
      const { lane } = entry;
      const headerY = y;
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.82;
      ctx.fillText(lane.collapsed ? '▸' : '▾', padding, headerY + laneHeaderHeight / 2);
      ctx.fillText(lane.label ?? lane.id, padding + 16, headerY + laneHeaderHeight / 2);
      ctx.globalAlpha = 1;
      nextRects.push({ type: 'lane', lane, x: 0, y: headerY, width, height: laneHeaderHeight });
      y += laneHeaderHeight;

      if (!lane.collapsed) {
        const laneHeight = entry.spans.length > 0 ? (entry.maxDepth + 1) * rowHeight : 0;
        for (const span of entry.spans) {
          const depth = span.depth ?? 0;
          const spanY = y + depth * rowHeight;
          const rawX = xFor(span.start);
          const rawX2 = xFor(span.end);
          const x = Math.min(rawX, rawX2);
          const spanWidth = Math.max(1, Math.abs(rawX2 - rawX));
          const blockHeight = rowHeight - 3;
          ctx.fillStyle = spanColor(span);
          ctx.globalAlpha = selectedSpanId == null || selectedSpanId === span.id ? 1 : 0.5;
          ctx.fillRect(x, spanY, spanWidth, blockHeight);
          ctx.globalAlpha = 1;

          if (hoveredSpanId === span.id) {
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(x, spanY, spanWidth, blockHeight);
          }

          if (selectedSpanId === span.id) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, spanY + 1, Math.max(0, spanWidth - 2), Math.max(0, blockHeight - 2));
          }

          ctx.save();
          ctx.beginPath();
          ctx.rect(x + 4, spanY, Math.max(0, spanWidth - 8), blockHeight);
          ctx.clip();
          ctx.fillStyle = textColor;
          ctx.fillText(span.label, x + 6, spanY + blockHeight / 2);
          ctx.restore();

          nextRects.push({ type: 'span', span, x, y: spanY, width: spanWidth, height: blockHeight });
        }
        y += laneHeight;
      }

      y += laneGap;
    }

    hitRects.current = nextRects;
  }, [background, canvasWidth, domain, formatTime, gridColor, height, hoveredSpanId, laneGap, laneHeaderHeight, layout, padding, rowHeight, selectedSpanId, textColor]);

  function pointer(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    };
  }

  function hitAt(event: React.MouseEvent<HTMLCanvasElement>): HitRect | null {
    const { x, y } = pointer(event);
    return [...hitRects.current].reverse().find((entry) =>
      x >= entry.x && x <= entry.x + entry.width && y >= entry.y && y <= entry.y + entry.height) ?? null;
  }

  function spanSelection(event: React.MouseEvent<HTMLCanvasElement>, hit: SpanHit): FlameChartSelection {
    const { x, y } = pointer(event);
    return { span: hit.span, x, y };
  }

  function laneSelection(event: React.MouseEvent<HTMLCanvasElement>, hit: LaneHit): FlameLaneSelection {
    const { x, y } = pointer(event);
    return { lane: hit.lane, x, y };
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height, borderRadius: 0, ...style }}
      role="img"
      aria-label="Flame chart"
      onClick={(event) => {
        const hit = hitAt(event);
        if (hit?.type === 'span') {
          onSpanClick?.(spanSelection(event, hit));
          return;
        }
        if (hit?.type === 'lane') {
          onLaneClick?.(laneSelection(event, hit));
          return;
        }
        onBackgroundClick?.(pointer(event));
      }}
      onMouseMove={(event) => {
        const hit = hitAt(event);
        event.currentTarget.style.cursor = hit?.type === 'lane' ? 'pointer' : 'default';
        onSpanHover?.(hit?.type === 'span' ? spanSelection(event, hit) : null);
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.cursor = 'default';
        onSpanHover?.(null);
      }}
    />
  );
}
