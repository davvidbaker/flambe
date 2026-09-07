import * as React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import {
  deleteActivity,
  updateActivity,
  createCategory,
  updateCategory,
  ACTIVITY_DETAILS_SHOW,
} from '../actions';
import { getUser, type UserState } from '../reducers/user';
import { getTimeline, type TimelineState } from '../reducers/timeline';
import { blocksForActivity } from '../utilities/timeline';
// types
import type { Category as CategoryType } from '../types/Category';
import type { EntityId } from '../types/ids';
import type { TraceEvent } from '../types/TraceEvent';
import type { Thread } from '../types/Thread';
import type { ProcessedActivity, TraceBlock } from '../utilities/processTrace';
import { activityCommandsByStatus, type Command } from '../constants/commands';

import Category from './Category';
import ActivityEventFlow from './ActivityEventFlow';
import AddCategory from './AddCategory';
import DeleteButton from './DeleteButton';
import Button, { InputFromButton } from './Button';
import Fuzzy from './Fuzzy';
import AppModal from './AppModal';

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  & > button {
    min-height: 36px;
  }

  @media (max-width: 640px) {
    & > button {
      min-height: 44px;
      flex: 1 1 auto;
    }
  }
`;

const ThreadRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 8px 0;
  flex-wrap: wrap;
`;

const MoveDialog = styled.div`
  min-width: 260px;
  font-size: 12px;

  h2 {
    margin: 0 0 8px;
    font-size: 14px;
  }

  p {
    margin: 0 0 10px;
    color: #555;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0 0 12px;
    max-height: 200px;
    overflow: auto;
  }

  li {
    margin-bottom: 6px;
  }

  label {
    display: flex;
    gap: 8px;
    align-items: baseline;
    cursor: pointer;
  }

  .child-meta {
    color: #888;
    font-size: 0.9em;
  }
`;

const MoveActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export interface ActivityDetailProps {
  activities: Record<string, ProcessedActivity>;
  activity_id: EntityId | null;
  blocks: TraceBlock[];
  categories: CategoryType[];
  createCategory: (input: { activity_id: EntityId; name: string; color_background: string }) => unknown;
  deleteActivity: (id: EntityId, thread_id: EntityId) => unknown;
  events: TraceEvent[];
  submitCommand: (command: Command & { activity_id: EntityId; message?: string; thread_id: EntityId }) => unknown;
  threads: Record<string, Thread>;
  updateActivity: (id: EntityId, updates: Record<string, unknown>) => unknown;
  updateCategory: (id: EntityId, updates: Record<string, unknown>) => unknown;
}

