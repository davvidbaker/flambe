import React from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { connect } from 'react-redux';

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

const P = styled.p`
  margin: 0;
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

class ActivityDetail extends React.Component<Props> {
  state = {
    caughtError: null,
  };

  componentDidCatch(e) {
    console.log(`🔥  e`, e);
    this.setState({ caughtError: e });
  }

  addNewCategory = (name, hexString) => {
    this.props.createCategory({
      activity_id: this.props.activity.id,
      name,
      color_background: hexString,
    });
  };

  addExistingCategory = (category_id: string) => {
    this.props.updateActivity(this.props.activity.id, {
      category_ids: [category_id],
    });
  };

  render() {
    const {
      activity,
      activityBlocks,
      updateActivity,
      endActivity,
      deleteActivity,
      updateCategory,
      categories,
      submitCommand,
    } = this.props;

    return this.state.caughtError ? (
      <div>{this.state.caughtError}</div>
    ) : (
      <>
        {/* // flow-ignore */}
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
              addNewCategory={this.addNewCategory}
              addExistingCategory={this.addExistingCategory}
              categories={categories}
            />
          </ul>
        </div>
        <ActivityEventFlow activityBlocks={activityBlocks} />
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
  }
}

export default // flow-ignore
connect(
  state => ({
    categories: getUser(state).categories,
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
