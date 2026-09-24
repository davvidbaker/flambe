import * as React from 'react';
import { hexPlacements, limboItems } from '../utilities/limbo';
import type { ProcessedActivity } from '../utilities/processTrace';
import type { EntityId } from '../types/ids';

interface Props {
  activities: Record<string, ProcessedActivity>;
  beginActivity: (id: EntityId) => unknown;
  deleteActivity: (id: EntityId, threadId: EntityId) => unknown;
  focusActivity: (id: EntityId) => unknown;
}

export default function LimboPane({
  activities,
  beginActivity,
  deleteActivity,
  focusActivity,
}: Props) {
  const items = limboItems(activities);
  const weighted = items.filter(item => item.weighted);
  const plain = items.filter(item => !item.weighted);
  const placed = hexPlacements(weighted, 0, 0);
  const bounds = placed.reduce(
    (box, hex) => ({
      minX: Math.min(box.minX, hex.x - hex.radius),
      minY: Math.min(box.minY, hex.y - hex.radius),
      maxX: Math.max(box.maxX, hex.x + hex.radius),
      maxY: Math.max(box.maxY, hex.y + hex.radius),
    }),
    { minX: 0, minY: 0, maxX: 80, maxY: 80 },
  );
  const height = Math.max(80, bounds.maxY - bounds.minY + 24);

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        background: '#1a1208',
        color: '#f3e6c8',
        overflow: 'hidden',
      }}
    >
      <div
        role="img"
        aria-label="Limbo"
        style={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
          height,
        }}
      >
        {placed.map(hex => {
          const item = weighted.find(entry => String(entry.activity.id) === hex.id);
          if (!item) return null;
          const unstarted = item.activity.status === 'unstarted';
          return (
            <button
              key={hex.id}
              type="button"
              draggable={unstarted}
              onDragStart={event => {
                event.dataTransfer.setData('text/flambe-activity', String(item.activity.id));
              }}
              onClick={() => focusActivity(item.activity.id)}
              style={{
                position: 'absolute',
                left: hex.x - bounds.minX,
                top: hex.y - bounds.minY,
                width: hex.radius * 2,
                height: hex.radius * 2,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background: unstarted ? '#c47b2b' : '#6e4b2a',
                color: '#1a1208',
                border: 'none',
                cursor: unstarted ? 'grab' : 'pointer',
              }}
            >
              {(item.activity.name ?? '').slice(0, 18)}
            </button>
          );
        })}
      </div>
      <ul style={{ width: 220, margin: 0, padding: 8, listStyle: 'none', overflow: 'auto' }}>
        {plain.map(({ activity }) => (
          <li key={String(activity.id)} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <button
              type="button"
              draggable={activity.status === 'unstarted'}
              onDragStart={event => {
                event.dataTransfer.setData('text/flambe-activity', String(activity.id));
              }}
              onClick={() => focusActivity(activity.id)}
              style={{ flex: 1, textAlign: 'left' }}
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
        ))}
        {items.length === 0 && <li>Limbo is empty.</li>}
      </ul>
    </div>
  );
}
