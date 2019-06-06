import * as React from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { identity, difference, flatMap, filter, map } from 'lodash/fp';

import {
  deleteActivity,
  endActivity,
  updateActivity,
  createCategory,
  updateCategory,
  hideActivityDetailModal,
  ACTIVITY_DETAILS_SHOW,
} from '../actions';
import { getUser } from '../reducers/user';
import { getTimeline } from '../reducers/timeline';
import { blocksForActivity } from '../utilities/timeline';
import containsGithubLink from '../utilities/containsGithubLink';
// types
import type { Activity } from '../types/Activity';
import type { Category as CategoryType } from '../types/Category';
import { activityCommandsByStatus } from '../constants/commands';

import Category from './Category';
import ActivityEventFlow from './ActivityEventFlow';
import AddCategory from './AddCategory';
import DeleteButton from './DeleteButton';
import Grid from './Grid';
import Button, { InputFromButton } from './Button';
import GithubMark from '../images/GitHub-Mark.svg';

const P = styled.p`
  margin: 0;
`;

const GithubAnchor = styled.a`
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
`;

const Actions = styled.div`
  display: flex;

  & > button {
    margin: 0 5px;
  }
`;

type Props = {
  activity: Activity,
  categories: CategoryType[],
  updateActivity: (id: string, {}) => mixed,
  endActivity: (
    activity_id: number,
    timestamp: number,
    message: string,
  ) => mixed,
  DeleteButton: ({ variables: {} }) => mixed,
  deleteActivity: (id, thread_id) => mixed,
  deleteEvent: ({ variables: {} }) => mixed,
  createCategory: () => mixed,
  addCategory: ({ variables: {} }) => mixed,
  updateCategory: ({ name?: string, color?: string }) => mixed,
  updateName: ({ variables: { name: string } }) => mixed,
};

const ActivityDetail = props => {
  const addNewCategory = (name, hexString) => {
    props.createCategory({
      activity_id: props.activity_id,
      name,
      color_background: hexString,
    });
  };

  const addExistingCategory = (category_id: string) => {
    props.updateActivity(props.activity_id, {
      category_ids: [category_id],
    });
  };

  const {
    activities,
    activity_id,
    blocks,
    updateActivity,
    endActivity,
    deleteActivity,
    updateCategory,
    categories,
    submitCommand,
  } = props;

  const activity = activity_id && {
    ...activities[activity_id],
    id: activity_id,
  };

  if (!activity) return <div>no activity</div>;

  const activityBlocks = blocksForActivity(activity_id, blocks);

  // for example, an activity that is resolved after being suspended without
  // ever being resumed. It happens.
  const additionalEventsNotIncludedInBlocks =
    activityBlocks
    |> flatMap(({ events }) => events)
    |> filter(identity)
    |> difference(activity.events)
    |> map(event_id => props.events.find(({ id }) => id === event_id));

  /* ⚠️ I'm currently assuming these will only be resolve/reject events, which may not hold true */
  const falseBlocks = additionalEventsNotIncludedInBlocks.map(e => ({
    endMessage: e.message,
    endTime: e.timestamp,
    ending: e.phase,
  }));

  const githubLink = containsGithubLink(activity.name || '');

  return (
    <>
      {githubLink && (
        <GithubAnchor
          target="_blnk"
          href={`https://github.com/elasticsuite/${githubLink[2]}/issues/${
            githubLink[3]
          }`}
        >
          <img height="16px" src={GithubMark} alt="Open in Github" />
        </GithubAnchor>
      )}
      <InputFromButton
        placeholderIsDefaultValue
        submit={(value: string) => {
          updateActivity(activity.id, {
            name: value,
            thread_id: activity.thread_id,
          });
        }}
      >
        {activity.name}
      </InputFromButton>
      {/* abstract out the delete functionality */}
      <DeleteButton
        onConfirm={() => {
          deleteActivity(activity.id, activity.thread_id);
        }}
        contentLabel="Delete Activity?"
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
              thread_id: activity.thread_id,
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
              const category =
                categories.find(cat => cat.id === category_id) || {};
              return (
                /* ⚠️ FIX THIS */
                <li key={category.id + Math.random()}>
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
              thread_id: activity.thread_id,
            }); 
          }}
        >
          {activity.description || 'Add notes in here (you can type in `whoa`'}
        </InputFromButton>
      </div>
      <ActivityEventFlow activityBlocks={[...activityBlocks, ...falseBlocks]} />
      <Actions>
        {activityCommandsByStatus(activity.status)
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
                      thread_id: activity.thread_id,
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
                      thread_id: activity.thread_id,
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
  state => ({
    activity_id: getTimeline(state).focusedBlockActivity_id,
    categories: getUser(state).categories,
    events: getTimeline(state).events,
  }),
  dispatch => ({
    createCategory: ({ activity_id, name, color_background }) =>
      dispatch(createCategory({ activity_id, name, color_background })),
    updateCategory: (id, updates) => dispatch(updateCategory(id, updates)),
    updateActivity: (id, updates) => dispatch(updateActivity(id, updates)),
    deleteActivity: (id, thread_id) => dispatch(deleteActivity(id, thread_id)),
    endActivity: ({ id, timestamp, message, thread_id, eventFlavor = 'E' }) =>
      dispatch(
        endActivity({
          id,
          timestamp,
          message,
          thread_id,
          eventFlavor,
        }),
      ),
  }),
)(ActivityDetail);
