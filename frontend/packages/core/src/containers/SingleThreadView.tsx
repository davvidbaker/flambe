import React, { Component, type ReactNode } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import WaterfallChart from '../components/WaterfallChart';
import { getTimeline } from '../reducers/timeline';
import { getUser } from '../reducers/user';
import type { TimelineState } from '../reducers/timeline';
import type { UserState } from '../reducers/user';
import type { ProcessedActivity, TraceBlock } from '../utilities/processTrace';
import type { Category } from '../types/Category';
import type { Thread } from '../types/Thread';

const Wrapper = styled.div`
  overflow-y: scroll;
`;

interface Props {
  activities: Record<string, ProcessedActivity>;
  blocks: TraceBlock[];
  categories: Category[];
  maxTime?: number;
  minTime?: number;
  thread?: Thread;
}

class SingleThreadView extends Component<Props> {
  render(): ReactNode {
    const {
      thread, activities, blocks, categories
    } = this.props;

    if (!thread) return null;

    const threadActivities = Object.values(activities)
      .filter(({ thread_id }) => String(thread_id) === String(thread.id));
    const activityIds = new Set(threadActivities.map(activity => String(activity.id)));

    const threadBlocks = blocks.filter(block => activityIds.has(String(block.activity_id)));

    const suspendedActivities = threadActivities.filter(({ status }) => status === 'suspended');
    const activitiesById = Object.fromEntries(
      threadActivities.map(activity => [String(activity.id), activity]),
    );
    const blocksByActivity = threadBlocks.reduce<Record<string, TraceBlock[]>>(
      (acc, block) => ({
        ...acc,
        [String(block.activity_id)]: [
          ...(acc[String(block.activity_id)] ?? []),
          block,
        ],
      }),
      {},
    );

    return (
      <Wrapper>
        <h1>{thread.name}</h1>

        <WaterfallChart
          blocksByActivity={blocksByActivity}
          activities={activitiesById}
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

export default connect((state: { timeline: TimelineState; user: UserState }) => ({
  activities: getTimeline(state).activities,
  categories: getUser(state).categories,
  minTime: getTimeline(state).minTime,
  maxTime: getTimeline(state).maxTime,
  blocks: getTimeline(state).blocks
}))(SingleThreadView);
