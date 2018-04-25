import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import filter from 'lodash/fp/filter';

import { getTimeline } from '../reducers/timeline';

const Wrapper = styled.div`
  overflow-y: scroll;
`;

class SingleThreadView extends Component {
  render() {
    const { thread, activities } = this.props;

    console.log('thread, activities', thread, activities);

    const threadActivities = filter(({ thread: activityThread }) => activityThread.id === thread.id)(activities);

    const suspendedActivities = filter(({ status }) => status === 'suspended')(threadActivities);

    console.log('threadActivities', threadActivities);
    return (
      <Wrapper>
        <h1>{thread.name}</h1>

        <h2>suspended</h2>
        <ul>
          {suspendedActivities.map(act => (
            <li key={`${act.name}_${act.startTime}`}>
              {Object.entries(act).join(' ')}
            </li>
          ))}
        </ul>

        <ul>
          {threadActivities.map(act => (
            <li key={`${act.name}_${act.startTime}`}>{act.name}</li>
          ))}
        </ul>
      </Wrapper>
    );
  }
}

export default connect(state => ({
  activities: getTimeline(state).activities
}))(SingleThreadView);