const ActivityDetail = (props: ActivityDetailProps) => {
  const {
    activities,
    activity_id,
    blocks,
    updateActivity,
    deleteActivity,
    updateCategory,
    categories,
    submitCommand,
    threads,
  } = props;

  const [pendingMove, setPendingMove] = React.useState<{
    thread: { id: EntityId; name: string };
    selectedChildIds: EntityId[];
  } | null>(null);

  if (activity_id === null) return <div>no activity</div>;
  const baseActivity = activities[String(activity_id)];
  const activity = baseActivity ? {
    ...baseActivity,
    id: activity_id,
  } : undefined;

  if (!activity) return <div>no activity</div>;
  if (activity.thread_id === undefined) return <div>activity has no thread</div>;
  const threadId = activity.thread_id;
  const currentThread = threads[String(threadId)];
  const threadChoices = Object.values(threads)
    .filter(thread => String(thread.id) !== String(threadId))
    .map(thread => ({ id: thread.id, name: thread.name }));

  const directChildren = Object.values(activities)
    .filter(candidate =>
      candidate.parent_id !== null
      && candidate.parent_id !== undefined
      && String(candidate.parent_id) === String(activity.id)
      && String(candidate.thread_id) === String(threadId))
    .sort((left, right) => Number(left.id) - Number(right.id));

  const addNewCategory = (name: string, hexString: string) => {
    props.createCategory({
      activity_id,
      name,
      color_background: hexString,
    });
  };

  const addExistingCategory = (category_id: EntityId) => {
    props.updateActivity(activity_id, {
      category_ids: [category_id],
    });
  };

  const moveToThread = (thread: { id: EntityId; name: string }) => {
    if (String(thread.id) === String(threadId)) return;
    if (directChildren.length === 0) {
      updateActivity(activity.id, { thread_id: thread.id });
      return;
    }
    setPendingMove({
      thread,
      selectedChildIds: directChildren.map(child => child.id),
    });
  };

  const togglePendingChild = (childId: EntityId) => {
    setPendingMove(current => {
      if (!current) return current;
      const selected = current.selectedChildIds.some(id => String(id) === String(childId));
      return {
        ...current,
        selectedChildIds: selected
          ? current.selectedChildIds.filter(id => String(id) !== String(childId))
          : [...current.selectedChildIds, childId],
      };
    });
  };

  const confirmPendingMove = () => {
    if (!pendingMove) return;
    updateActivity(activity.id, {
      thread_id: pendingMove.thread.id,
      move_child_ids: pendingMove.selectedChildIds,
    });
    setPendingMove(null);
  };

  const activityBlocks = blocksForActivity(activity_id, blocks);

  // for example, an activity that is resolved after being suspended without
  // ever being resumed. It happens.
  const blockEventIds = new Set(activityBlocks.flatMap(({ events }) => events).map(String));
  const additionalEventsNotIncludedInBlocks = activity.events
    .filter(eventId => !blockEventIds.has(String(eventId)))
    .map(eventId => props.events.find(({ id }) => String(id) === String(eventId)))
    .filter((event): event is TraceEvent => event !== undefined);

  /* ⚠️ I'm currently assuming these will only be resolve/reject events, which may not hold true */
  const falseBlocks = additionalEventsNotIncludedInBlocks.map(e => ({
    endMessage: e.message,
    endTime: e.timestamp,
    ending: e.phase,
  }));

  return (
    <>
      <InputFromButton
        placeholderIsDefaultValue
        submit={(value: string) => {
          updateActivity(activity.id, { name: value });
        }}
      >
        {activity.name}
      </InputFromButton>
      {/* abstract out the delete functionality */}
      <DeleteButton
        onConfirm={() => {
          deleteActivity(activity.id, threadId);
        }}
        dialogLabel="Delete Activity?"
        message={activity.name ?? ''}
      >
        Delete Activity
      </DeleteButton>
      <ThreadRow>
        <span>
          Thread:
          {' '}
          {currentThread?.name ?? threadId}
        </span>
        {threadChoices.length > 0 && (
          <Fuzzy
            itemStringKey="name"
            onChange={moveToThread}
            placeholder="Move to thread…"
            items={threadChoices}
          />
        )}
      </ThreadRow>
      <div>
        Weight:{' '}
        <InputFromButton
          placeholder={'🏋'}
          submit={(value: string) => {
            updateActivity(activity.id, { weight: Number(value) });
          }}
        >
          {activity.weight || '🏋'}
        </InputFromButton>
      </div>
      <div>
        Categories:
        <ul>
          {activity.categories &&
            categories &&
            activity.categories.map(category_id => {
              const category = categories.find(cat => String(cat.id) === String(category_id));
              if (!category) return null;
              return (
                <li key={category.id}>
                  <Category
                    id={category.id}
                    name={category.name}
                    color_background={category.color_background}
                    color_text={category.color_text}
                    updateCategory={updateCategory}
                  />
                </li>
              );
            })}
          <AddCategory
            addNewCategory={addNewCategory}
            addExistingCategory={addExistingCategory}
            categories={categories}
          />
        </ul>
      </div>
      <div>
        Description:
        <InputFromButton
          placeholderIsDefaultValue
          submit={(value: string) => {
            updateActivity(activity.id, { description: value });
          }}
        >
          {activity.description || 'Add notes in here (you can type in `whoa`'}
        </InputFromButton>
      </div>
      <ActivityEventFlow activityBlocks={[...activityBlocks, ...falseBlocks]} />
      <Actions>
        {activity.status && activity.status !== 'parent_suspended' && activityCommandsByStatus(activity.status)
          .filter(cmd => cmd.action !== ACTIVITY_DETAILS_SHOW)
          .map(
            cmd =>
              cmd.parameters && cmd.parameters.length > 0 ? (
                /* ⚠️ right now there is only one parameter, so this works find */
                <InputFromButton
                  looksLikeButton
                  canBeBlank
                  submit={(value: string) => {
                    submitCommand({
                      ...cmd,
                      message: value,
                      activity_id: activity.id,
                      thread_id: threadId,
                    });
                  }}
                  placeholder={cmd.parameters[0].placeholder}
                  key={cmd.copy}
                >
                  {cmd.copy}
                </InputFromButton>
              ) : (
                <Button
                  looksLikeButton
                  onClick={() =>
                    submitCommand({
                      ...cmd,
                      activity_id: activity.id,
                      thread_id: threadId,
                    })
                  }
                  key={cmd.copy}
                >
                  {cmd.copy}
                </Button>
              ),
          )}
      </Actions>
      <AppModal
        isOpen={pendingMove !== null}
        onRequestClose={() => setPendingMove(null)}
      >
        {pendingMove && (
          <MoveDialog>
            <h2>Move children too?</h2>
            <p>
              Moving
              {' '}
              <strong>{activity.name}</strong>
              {' '}
              to
              {' '}
              <strong>{pendingMove.thread.name}</strong>
              . Choose which direct children come along (each brings its subtree).
              Unchecked children stay on this thread under the remaining ancestor.
            </p>
            <ul>
              {directChildren.map(child => {
                const checked = pendingMove.selectedChildIds.some(
                  id => String(id) === String(child.id),
                );
                return (
                  <li key={String(child.id)}>
                    <label>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePendingChild(child.id)}
                      />
                      <span>
                        {child.name || '(unnamed)'}
                        <span className="child-meta">
                          {' '}
                          #
                          {child.id}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <MoveActions>
              <Button looksLikeButton onClick={() => setPendingMove(null)}>
                Cancel
              </Button>
              <Button looksLikeButton onClick={confirmPendingMove}>
                Move
              </Button>
            </MoveActions>
          </MoveDialog>
        )}
      </AppModal>
    </>
  );
};

export default connect(
  (state: { timeline: TimelineState; user: UserState }) => ({
    activity_id: getTimeline(state).focusedBlockActivity_id,
    categories: getUser(state).categories,
    events: getTimeline(state).events,
    threads: getTimeline(state).threads,
  }),
  dispatch => ({
    createCategory: ({ activity_id, name, color_background }: { activity_id: EntityId; name: string; color_background: string }) =>
      dispatch(createCategory({ activity_id, name, color_background })),
    updateCategory: (id: EntityId, updates: Record<string, unknown>) => dispatch(updateCategory(id, updates)),
    updateActivity: (id: EntityId, updates: Record<string, unknown>) => dispatch(updateActivity(id, updates)),
    deleteActivity: (id: EntityId, thread_id: EntityId) => dispatch(deleteActivity(id, thread_id)),
  }),
)(ActivityDetail);
