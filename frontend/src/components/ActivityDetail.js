// @flow

import React from 'react';
import styled from 'styled-components';
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
} from 'actions';
import { getUser } from 'reducers/user';

import type { Activity } from 'types/Activity';
import type { Category as CategoryType } from 'types/Category';

const P = styled.p`margin: 0;`;

// Activity (Block) is only endable if it is on the tip of the icicle.
function isEndable(activity, activityBlocks, threadLevels) {
  if (!activity.thread) {
    console.warn('activity missing thread!', activity);
    // debugger;
    return false;
  }
  const lastBlock = activityBlocks[activityBlocks.length - 1];
  if (lastBlock.level + 1 === threadLevels[activity.thread.id].current) {
    return true;
  }
  return false;
}

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
        </div>,
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
    message: string,
  ) => mixed,
  DeleteButton: ({ variables: {} }) => mixed,
  deleteActivity: (id, thread_id) => mixed,
  deleteEvent: ({ variables: {} }) => mixed,
  createCategory: () => mixed,
  addCategory: ({ variables: {} }) => mixed,
  updateCategory: ({ name?: string, color?: string }) => mixed,
  updateName: ({ variables: { name: string } }) => mixed,
  threadLevels: { [string]: number },
  // updateThreadLevels: (id: string, inc: number) => mixed,
};

class ActivityDetail extends React.Component<Props> {
  // ⚠️ potentially bad code ahead. Is this how I should be doing keyboard events? or should they bed higher level? Needs research.
  state = {
    eventListener: null,
  };

  componentDidMount() {
    this.setState({
      // flow-ignore
      eventListener: document.addEventListener('keyup', e => {
        if (this.endButton) {
          // ⚠️ this might not be the bets way to handle this.
          if (e.key === 'e' && e.target.nodeName !== 'INPUT') {
            this.endButton.focus();
          }
        }
      }),
    });
  }

  componentWillUnmount() {
    if (this.state.eventListener) {
      document.removeEventListener('keyup', this.state.eventListener);
    }
  }

  addNewCategory = (name, hexString) => {
    this.props.createCategory({
      activity_id: this.props.activity.id,
      name,
      color: hexString,
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
      threadLevels,
      updateCategory,
      // updateThreadLevels,
      categories,
    } = this.props;

    return (
      <div style={{ position: 'absolute', bottom: 0 }}>
        {/* // flow-ignore */}
        <InputFromButton
          submit={(value: string) => {
            updateActivity(activity.id, {
              name: value,
              thread_id: activity.thread.id,
            });
          }}
        >
          {activity.name}
        </InputFromButton>
        {!activity.endTime &&
          isEndable(activity, activityBlocks, threadLevels) && (
            <InputFromButton
              ref={endButton => {
                this.endButton = endButton;
              }}
              looksLikeButton
              canBeBlank
              placeholder="why?"
              submit={value => {
                endActivity({
                  id: activity.id,
                  timestamp: Date.now(),
                  message: value,
                  thread_id: activity.thread.id,
                });
              }}
            >
              End Activity
            </InputFromButton>
          )}

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
                  <li key={category.id}>
                    <Category
                      id={category.id}
                      name={category.name}
                      color={category.color}
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
      </div>
    );
  }
}

export default // flow-ignore
connect(
  state => ({
    categories: getUser(state).categories,
  }),
  dispatch => ({
    // updateThreadLevels: (id: string, inc: number) =>
    // dispatch(updateThreadLevel(id, inc)),
    createCategory: ({ activity_id, name, color }) =>
      dispatch(createCategory({ activity_id, name, color })),
    updateCategory: (id, updates) => dispatch(updateCategory(id, updates)),
    updateActivity: (id, updates) => dispatch(updateActivity(id, updates)),
    deleteActivity: (id, thread_id) => dispatch(deleteActivity(id, thread_id)),
    endActivity: ({ id, timestamp, message, thread_id }) =>
      dispatch(endActivity({ id, timestamp, message, thread_id })),
  }),
)(ActivityDetail);
