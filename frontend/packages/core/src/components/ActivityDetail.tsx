import * as React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import {
  updateActivity,
  showCategoryManager,
  ACTIVITY_DETAILS_SHOW,
} from '../actions';
import { getUser, type UserState } from '../reducers/user';
import { getTimeline, type TimelineState } from '../reducers/timeline';
import { blocksForActivity } from '../utilities/timeline';
// types
import type { Category as CategoryType } from '../types/Category';
import type { Agent } from '../types/Agent';
import type { EntityId } from '../types/ids';
import type { TraceEvent } from '../types/TraceEvent';
import type { Thread } from '../types/Thread';
import type { ProcessedActivity, TraceBlock } from '../utilities/processTrace';
import { activityCommandsByStatus, type Command } from '../constants/commands';
import { actorName } from '../utilities/actorFlames';
import { activityAgentChoices } from '../utilities/activityAgents';

import ActivityEventFlow from './ActivityEventFlow';
import CategoryChip from './CategoryChip';
import Button, { InputFromButton } from './Button';
import Fuzzy from './Fuzzy';
import AppModal from './AppModal';
import { openCategorySettingsWindow } from '../utilities/openCategorySettingsWindow';

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

const Field = styled.div`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 6px 12px;
  align-items: start;
  margin: 10px 0;
  font-size: 13px;
`;

const FieldLabel = styled.div`
  color: #666;
  padding-top: 4px;
`;

const FieldBody = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
`;

const ChipList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const ManageRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;

  button,
  a {
    appearance: none;
    border: 0;
    background: none;
    padding: 0;
    color: #2a6f97;
    cursor: pointer;
    text-decoration: underline;
    font: inherit;
  }
`;

const AssignBox = styled.div`
  position: relative;
  overflow: visible;

  input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 13px;
  }
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
  agents: Agent[];
  blocks: TraceBlock[];
  categories: CategoryType[];
  showCategoryManager: () => unknown;
  events: TraceEvent[];
  submitCommand: (command: Command & { activity_id: EntityId; message?: string; thread_id: EntityId }) => unknown;
  threads: Record<string, Thread>;
  updateActivity: (id: EntityId, updates: Record<string, unknown>) => unknown;
}

const ActivityDetail = (props: ActivityDetailProps) => {
  const {
    activities,
    activity_id,
    agents,
    blocks,
    updateActivity,
    categories,
    showCategoryManager,
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

  const assignedCategoryIds = activity.categories ?? [];

  const assignCategory = (category_id: EntityId) => {
    if (assignedCategoryIds.some(id => String(id) === String(category_id))) return;
    updateActivity(activity_id, {
      category_ids: [...assignedCategoryIds, category_id],
    });
  };

  const unassignCategory = (category_id: EntityId) => {
    updateActivity(activity_id, {
      category_ids: assignedCategoryIds.filter(id => String(id) !== String(category_id)),
    });
  };

  const unassignedCategories = categories.filter(
    cat => !assignedCategoryIds.some(id => String(id) === String(cat.id)),
  );

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
  const agentChoices = activityAgentChoices(activity, agents, activities);

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
      <Field>
        <FieldLabel>Thread</FieldLabel>
        <FieldBody>
          <div>{currentThread?.name ?? threadId}</div>
          {threadChoices.length > 0 && (
            <AssignBox>
              <Fuzzy
                itemStringKey="name"
                onChange={moveToThread}
                placeholder="Move to thread…"
                items={threadChoices}
              />
            </AssignBox>
          )}
        </FieldBody>
      </Field>
      <Field>
        <FieldLabel>Agent</FieldLabel>
        <FieldBody>
          <div>{actorName(activity)}</div>
          {agentChoices.length > 0 && (
            <AssignBox>
              <Fuzzy
                itemStringKey="name"
                onChange={choice => {
                  updateActivity(activity.id, {
                    agent_id: choice.id,
                    agent_name: choice.id ? choice.name : null,
                  });
                }}
                placeholder="Assign an agent…"
                items={agentChoices}
              />
            </AssignBox>
          )}
        </FieldBody>
      </Field>
      <Field>
        <FieldLabel>Weight</FieldLabel>
        <FieldBody>
          <InputFromButton
            placeholder={'🏋'}
            submit={(value: string) => {
              updateActivity(activity.id, { weight: Number(value) });
            }}
          >
            {activity.weight || '🏋'}
          </InputFromButton>
        </FieldBody>
      </Field>
      <Field>
        <FieldLabel>Categories</FieldLabel>
        <FieldBody>
          <ChipList>
            {assignedCategoryIds.map(category_id => {
              const category = categories.find(cat => String(cat.id) === String(category_id));
              if (!category) return null;
              return (
                <li key={String(category.id)}>
                  <CategoryChip category={category} onRemove={unassignCategory} />
                </li>
              );
            })}
          </ChipList>
          {unassignedCategories.length > 0 && (
            <AssignBox>
              <Fuzzy
                itemStringKey="name"
                onChange={item => assignCategory(item.id)}
                placeholder="Assign a category…"
                items={unassignedCategories.map(cat => ({
                  ...cat,
                  label: {
                    background: cat.color_background,
                    copy: ' ',
                  },
                }))}
              />
            </AssignBox>
          )}
          <ManageRow>
            <button type="button" onClick={showCategoryManager}>
              Edit categories
            </button>
            <button type="button" onClick={openCategorySettingsWindow}>
              Edit in new window
            </button>
          </ManageRow>
        </FieldBody>
      </Field>
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
    agents: getUser(state).agents ?? [],
    categories: getUser(state).categories,
    events: getTimeline(state).events,
    threads: getTimeline(state).threads,
  }),
  dispatch => ({
    showCategoryManager: () => dispatch(showCategoryManager()),
    updateActivity: (id: EntityId, updates: Record<string, unknown>) => dispatch(updateActivity(id, updates)),
  }),
)(ActivityDetail);
