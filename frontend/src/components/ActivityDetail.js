// @flow

import React from 'react';
import styled from 'styled-components';
// flow-ignore
import { gql, graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';

import Category, { AddCategory } from 'components/Category';
import DeleteButton from 'components/DeleteButton';
import Grid from 'components/Grid';
import { InputFromButton } from 'components/Button';
// import { EndActivity } from 'components/EventForm';
import { /* updateThreadLevel, */ updateActivity, endActivity } from 'actions';

import type { Activity } from 'types/Activity';
import type { Category as CategoryType } from 'types/Category';

const P = styled.p`
margin: 0;
`;

const UpdateName = gql`
  mutation UpdateName($activityId: ID!, $name: String!) {
    updateActivity(id: $activityId, name: $name) {
      id
      name
    }
  }
`;

const CreateCategory = gql`
mutation createCategory($userId: ID!, $name: String!, $color: String!, $activityId: ID!) {
  createCategory(userId: $userId, name: $name, color: $color, activitiesIds: [$activityId]) {
    id
    name
    color
    activities {
      id
    }
  }
}
`;

const AddCategoryToActivity = gql`
mutation AddCategoryToActivity($activityId: ID!, $categoryId: ID!) {
  addToActivitiesCategories(
    activitiesActivityId: $activityId,
    categoriesCategoryId: $categoryId
  ) {
    activitiesActivity {
      id
      name
    }
    categoriesCategory {
      id
      name
    }
  }
}
`;

/** 
 * 💁‍ cascading deletes are not yet available in GraphCool
 * https://github.com/graphcool/graphcool/issues/47 
 * 
 * Instead, I am just making multiple separate mutations. ⚠️ That is probably bad.
 * */
const DeleteActivity = gql`
  mutation DeleteActivity($activityId: ID!) {
    deleteActivity(id: $activityId) {
      id
    }
  }
`;

const DeleteEvent = gql`
  mutation DeleteEvent($eventId: ID!) {
    deleteEvent(id: $eventId) {
      id
    }
  }
`;

// Activity is only closeable if it is on the tip of the icicle.
function isCloseable(activity, threadLevels) {
  if (!activity.thread) {
    console.warn('activity missing thread!', activity);
    return;
  }
  if (activity.level + 1 === threadLevels[activity.thread.id]) {
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
          {typeof val === 'object'
            ? mapToGrid(val, { columns: '1fr 3fr' })
            : <P>{val}</P>}
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
    message: string
  ) => mixed,
  DeleteButton: ({ variables: {} }) => mixed,
  deleteActivity: ({ variables: {} }) => mixed,
  deleteEvent: ({ variables: {} }) => mixed,
  createCategory: ({ variables: {} }) => mixed,
  addCategory: ({ variables: {} }) => mixed,
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
      variables: {
        userId: this.props.userId,
        name,
        color: hexString,
        activityId: this.props.activity.id,
      },
    });
  };

  addExistingCategory = (categoryId: string) => {
    this.props.addCategory({
      variables: {
        activityId: this.props.activity.id,
        categoryId,
      },
    });
  };

  render() {
    const {
      activity,
      updateActivity,
      endActivity,
      deleteActivity,
      deleteEvent,
      updateName,
      threadLevels,
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
            });
          }}
        >
          {activity.name}
        </InputFromButton>
        {!activity.endTime &&
          isCloseable(activity, threadLevels) &&
          <InputFromButton
            ref={endButton => {
              this.endButton = endButton;
            }}
            looksLikeButton
            canBeBlank
            placeholder="why?"
            submit={value => {
              const ts = new Date();
              updateActivity(activity.id, { endTime: ts.getTime() });

              endActivity(activity.id, Date.now(), value, activity.thread.id);
            }}
          >
            End Activity
          </InputFromButton>}

        {/* abstract out the delete functionality */}
        <DeleteButton
          onConfirm={() => {
            activity.events.forEach(id =>
              deleteEvent({ variables: { eventId: id } })
            );

            deleteActivity({
              variables: {
                activityId: activity.id,
              },
            });
          }}
        >
          Delete Activity
        </DeleteButton>

        <div>
          Categories:
          <ul>
            {activity.categories.map(categoryId => {
              const category = categories.find(
                cat => cat.id === categoryId
              ) || {};
              return (
                <li key={category.name}>
                  <Category name={category.name} color={category.color} />
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
        {mapToGrid(activity, { columns: '1fr 3fr' })}
        {/* </StyledDraggable> */}
      </div>
    );
  }
}

const options = props => ({
  variables: {
    activityId: props.activity.id,
    traceId: props.traceId,
  },
});

export default compose(
  // ⚠️ move this elsewhere?
  // graphql(AddCategoryToActivity, {
  //   name: 'addCategory',
  // }),
  // // ⚠️ move this elsewhere?
  // graphql(CreateCategory, {
  //   name: 'createCategory',
  // }),
  // graphql(UpdateName, {
  //   name: 'updateName',
  //   options,
  // }),
  // // graphql(EndActivity, {
  // //   name: 'endActivity',
  // //   options,
  // // }),
  // graphql(DeleteActivity, {
  //   name: 'deleteActivity',
  // }),
  // graphql(DeleteEvent, {
  //   name: 'deleteEvent',
  //   options: props => ({
  //     refetchQueries: ['AllEventsInTrace'],
  //   }),
  // }),
  // flow-ignore
  connect(
    state => ({
      userId: state.user.id,
      categories: state.categories,
    }),
    dispatch => ({
      // updateThreadLevels: (id: string, inc: number) =>
      // dispatch(updateThreadLevel(id, inc)),
      updateActivity: (id, { name }) => dispatch(updateActivity(id, { name })),
      endActivity: (id, timestamp, message, thread_id) =>
        dispatch(endActivity(id, timestamp, message, thread_id)),
    })
  )
)(ActivityDetail);
