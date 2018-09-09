// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { fromPairs, map, filter, last } from 'lodash/fp';

import WeightlessActivities from './WeightlessActivities';
import ActivityDetail from './ActivityDetail';
import Limbo from './Limbo';
import {
  getTimeline,
  getTimelineWithFiltersApplied,
} from '../reducers/timeline';
import { getUser } from '../reducers/user';
import { updateActivity, focusBlock } from '../actions';
import {
  blocksForActivity,
  blocksForActivityWithIndices,
} from '../utilities/timeline';

type Props = {
  activities: Activities,
  events: Events,
  updateActivity: () => void,
  submitCommand: () => void,
};

const Wrapper = styled.div`
  background: white;
  overflow-x: auto;
  height: 100%;
  width: 100%;
  display: flex;
  position: absolute;
`;

const ScrollView = styled.div`
  overflow-y: auto;
  /* so hacky */
  max-width: 450px;
  min-width: 400px;
  /* height: 100%; */
`;

class LimboContainer extends Component {
  state = {
    selectedActivity_id: null,
  };

  setSelectedActivity = selectedActivity_id => {
    this.setState({ selectedActivity_id });

    const blocks = blocksForActivityWithIndices(
      selectedActivity_id,
      this.props.filteredBlocks,
    );

    const [block_id, block] = last(blocks);
    const activity = this.props.activities[selectedActivity_id];

    console.log(`🔥  blocks`, blocks);

    console.log(
      `🔥  blocks.map(([k, v]) => this.props.activities[v.activity_id])`,
      blocks.map(([k, v]) => this.props.activities[v.activity_id]),
    );

    console.log(`🔥  activity`, activity);
    this.props.focusBlock(
      block_id,
      selectedActivity_id,
      activity.status,
      activity.thread_id,
    );
  };

  render() {
    const {
      activities,
      updateActivity,
      events,
      submitCommand,
      allBlocks,
    } = this.props;
    const weightlessActivities =
      activities
      |> Object.entries
      |> filter(
        ([_id, a]) => a.weight === null || typeof a.weight === 'undefined',
      )
      |> fromPairs;

    const weightedActivities =
      activities
      |> Object.entries
      |> filter(([_id, a]) => a.weight)
      |> fromPairs;

    return (
      <Wrapper>
        <div style={{ position: 'relative' }}>
          <Limbo
            activities={weightedActivities}
            events={events}
            categories={this.props.categories}
          />
        </div>
        {/* <ScrollView>
          <ul>
            {map(a => (
              <li>
                {a.name} {a.weight}
              </li>
            ))(weightedActivities)}
          </ul>
        </ScrollView> */}
        <ScrollView>
          <WeightlessActivities
            activities={weightlessActivities}
            selectedActivity_id={this.state.selectedActivity_id}
            updateActivity={updateActivity}
            // setSelectedActivity={() => {}}
            setSelectedActivity={this.setSelectedActivity}
          />
        </ScrollView>
        {this.state.selectedActivity_id && (
          <ScrollView>
            <ActivityDetail
              activity={{
                id: this.state.selectedActivity_id,
                ...activities[this.state.selectedActivity_id],
              }}
              activityBlocks={blocksForActivity(
                this.state.selectedActivity_id,
                allBlocks,
              )}
              submitCommand={submitCommand}
            />
          </ScrollView>
        )}
      </Wrapper>
    );
  }
}

export default connect(
  state => ({
    activities:
      getTimeline(state).activities
      |> Object.entries
      |> filter(([_id, a]) => a.status === 'suspended')
      |> filter(([_id, a]) => a.thread_id === 2)
      |> fromPairs,
    events: getTimeline(state).events,
    categories: getUser(state).categories,
    allBlocks: getTimeline(state).blocks,
    filteredBlocks: getTimelineWithFiltersApplied(state).blocks,
  }),
  dispatch => ({
    updateActivity: (activity_id, updates) =>
      dispatch(updateActivity(activity_id, updates)),
    focusBlock: (index, activity_id, activityStatus, thread_id) =>
      dispatch(
        focusBlock({
          index,
          activity_id,
          activityStatus,
          thread_id,
        }),
      ),
  }),
)(LimboContainer);
