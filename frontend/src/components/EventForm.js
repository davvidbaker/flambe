// @flow

import React, { Component } from 'react';
// flow-ignore
import { gql, graphql, compose } from 'react-apollo';

import StyledDraggable from 'components/StyledDraggable';

import type { Thread } from 'types/Thread';

type Props = {
  traceId: string,
  threads: (?Thread)[],
  beginActivity: ({ variables: {} }) => mixed,
  endActivity: ({ variables: {} }) => mixed,
};

class EventForm extends Component<Props> {
  name: ?HTMLInputElement;
  description: ?HTMLInputElement;
  form: ?HTMLFormElement;

  submitBeginActivity = e => {
    e.preventDefault();

    if (this.name && this.description && this.props.threads && this.form) {
      const message = '';
      const activityName = this.name.value;
      const activityDescription = this.description.value;

      // only main thread right now
      const mainThreadId = this.props.threads.find(
        thread => thread.name === 'Main'
      ).id;

      const ts = new Date().toISOString();

      this.props.beginActivity({
        variables: {
          timestamp: ts,
          message,
          activityName,
          activityDescription,
          threadId: mainThreadId,
          traceId: this.props.traceId,

          // ⚠️ abstract up
          categoryIds: this.props.lastCategory
            ? [this.props.lastCategory]
            : [],
        },
      });

      if (this.form.reset) {
        this.form.reset();
      }
    }
  };

  render() {
    return (
      <StyledDraggable>
        <form
          ref={form => {
            this.form = form;
          }}
          id="event-form"
          action=""
          method="POST"
        >
          <div className="panel fields-panel">
            <label>
              title <input
                type="text"
                placeholder="title"
                ref={name => {
                  this.name = name;
                }}
              />
            </label>
            <label>
              category
              {' '}
              <input disabled placeholder="cats" type="text" name="cat" />
            </label>
            <label>
              description
              <input
                type="text"
                placeholder="description here"
                ref={description => {
                  this.description = description;
                }}
              />
            </label>
            {/* <label>
            phase
            <select name="ph">
              <option value="B">Begin</option>
              <option value="E">End</option>
            </select>
          </label> */}
            <label>thread <input type="text" name="thread" /></label>
            <button type="submit" onClick={this.submitBeginActivity}>
              SUBMIT
            </button>
          </div>
        </form>
      </StyledDraggable>
    );
  }
}

// mutation returns an event!
export const BeginActivity = gql`
  mutation BeginActivity($timestamp: DateTime!, $traceId: ID! $message: String, $threadId: ID!, $activityName: String!, $activityDescription: String, $categoryIds: [ID!]) {
    createEvent(
      traceId:  $traceId,
      timestamp: $timestamp,
      phase: "B",
      activity: {
        name: $activityName,
        description: $activityDescription,
        threadId: $threadId,
        categoriesIds: $categoryIds
      },
      message: $message
    ) {
      id
      phase
      timestamp
      activity {
        id
        name
        description
        thread {
          name
          id
        }
      }
    }
  }
`;

// mutation returns an event!
export const EndActivity = gql`
  mutation EndActivity($timestamp: DateTime!, $traceId: ID!, $message: String, $activityId: ID!) {
    createEvent(
      timestamp: $timestamp,
      phase: "E",
      activityId: $activityId,
      message: $message,
      traceId: $traceId,
    ) {
      id
    }
  }
`;

export default compose(
  graphql(BeginActivity, {
    name: 'beginActivity',
    options: {
      // not very efficient
      refetchQueries: ['AllEventsInTrace'],
    },
  })
)(EventForm);
