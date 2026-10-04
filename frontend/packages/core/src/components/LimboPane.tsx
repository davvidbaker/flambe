import * as React from 'react';
import tinycolor from 'tinycolor2';
import styled from 'styled-components';
import { hexHalfWidth, hexPlacements, limboItems } from '../utilities/limbo';
import { threadEmojiLabel } from '../utilities/threadEmoji';
import type { ProcessedActivity } from '../utilities/processTrace';
import { readableTextOn } from '../utilities/readableTextOn';
import type { Category } from '../types/Category';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';

interface Props {
  activities: Record<string, ProcessedActivity>;
  beginActivity: (id: EntityId) => unknown;
  categories: Category[];
  collapsed?: boolean;
  deleteActivity: (id: EntityId, threadId: EntityId) => unknown;
  focusActivity: (id: EntityId) => unknown;
  onToggleCollapsed?: () => unknown;
  planInLimbo?: (name: string) => unknown;
  threads?: Record<string, Thread>;
  updateActivity?: (id: EntityId, updates: Record<string, unknown>) => unknown;
}

/** Height of the collapsed limbo strip (header only). */
export const LIMBO_COLLAPSED_HEIGHT = 36;

const BACKGROUND = '#f4f3f0';
const SURFACE = '#ffffff';
const TEXT = '#262421';
const MUTED = '#6f6b63';
const BORDER = '#d9d6d0';
const FALLBACK_FILL = '#c47b2b';
const TIMELINE_FALLBACK_FILL = '#efc360';
const PADDING = 12;
const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

const LimboLayout = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  background: ${BACKGROUND};
  color: ${TEXT};
  overflow: hidden;
  font-family: sans-serif;
  touch-action: pan-x pan-y;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const LimboField = styled.div`
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const LimboSidebar = styled.div`
  display: flex;
  flex-direction: column;
  width: 280px;
  flex: none;
  border-left: 1px solid ${BORDER};
  background: ${SURFACE};
  min-height: 0;

  @media (max-width: 640px) {
    width: 100%;
    max-height: 44%;
    border-left: 0;
    border-top: 1px solid ${BORDER};
  }
