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
import type { ProcessedActivity, TraceBlock } from '../utilities/processTrace';
import { activityCommandsByStatus, type Command } from '../constants/commands';

import Category from './Category';
import ActivityEventFlow from './ActivityEventFlow';
import AddCategory from './AddCategory';
import DeleteButton from './DeleteButton';
import Button, { InputFromButton } from './Button';

const Actions = styled.div`
  display: flex;

  & > button {
    margin: 0 5px;
  }
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
  } = props;

  if (activity_id === null) return <div>no activity</div>;
  const baseActivity = activities[String(activity_id)];
  const activity = baseActivity ? {
    ...baseActivity,
    id: activity_id,
  } : undefined;

  if (!activity) return <div>no activity</div>;
  if (activity.thread_id === undefined) return <div>activity has no thread</div>;
  const threadId = activity.thread_id;

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
          updateActivity(activity.id, {
            name: value,
            thread_id: threadId,
          });
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
      <div>
        Weight:{' '}
        <InputFromButton
          placeholder={'🏋'}
          submit={(value: string) => {
            updateActivity(activity.id, {
              weight: Number(value),
              thread_id: threadId,
            });
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
            updateActivity(activity.id, {
              description: value,
              thread_id: threadId,
            });
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
    </>
  );
};

export default connect(
  (state: { timeline: TimelineState; user: UserState }) => ({
    activity_id: getTimeline(state).focusedBlockActivity_id,
    categories: getUser(state).categories,
    events: getTimeline(state).events,
  }),
  dispatch => ({
    createCategory: ({ activity_id, name, color_background }: { activity_id: EntityId; name: string; color_background: string }) =>
      dispatch(createCategory({ activity_id, name, color_background })),
    updateCategory: (id: EntityId, updates: Record<string, unknown>) => dispatch(updateCategory(id, updates)),
    updateActivity: (id: EntityId, updates: Record<string, unknown>) => dispatch(updateActivity(id, updates)),
    deleteActivity: (id: EntityId, thread_id: EntityId) => dispatch(deleteActivity(id, thread_id)),
  }),
)(ActivityDetail);
