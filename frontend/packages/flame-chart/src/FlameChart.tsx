import { useEffect, useMemo, useRef, useState } from 'react';
import type { FlameChartProps, FlameChartSelection, FlameSpan } from './types';

const DEFAULT_COLORS = ['#f97316', '#fb7185', '#facc15', '#34d399', '#60a5fa', '#a78bfa'];

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
  start,
  end,
  height = 320,
  rowHeight = 24,
  laneGap = 8,
  padding = 12,
  background = '#111827',
  textColor = '#f9fafb',
  gridColor = 'rgba(255,255,255,0.10)',
  className,
  style,
  selectedSpanId,
  onSpanClick,
  onSpanHover,
  formatTime = (value) => `${value.toFixed(0)} ms`,
}: FlameChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRects = useRef<Array<{ span: FlameSpan; x: number; y: number; width: number; height: number }>>([]);
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
    const lanes = new Map<string, FlameSpan[]>();
    for (const span of spans) {
      const lane = span.lane ?? 'default';
      if (!lanes.has(lane)) lanes.set(lane, []);
      lanes.get(lane)!.push(span);
    }
    return [...lanes.entries()].map(([lane, laneSpans]) => ({
      lane,
      spans: [...laneSpans].sort((a, b) => a.start - b.start || (a.depth ?? 0) - (b.depth ?? 0)),
      maxDepth: Math.max(0, ...laneSpans.map((span) => span.depth ?? 0)),
    }));
  }, [spans]);

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

    const nextRects: typeof hitRects.current = [];
    let y = 30;
    for (const lane of layout) {
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.72;
      ctx.fillText(lane.lane, padding, y + rowHeight / 2);
      ctx.globalAlpha = 1;
      const laneHeight = (lane.maxDepth + 1) * rowHeight;

      for (const span of lane.spans) {
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

        nextRects.push({ span, x, y: spanY, width: spanWidth, height: blockHeight });
      }
      y += laneHeight + laneGap + 8;
      if (y > height) break;
    }

    hitRects.current = nextRects;
  }, [background, canvasWidth, domain, formatTime, gridColor, height, laneGap, layout, padding, rowHeight, selectedSpanId, textColor]);

  function selectionAt(event: React.MouseEvent<HTMLCanvasElement>): FlameChartSelection | null {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);
    const hit = [...hitRects.current].reverse().find((entry) => x >= entry.x && x <= entry.x + entry.width && y >= entry.y && y <= entry.y + entry.height);
    return hit ? { span: hit.span, x, y } : null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height, borderRadius: 8, ...style }}
      role="img"
      aria-label="Flame chart"
      onClick={(event) => {
        const selection = selectionAt(event);
        if (selection) onSpanClick?.(selection);
      }}
      onMouseMove={(event) => onSpanHover?.(selectionAt(event))}
      onMouseLeave={() => onSpanHover?.(null)}
    />
  );
}