`;

function swatch(activity: ProcessedActivity, categories: Category[]) {
  const category = categories.find(entry => String(entry.id) === String(activity.categories?.[0]));
  const base = category?.color_background ?? FALLBACK_FILL;
  // Suspended work sinks toward the pane background instead of fading, so its label stays readable.
  const fill = activity.status === 'suspended'
    ? tinycolor.mix(base, BACKGROUND, 45).toHexString()
    : base;
  return { fill, text: readableTextOn(fill, category?.color_text) };
}

function statusLabel(activity: ProcessedActivity): string {
  return activity.status === 'suspended' ? 'suspended' : 'not started';
}

function setActivityDragPreview(
  event: React.DragEvent<HTMLElement>,
  activity: ProcessedActivity,
  categories: Category[],
): void {
  const category = categories.find(
    entry => String(entry.id) === String(activity.categories?.[0]),
  );
  const fill = category?.color_background ?? TIMELINE_FALLBACK_FILL;
  const text = readableTextOn(fill, category?.color_text);
  const width = 420;
  const height = 220;
  const blockLeft = 100;
  const blockWidth = 220;
  const blockTop = 140;
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const preview = document.createElement('canvas');
  preview.width = width * scale;
  preview.height = height * scale;
  preview.style.width = `${width}px`;
  preview.style.height = `${height}px`;
  Object.assign(preview.style, {
    filter: 'drop-shadow(0 0 18px rgba(255, 74, 0, 0.85))',
    left: `${event.clientX - blockLeft - 18}px`,
    pointerEvents: 'none',
    position: 'fixed',
    top: `${event.clientY - blockTop - 8}px`,
    zIndex: '2147483647',
  });
  const ctx = preview.getContext('2d');
  if (!ctx) return;
  ctx.scale(scale, scale);

  // Deterministic flame particles keep each activity visually stable while
  // their phase evolves continuously during the drag.
  let seed = Array.from(String(activity.id)).reduce(
    (value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0,
    0x9e3779b9,
  );
  const random = () => {
    seed = ((seed * 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const tongues = Array.from({ length: 15 }, (_, index) => ({
    x: blockLeft + 5 + index * 15 + (random() - 0.5) * 8,
    width: 12 + random() * 18,
    height: 22 + random() * 43,
    lean: (random() - 0.5) * 18,
    phase: random() * Math.PI * 2,
    speed: 2.2 + random() * 2.4,
  }));
  const embers = Array.from({ length: 34 }, () => ({
    x: blockLeft + random() * blockWidth,
    rise: random() * 62,
    radius: 0.6 + random() * 1.5,
    speed: 13 + random() * 24,
    phase: random() * Math.PI * 2,
    hot: random() > 0.35,
  }));
  const fullLabel = activity.name || '';
  ctx.font = '11px sans-serif';
  let label = fullLabel;
  while (label.length > 0 && ctx.measureText(label).width > blockWidth - 10) {
    label = label.slice(0, -1);
  }
  if (label !== fullLabel) label = `${label.slice(0, -1)}…`;

  document.body.appendChild(preview);
  const transparentDragImage = document.createElement('canvas');
  transparentDragImage.width = 1;
  transparentDragImage.height = 1;
  event.dataTransfer.setDragImage(transparentDragImage, 0, 0);

  const startedAt = performance.now();
  let animationFrame = 0;
  let disposed = false;
  const render = (now: number) => {
    if (disposed) return;
    const elapsed = (now - startedAt) / 1000;
    ctx.clearRect(0, 0, width, height);

    // Wide translucent light fields make the fire illuminate the timeline
    // beneath it instead of reading as an effect clipped to the tile.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.84 + Math.sin(elapsed * 4.5) * 0.16;
    const ambient = ctx.createRadialGradient(
      width / 2,
      blockTop - 15,
      2,
      width / 2,
      blockTop - 15,
      95,
    );
    ambient.addColorStop(0, `rgba(255, 228, 94, ${0.34 * pulse})`);
    ambient.addColorStop(0.2, `rgba(255, 92, 0, ${0.3 * pulse})`);
    ambient.addColorStop(0.55, `rgba(244, 31, 0, ${0.15 * pulse})`);
    ambient.addColorStop(1, 'rgba(105, 0, 255, 0)');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, width, height);

    const hotCore = ctx.createRadialGradient(
      width / 2,
      blockTop,
      0,
      width / 2,
      blockTop,
      70,
    );
    hotCore.addColorStop(0, `rgba(255, 255, 206, ${0.4 * pulse})`);
    hotCore.addColorStop(0.3, `rgba(255, 177, 31, ${0.25 * pulse})`);
    hotCore.addColorStop(1, 'rgba(255, 55, 0, 0)');
    ctx.fillStyle = hotCore;
    ctx.fillRect(blockLeft - 70, blockTop - 70, blockWidth + 140, 140);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = 'rgba(255, 73, 0, 1)';
    ctx.shadowBlur = 21;

    tongues.forEach(tongue => {
      const wave = Math.sin(elapsed * tongue.speed + tongue.phase);
      const flicker = 0.83 + Math.sin(elapsed * tongue.speed * 1.7 + tongue.phase) * 0.17;
      const tongueHeight = tongue.height * flicker;
      const lean = tongue.lean + wave * 7;
      const gradient = ctx.createLinearGradient(
        tongue.x,
        blockTop,
        tongue.x + lean,
        blockTop - tongueHeight,
      );
      gradient.addColorStop(0, 'rgba(255, 238, 125, 0.98)');
      gradient.addColorStop(0.28, 'rgba(255, 133, 18, 0.92)');
      gradient.addColorStop(0.68, 'rgba(255, 34, 0, 0.62)');
      gradient.addColorStop(1, 'rgba(126, 0, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(tongue.x - tongue.width / 2, blockTop + 1);
      ctx.bezierCurveTo(
        tongue.x - tongue.width * 0.45 + wave * 2,
        blockTop - tongueHeight * 0.34,
        tongue.x + lean - tongue.width * 0.08,
        blockTop - tongueHeight * 0.72,
        tongue.x + lean,
        blockTop - tongueHeight,
      );
      ctx.bezierCurveTo(
        tongue.x + lean + tongue.width * 0.25,
        blockTop - tongueHeight * 0.62,
        tongue.x + tongue.width * 0.48 - wave * 2,
        blockTop - tongueHeight * 0.3,
        tongue.x + tongue.width / 2,
        blockTop + 1,
      );
      ctx.closePath();
      ctx.fill();
    });

    ctx.shadowBlur = 7;
    embers.forEach(ember => {
      const rise = (ember.rise + elapsed * ember.speed) % 62;
      const x = ember.x + Math.sin(elapsed * 3 + ember.phase) * 4;
      ctx.globalAlpha = Math.max(0, 1 - rise / 62);
      ctx.fillStyle = ember.hot ? '#ffe08a' : '#ff4d00';
      ctx.beginPath();
      ctx.arc(x, blockTop - rise, ember.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(255, 72, 0, 1)';
    ctx.shadowBlur = 22 + Math.sin(elapsed * 7) * 6;
    ctx.fillStyle = fill;
    ctx.fillRect(blockLeft, blockTop, blockWidth, 20);
    ctx.restore();
    ctx.fillStyle = fill;
    ctx.fillRect(blockLeft, blockTop, blockWidth, 20);
    ctx.fillStyle = text;
    ctx.font = '11px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, blockLeft + 5, blockTop + 10);
    animationFrame = requestAnimationFrame(render);
  };

  const move = (dragEvent: DragEvent) => {
    if (dragEvent.clientX === 0 && dragEvent.clientY === 0) return;
    preview.style.left = `${dragEvent.clientX - blockLeft - 18}px`;
    preview.style.top = `${dragEvent.clientY - blockTop - 8}px`;
  };
  const source = event.currentTarget;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(animationFrame);
    preview.remove();
    document.removeEventListener('dragover', move);
    source.removeEventListener('drag', move);
    source.removeEventListener('dragend', cleanup);
    document.removeEventListener('drop', cleanup);
  };

  document.addEventListener('dragover', move);
  source.addEventListener('drag', move);
  source.addEventListener('dragend', cleanup, { once: true });
  document.addEventListener('drop', cleanup, { once: true });
  animationFrame = requestAnimationFrame(render);
}

function parseWeight(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function WeightField({
  activityId,
  updateActivity,
}: {
  activityId: EntityId;
  updateActivity?: Props['updateActivity'];
}) {
  const [draft, setDraft] = React.useState('');
  if (!updateActivity) return null;

  const commit = () => {
    const weight = parseWeight(draft);
    if (weight == null) return;
    updateActivity(activityId, { weight });
    setDraft('');
  };

  return (
    <input
      type="number"
      min={1}
      step={1}
      inputMode="decimal"
      placeholder="🏋️"
      title="Set weight to place in the hex field"
      value={draft}
      onChange={event => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
      }}
      style={{
        width: 44,
        flex: 'none',
        padding: '2px 4px',
        border: `1px solid ${BORDER}`,
        borderRadius: 3,
        background: SURFACE,
        color: TEXT,
        fontSize: 11,
      }}
    />
  );
}

function LimboPane({
  activities,
  beginActivity,
  categories,
  collapsed = false,
  deleteActivity,
  focusActivity,
  onToggleCollapsed,
  planInLimbo,
  threads = {},
  updateActivity,
}: Props) {
  const [draftName, setDraftName] = React.useState('');
  const [composingNew, setComposingNew] = React.useState(false);
  const items = limboItems(activities);
  const weighted = items.filter(item => item.weighted);
  const plain = items.filter(item => !item.weighted);
  const placed = hexPlacements(weighted, 0, 0);
  const threadFor = (activity: ProcessedActivity): Thread | undefined => {
    const threadId = activity.thread?.id ?? activity.thread_id;
    if (threadId === undefined) return activity.thread;
    return threads[String(threadId)] ?? activity.thread;
  };
  const bounds = placed.reduce(
    (box, hex) => ({
      minX: Math.min(box.minX, hex.x - hexHalfWidth(hex.radius)),
      minY: Math.min(box.minY, hex.y - hex.radius),
      maxX: Math.max(box.maxX, hex.x + hexHalfWidth(hex.radius)),
      maxY: Math.max(box.maxY, hex.y + hex.radius),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
  const fieldWidth = placed.length > 0 ? bounds.maxX - bounds.minX + PADDING * 2 : 0;
  const fieldHeight = placed.length > 0 ? bounds.maxY - bounds.minY + PADDING * 2 : 0;

  const submitNew = () => {
    const name = draftName.trim();
    if (!name || !planInLimbo) return;
    planInLimbo(name);
    setDraftName('');
    setComposingNew(false);
  };

  if (collapsed) {
    return (
      <div
        aria-label="Limbo"
        data-native-scroll="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: LIMBO_COLLAPSED_HEIGHT,
          flex: 'none',
          padding: '0 12px',
          borderTop: `1px solid ${BORDER}`,
          background: BACKGROUND,
          color: TEXT,
          fontFamily: 'sans-serif',
        }}
      >
        <button
          type="button"
          title="Expand limbo"
          aria-expanded={false}
          onClick={() => onToggleCollapsed?.()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flex: 1,
            minWidth: 0,
            height: '100%',
            margin: 0,
            padding: 0,
            border: 0,
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            font: 'inherit',
            textAlign: 'left',
          }}
        >
          <strong style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Limbo
          </strong>
          {items.length > 0 && (
            <span style={{ fontSize: 11, color: MUTED }}>
              {weighted.length} weighted · {plain.length} unweighted
            </span>
          )}
          {items.length === 0 && (
            <span style={{ fontSize: 11, color: MUTED }}>Empty</span>
          )}
          <span aria-hidden style={{ marginLeft: 'auto', fontSize: 11, color: MUTED }}>▲</span>
        </button>
        {planInLimbo && (
          composingNew ? (
            <input
              autoFocus
              value={draftName}
              placeholder="Name the idea…"
              aria-label="New limbo activity name"
              onChange={event => setDraftName(event.target.value)}
              onBlur={() => {
                if (!draftName.trim()) setComposingNew(false);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitNew();
                }
                if (event.key === 'Escape') {
                  setDraftName('');
                  setComposingNew(false);
                }
              }}
              style={{
                width: 160,
                flex: 'none',
                padding: '3px 8px',
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
                background: SURFACE,
                color: TEXT,
                fontSize: 12,
              }}
            />
          ) : (
            <button
              type="button"
              title="Add an untimed idea to limbo"
              aria-label="New limbo activity"
              onClick={() => setComposingNew(true)}
              style={{
                flex: 'none',
                padding: '2px 8px',
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
                background: SURFACE,
                color: TEXT,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              New
            </button>
          )
        )}
      </div>
    );
  }

  return (
    <LimboLayout
      aria-label="Limbo"
      data-native-scroll="true"
    >
      <LimboField
        role="img"
        aria-label="Limbo hex field"
      >
        {placed.length > 0 && (
          <div
            style={{
              position: 'relative',
              flex: 'none',
              margin: 'auto',
              width: fieldWidth,
              height: fieldHeight,
            }}
          >
            {placed.map(hex => {
              const item = weighted.find(entry => String(entry.activity.id) === hex.id);
              if (!item) return null;
              const { activity } = item;
              const halfWidth = hexHalfWidth(hex.radius);
              const { fill, text } = swatch(activity, categories);
              const thread = threadFor(activity);
              const emoji = threadEmojiLabel(thread?.name);
              return (
                <div
                  key={hex.id}
                  role="button"
                  tabIndex={0}
                  title={`${activity.name ?? ''} (${statusLabel(activity)}, weight ${activity.weight}${thread?.name ? `, ${thread.name}` : ''})`}
                  draggable
                  onDragStart={event => {
                    event.dataTransfer.setData('text/flambe-activity', String(activity.id));
                    event.dataTransfer.effectAllowed = 'move';
                    setActivityDragPreview(event, activity, categories);
                  }}
                  onClick={() => focusActivity(activity.id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      focusActivity(activity.id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: hex.x - halfWidth - bounds.minX + PADDING,
                    top: hex.y - hex.radius - bounds.minY + PADDING,
                    width: halfWidth * 2,
                    height: hex.radius * 2,
                    padding: `${hex.radius * 0.5}px ${halfWidth * 0.18}px`,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    clipPath: HEX_CLIP,
                    background: fill,
                    color: text,
                    border: 'none',
                    cursor: 'grab',
                    fontSize: Math.max(10, Math.min(13, hex.radius / 4)),
                    lineHeight: 1.15,
                    fontStyle: activity.status === 'suspended' ? 'italic' : 'normal',
                    userSelect: 'none',
                  }}
                >
                  {emoji && (
                    <span
                      aria-hidden
                      style={{
                        flex: 'none',
                        fontSize: Math.max(12, Math.min(18, hex.radius / 3)),
                        fontStyle: 'normal',
                        lineHeight: 1,
                      }}
                    >
                      {emoji}
                    </span>
                  )}
                  <span
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: emoji ? 2 : 3,
                      overflow: 'hidden',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {activity.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {items.length === 0 && <p style={{ margin: 'auto', color: MUTED }}>Limbo is empty.</p>}
        {items.length > 0 && placed.length === 0 && (
          <p style={{ margin: 'auto', color: MUTED, fontSize: 12 }}>
            Set a weight on the list to grow the hex field.
          </p>
        )}
      </LimboField>
      {(plain.length > 0 || planInLimbo || onToggleCollapsed) && (
        <LimboSidebar>
          {(planInLimbo || onToggleCollapsed) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 6,
                padding: '6px 8px',
                borderBottom: plain.length > 0 ? `1px solid ${BORDER}` : undefined,
                flex: 'none',
              }}
            >
              {planInLimbo && (
                composingNew ? (
                  <input
                    autoFocus
                    value={draftName}
                    placeholder="Name the idea…"
                    aria-label="New limbo activity name"
                    onChange={event => setDraftName(event.target.value)}
                    onBlur={() => {
                      if (!draftName.trim()) setComposingNew(false);
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        submitNew();
                      }
                      if (event.key === 'Escape') {
                        setDraftName('');
                        setComposingNew(false);
                      }
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '3px 8px',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 4,
                      background: SURFACE,
                      color: TEXT,
                      fontSize: 12,
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    title="Add an untimed idea to limbo"
                    aria-label="New limbo activity"
                    onClick={() => setComposingNew(true)}
                    style={{
                      padding: '2px 8px',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 4,
                      background: BACKGROUND,
                      color: TEXT,
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    New
                  </button>
                )
              )}
              {onToggleCollapsed && (
                <button
                  type="button"
                  title="Collapse limbo"
                  aria-expanded
                  aria-label="Collapse limbo"
                  onClick={() => onToggleCollapsed()}
                  style={{
                    padding: '2px 6px',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 4,
                    background: BACKGROUND,
                    color: MUTED,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  ▼
                </button>
              )}
            </div>
          )}
          {plain.length > 0 && (
            <ul
              style={{
                margin: 0,
                padding: 8,
                listStyle: 'none',
                overflow: 'auto',
                flex: 1,
                minHeight: 0,
              }}
            >
              {plain.map(({ activity }) => {
                const { fill } = swatch(activity, categories);
                return (
                  <li key={String(activity.id)} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                    <div
                      role="button"
                      tabIndex={0}
                      title={`${activity.name ?? ''} (${statusLabel(activity)})`}
                      draggable
                      onDragStart={event => {
                        event.dataTransfer.setData('text/flambe-activity', String(activity.id));
                        event.dataTransfer.effectAllowed = 'move';
                        setActivityDragPreview(event, activity, categories);
                      }}
                      onClick={() => focusActivity(activity.id)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          focusActivity(activity.id);
                        }
                      }}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'left',
                        borderLeft: `6px solid ${fill}`,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontStyle: activity.status === 'suspended' ? 'italic' : 'normal',
                        background: 'transparent',
                        color: 'inherit',
                        cursor: 'grab',
                        padding: '4px 6px',
                        userSelect: 'none',
                      }}
                    >
                      {activity.name}
                    </div>
                    <WeightField activityId={activity.id} updateActivity={updateActivity} />
                    {activity.status === 'unstarted' && activity.thread_id !== undefined && (
                      <>
                        <button type="button" onClick={() => beginActivity(activity.id)}>Begin</button>
                        <button type="button" onClick={() => deleteActivity(activity.id, activity.thread_id!)}>
                          Give up
                        </button>
                      </>
                    )}
                    {activity.status === 'suspended' && (
                      <button type="button" onClick={() => focusActivity(activity.id)}>View</button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </LimboSidebar>
      )}
    </LimboLayout>
  );
}

export default React.memo(LimboPane);
