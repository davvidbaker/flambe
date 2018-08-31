// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import fromPairs from 'lodash/fp/fromPairs';
import pipe from 'lodash/fp/pipe';
import map from 'lodash/fp/map';
import filter from 'lodash/fp/filter';

import WeightlessActivities from './WeightlessActivities';
import Limbo from './Limbo';
import { getTimeline } from '../reducers/timeline';
import { getUser } from '../reducers/user';
import { updateActivity } from '../actions';

type Props = {
  activities: Activities,
  events: Events,
  updateActivity: () => void,
};

const Wrapper = styled.div`
  background: white;
  height: 100%;
  display: flex;
  margin-top: 30px;
`;

const ScrollView = styled.div`
  overflow-y: auto;
`;

class LimboContainer extends Component {
  state = {};
  render() {
    const { activities, updateActivity, events } = this.props;
    const weightlessActivities = pipe(
      Object.entries,
      filter(
        ([_id, a]) => a.weight === null || typeof a.weight === 'undefined',
      ),
      fromPairs,
    )(activities);

    const weightedActivities = pipe(
      Object.entries,
      filter(([_id, a]) => a.weight),
      fromPairs,
    )(activities);

    return (
      <Wrapper>
        <Limbo
          activities={weightedActivities}
          events={events}
          categories={this.props.categories}
        />
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
            updateActivity={updateActivity}
          />
        </ScrollView>
      </Wrapper>
    );
  }
}

export default connect(
  state => ({
    activities: pipe(
      Object.entries,
      filter(([_id, a]) => a.status === 'suspended'),
      filter(([_id, a]) => a.thread_id === 1),
      fromPairs,
    )(getTimeline(state).activities),
    events: getTimeline(state).events,
    categories: getUser(state).categories,
  }),
  dispatch => ({
    updateActivity: (activity_id, updates) =>
      dispatch(updateActivity(activity_id, updates)),
  }),
)(LimboContainer);
