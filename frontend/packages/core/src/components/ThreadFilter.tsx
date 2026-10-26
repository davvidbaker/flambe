import React, { useState } from 'react';
import styled from 'styled-components';
import { moveItem } from '../utilities/threadOrder';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';

type FilterThread = Thread & { suspendedActivityCount?: number };

interface Props {
  allThreads?: Record<string, FilterThread>;
  attentionDrivenThreadOrder: boolean;
  filterExcludes: EntityId[];
  onHideChange: (hiddenIds: EntityId[]) => unknown;
  onReorder: (orderedIds: EntityId[]) => unknown;
  onToggleAttentionOrder: () => unknown;
  orderedThreadIds: EntityId[];
}

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 8px;
`;

const BulkActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 0 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid #eee;
`;

const BulkAction = styled.button`
  appearance: none;
  border: 0;
  background: none;
  padding: 2px 0;
  font: inherit;
  font-size: 11px;
  color: #666;
  cursor: pointer;

  &:hover:enabled {
    color: #000;
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid #888;
    outline-offset: 3px;
    border-radius: 2px;
  }

  &:disabled {
    color: #aaa;
    cursor: default;
  }
`;

const Row = styled.li<{ $dimmed: boolean; $dragging: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  opacity: ${props => (props.$dimmed ? 0.45 : 1)};
  background: ${props => (props.$dragging ? '#eee' : 'transparent')};
`;

const Grip = styled.button`
  all: unset;
  cursor: grab;
  color: #888;
  font-size: 12px;
  letter-spacing: -1px;
  padding: 0 2px;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`;

const Name = styled.label`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
`;

const Hint = styled.p`
  margin: 8px 0 0;
  color: #999;
  font-size: 0.8em;
`;

const ThreadFilter = ({
  allThreads = {},
  attentionDrivenThreadOrder,
  filterExcludes,
  onHideChange,
  onReorder,
  onToggleAttentionOrder,
  orderedThreadIds,
}: Props) => {
  const [draggingId, setDraggingId] = useState<EntityId | null>(null);
  const hidden = new Set(filterExcludes.map(String));
  const threadIds = Object.keys(allThreads);
  const visibleCount = threadIds.filter(id => !hidden.has(id)).length;

  const toggleHidden = (id: EntityId, show: boolean) => {
    const next = show
      ? filterExcludes.filter(hiddenId => String(hiddenId) !== String(id))
      : [...filterExcludes, id];
    onHideChange(next);
  };

  const dropOn = (targetId: EntityId) => {
    if (draggingId === null || String(draggingId) === String(targetId)) return;
    const fromIndex = orderedThreadIds.findIndex(id => String(id) === String(draggingId));
    const toIndex = orderedThreadIds.findIndex(id => String(id) === String(targetId));
    onReorder(moveItem(orderedThreadIds, fromIndex, toIndex));
    setDraggingId(null);
  };

  return (
    <div>
      <BulkActions>
        <BulkAction type="button" disabled={visibleCount === threadIds.length} onClick={() => onHideChange([])}>
          Select all
        </BulkAction>
        <BulkAction type="button" disabled={visibleCount === 0} onClick={() => onHideChange(threadIds)}>
          Deselect all
        </BulkAction>
      </BulkActions>
      <List>
        {orderedThreadIds.map(id => {
          const thread = allThreads[String(id)];
          if (!thread) return null;
          const isHidden = hidden.has(String(id));
          return (
            <Row
              key={String(id)}
              $dimmed={isHidden}
              $dragging={String(draggingId) === String(id)}
              draggable
              onDragStart={event => {
                setDraggingId(id);
                event.dataTransfer.setData('text/plain', String(id));
                event.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={event => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={event => {
                event.preventDefault();
                dropOn(id);
              }}
            >
              <Grip
                type="button"
                aria-label={`Reorder ${thread.name}`}
                onClick={event => event.preventDefault()}
              >
                ::
              </Grip>
              <input
                id={`thread-visible-${id}`}
                aria-label={`Show ${thread.name}`}
                checked={!isHidden}
                onChange={event => toggleHidden(id, event.target.checked)}
                type="checkbox"
              />
              <Name htmlFor={`thread-visible-${id}`}>
                {thread.name}
              </Name>
            </Row>
          );
        })}
      </List>
      <label>
        <input
          checked={attentionDrivenThreadOrder}
          onChange={onToggleAttentionOrder}
          type="checkbox"
        />
        {' '}
        Order by recent attention
      </label>
      <Hint>
        Uncheck a thread to hide it. Drag to reorder; that stores a manual order
        and turns off attention-driven sorting.
      </Hint>
    </div>
  );
};

export default ThreadFilter;
