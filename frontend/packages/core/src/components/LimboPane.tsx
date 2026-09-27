import * as React from 'react';
import tinycolor from 'tinycolor2';
import { hexHalfWidth, hexPlacements, limboItems } from '../utilities/limbo';
import type { ProcessedActivity } from '../utilities/processTrace';
import { readableTextOn } from '../utilities/readableTextOn';
import type { Category } from '../types/Category';
import type { EntityId } from '../types/ids';

interface Props {
  activities: Record<string, ProcessedActivity>;
  beginActivity: (id: EntityId) => unknown;
  categories: Category[];
  deleteActivity: (id: EntityId, threadId: EntityId) => unknown;
  focusActivity: (id: EntityId) => unknown;
}

const BACKGROUND = '#1a1208';
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

export default function LimboPane({
  activities,
  beginActivity,
  categories,
  deleteActivity,
  focusActivity,
}: Props) {
  const items = limboItems(activities);
  const weighted = items.filter(item => item.weighted);
  const plain = items.filter(item => !item.weighted);
  const placed = hexPlacements(weighted, 0, 0);
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

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        background: BACKGROUND,
        color: '#f3e6c8',
        overflow: 'hidden',
      }}
    >
      <div
        role="img"
        aria-label="Limbo"
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
              return (
                <button
                  key={hex.id}
                  type="button"
                  title={`${activity.name ?? ''} (${statusLabel(activity)}, weight ${activity.weight})`}
                  draggable={unstarted}
                  onDragStart={event => {
                    event.dataTransfer.setData('text/flambe-activity', String(activity.id));
                  }}
                  onClick={() => focusActivity(activity.id)}
                  style={{
                    position: 'absolute',
                    left: hex.x - halfWidth - bounds.minX + PADDING,
                    top: hex.y - hex.radius - bounds.minY + PADDING,
                    width: halfWidth * 2,
                    height: hex.radius * 2,
                    padding: `${hex.radius * 0.5}px ${halfWidth * 0.18}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    clipPath: HEX_CLIP,
                    background: fill,
                    color: text,
                    border: 'none',
                    cursor: unstarted ? 'grab' : 'pointer',
                    fontSize: Math.max(10, Math.min(13, hex.radius / 4)),
                    lineHeight: 1.15,
                    fontStyle: unstarted ? 'normal' : 'italic',
                  }}
                >
                  <span
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                      overflow: 'hidden',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {activity.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {items.length === 0 && <p style={{ margin: 'auto' }}>Limbo is empty.</p>}
      </div>
      {plain.length > 0 && (
        <ul style={{ width: 260, margin: 0, padding: 8, listStyle: 'none', overflow: 'auto' }}>
          {plain.map(({ activity }) => {
            const { fill } = swatch(activity, categories);
            return (
              <li key={String(activity.id)} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <button
                  type="button"
                  title={`${activity.name ?? ''} (${statusLabel(activity)})`}
                  draggable={activity.status === 'unstarted'}
                  onDragStart={event => {
                    event.dataTransfer.setData('text/flambe-activity', String(activity.id));
                  }}
                  onClick={() => focusActivity(activity.id)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                    borderLeft: `6px solid ${fill}`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontStyle: activity.status === 'suspended' ? 'italic' : 'normal',
                  }}
                >
                  {activity.name}
                </button>
                {activity.status === 'unstarted' && activity.thread_id !== undefined && (
                  <>
                    <button type="button" onClick={() => beginActivity(activity.id)}>Begin</button>
                    <button type="button" onClick={() => deleteActivity(activity.id, activity.thread_id!)}>
                      Give up
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
