import * as React from 'react';
import tinycolor from 'tinycolor2';
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
const PADDING = 12;
const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

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
    <div
      aria-label="Limbo"
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        background: BACKGROUND,
        color: TEXT,
        overflow: 'hidden',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        role="img"
        aria-label="Limbo hex field"
        style={{
          display: 'flex',
          flex: 1,
          minWidth: 0,
          height: '100%',
          overflow: 'auto',
        }}
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
              const unstarted = activity.status === 'unstarted';
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
                  draggable={unstarted}
                  onDragStart={event => {
                    if (!unstarted) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.setData('text/flambe-activity', String(activity.id));
                    event.dataTransfer.effectAllowed = 'move';
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
                    cursor: unstarted ? 'grab' : 'pointer',
                    fontSize: Math.max(10, Math.min(13, hex.radius / 4)),
                    lineHeight: 1.15,
                    fontStyle: unstarted ? 'normal' : 'italic',
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
      </div>
      {(plain.length > 0 || planInLimbo || onToggleCollapsed) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 280,
            flex: 'none',
            borderLeft: `1px solid ${BORDER}`,
            background: SURFACE,
            minHeight: 0,
          }}
        >
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
                      draggable={activity.status === 'unstarted'}
                      onDragStart={event => {
                        if (activity.status !== 'unstarted') {
                          event.preventDefault();
                          return;
                        }
                        event.dataTransfer.setData('text/flambe-activity', String(activity.id));
                        event.dataTransfer.effectAllowed = 'move';
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
                        cursor: activity.status === 'unstarted' ? 'grab' : 'pointer',
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
        </div>
      )}
    </div>
  );
}

export default React.memo(LimboPane);
