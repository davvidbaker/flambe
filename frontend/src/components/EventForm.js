// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createActivity } from 'actions';

import StyledDraggable from 'components/StyledDraggable';
import BasicAutocomplete from 'components/BasicAutocomplete';

import type { Thread } from 'types/Thread';

type Props = {
  beginActivity: ({ variables: {} }) => mixed,
  endActivity: ({ variables: {} }) => mixed,
  lastThread_id: number,
  threads: (?Thread)[],
  trace_id: string,
};

type State = {
  selectedThread: ?string,
};

class EventForm extends Component<Props, State> {
  name: ?HTMLInputElement;
  description: ?HTMLInputElement;
  form: ?HTMLFormElement;

  state = {
    threadName: null,
  };

  constructor(props) {
    super(props);

    if (props.lastThread_id) {
      this.state.threadName = this.props.threads.find(
        th => th.id === this.props.lastThread_id,
      ).name;
    }
  }

  /** ⚠️ this is not going to be sufficient! There is a deeper bug that is causing eventForm to re-render all the time! */
  shouldComponentUpdate(nextProps, nextState) {
    // if (nextProps.threads !== this.props.threads)
    return false;
  }

  handleThreadChange = threadName => {
    this.setState({ threadName });
  };

  submitBeginActivity = e => {
    e.preventDefault();

    if (this.name && this.description && this.props.threads && this.form) {
      // const message = '';
      const activityName = this.name.value;
      const activityDescription = this.description.value || '';

      // only main thread right now
      const thread_id = this.props.threads.find(
        thread => thread.name === this.state.threadName,
      ).id;

      this.props.createActivity({
        timestamp: Date.now(),
        // message,
        name: activityName,
        description: activityDescription,
        thread_id,

        // ⚠️ abstract up
        category_id: this.props.lastCategory_id
          ? this.props.lastCategory_id
          : null,
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
              title{' '}
              <input
                type="text"
                placeholder="title"
                ref={name => {
                  this.name = name;
                }}
              />
            </label>
            <label>
              category{' '}
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
            <BasicAutocomplete
              items={this.props.threads.map(th => th.name)}
              label="thread"
              defaultInputValue={this.state.threadName}
              placeholder="thread"
              onChange={this.handleThreadChange}
            />
            <button type="submit" onClick={this.submitBeginActivity}>
              SUBMIT
            </button>
          </div>
        </form>
      </StyledDraggable>
    );
  }
}

export default connect(null, dispatch => ({
  createActivity: ({
    name,
    timestamp,
    description,
    thread_id /* message */,
    category_id,
  }) =>
    dispatch(
      createActivity({ name, timestamp, description, thread_id, category_id }),
    ),
}))(EventForm);
