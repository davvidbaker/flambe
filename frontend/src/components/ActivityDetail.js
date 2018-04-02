// @flow

import React from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
// flow-ignore
import { connect } from 'react-redux';

import Category, { AddCategory } from 'components/Category';
import DeleteButton from 'components/DeleteButton';
import Grid from 'components/Grid';
import { InputFromButton } from 'components/Button';
import {
  deleteActivity,
  endActivity,
  updateActivity,
  createCategory,
  updateCategory,
  hideActivityDetails
} from 'actions';
import { getUser } from 'reducers/user';

import type { Activity } from 'types/Activity';
import type { Category as CategoryType } from 'types/Category';

const P = styled.p`
  margin: 0;
`;

function mapToGrid(obj, { columns }) {
  return (
    <Grid columns={columns}>
      {Object.entries(obj).map(([key, val]) => [
        <P key={`key-${key}`}>{key}</P>,
        <div key={`val-${key}`}>
          {val !== null && typeof val === 'object' ? (
            mapToGrid(val, { columns: '1fr 3fr' })
          ) : (
            <P>{val}</P>
          )}
        </div>
      ])}
    </Grid>
  );
}

type Props = {
  activity: Activity,
  categories: CategoryType[],
  updateActivity: (id: string, {}) => mixed,
  endActivity: (
    activity_id: number,
    timestamp: number,
    message: string
  ) => mixed,
  hideActivityDetails: () => mixed,
  showActivityDetails: () => mixed,
  DeleteButton: ({ variables: {} }) => mixed,
  deleteActivity: (id, thread_id) => mixed,
  deleteEvent: ({ variables: {} }) => mixed,
  createCategory: () => mixed,
  addCategory: ({ variables: {} }) => mixed,
  updateCategory: ({ name?: string, color?: string }) => mixed,
  updateName: ({ variables: { name: string } }) => mixed,
  threadLevels: { [string]: number }
  // updateThreadLevels: (id: string, inc: number) => mixed,
};

class ActivityDetail extends React.Component<Props> {
  addNewCategory = (name, hexString) => {
    this.props.createCategory({
      activity_id: this.props.activity.id,
      name,
      color: hexString
    });
  };

  addExistingCategory = (category_id: string) => {
    this.props.updateActivity(this.props.activity.id, {
      category_ids: [category_id]
    });
  };

  render() {
    const {
      activity,
      activityBlocks,
      updateActivity,
      endActivity,
      deleteActivity,
      threadLevels,
      updateCategory,
      // updateThreadLevels,
      categories
    } = this.props;

    return (
      <Modal
        isOpen={this.props.activityDetailsVisible}
        onRequestClose={this.props.hideActivityDetails}
      >
        {/* // flow-ignore */}
        <InputFromButton
          placeholderIsDefaultValue
          submit={(value: string) => {
            updateActivity(activity.id, {
              name: value,
              thread_id: activity.thread.id
            });
          }}
        >
          {activity.name}
        </InputFromButton>
        {/* abstract out the delete functionality */}
        <DeleteButton
          onConfirm={() => {
            deleteActivity(activity.id, activity.thread.id);
          }}
          contentLabel="Delete Activity?"
        >
          Delete Activity
        </DeleteButton>

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
        {activity && mapToGrid(activity, { columns: '1fr 3fr' })}
        {/* </StyledDraggable> */}
      </Modal>
    );
  }
}

export default // flow-ignore
connect(
  state => ({
    categories: getUser(state).categories,
    activityDetailsVisible: state.activityDetailsVisible
  }),
  dispatch => ({
    // updateThreadLevels: (id: string, inc: number) =>
    // dispatch(updateThreadLevel(id, inc)),
    createCategory: ({ activity_id, name, color }) =>
      dispatch(createCategory({ activity_id, name, color })),
    hideActivityDetails: () => dispatch(hideActivityDetails()),
    updateCategory: (id, updates) => dispatch(updateCategory(id, updates)),
    updateActivity: (id, updates) => dispatch(updateActivity(id, updates)),
    deleteActivity: (id, thread_id) => dispatch(deleteActivity(id, thread_id)),
    endActivity: ({ id, timestamp, message, thread_id, eventFlavor = 'E' }) =>
      dispatch(endActivity({ id, timestamp, message, thread_id, eventFlavor }))
  })
)(ActivityDetail);
