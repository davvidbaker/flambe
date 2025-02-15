import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import filter from 'lodash/fp/filter';
import has from 'lodash/fp/has';

import WaterfallChart from '../components/WaterfallChart';
import { getTimeline } from '../reducers/timeline';
import { getUser } from '../reducers/user';

const Wrapper = styled.div`
  overflow-y: scroll;
`;

class SingleThreadView extends Component {
  render() {
    const {
      thread, activities, blocks, categories
    } = this.props;

    console.log('thread, activities', thread, activities);

    const threadActivities = filter(({ thread_id }) => thread_id === thread.id)(activities);

    const threadBlocks = filter(block =>
      has(block.activity_id)(threadActivities))(blocks);

    const suspendedActivities = filter(({ status }) => status === 'suspended')(threadActivities);

    console.log('threadActivities', threadActivities);
    return (
      <Wrapper>
        <h1>{thread.name}</h1>

        <WaterfallChart
          blocksByActivity={threadBlocks.reduce(
            (acc, block) => ({
              ...acc,
              [block.activity_id]: [...(acc[block.activity_id] || []), block]
            }),
            {}
          )}
          activities={threadActivities}
          categories={categories}
          // TODO this is fucked
          minTime={this.props.minTime}
          maxTime={this.props.maxTime}
        />

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
  activities: getTimeline(state).activities,
  categories: getUser(state).categories,
  minTime: getTimeline(state).minTime,
  maxTime: getTimeline(state).maxTime,
  blocks: getTimeline(state).blocks
}))(SingleThreadView);
