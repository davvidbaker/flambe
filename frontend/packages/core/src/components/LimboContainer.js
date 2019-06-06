// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { fromPairs, map, filter, last, size } from 'lodash/fp';

import { useLocalStorage } from '../custom-hooks';
import WeightlessActivities from './WeightlessActivities';
import ActivityDetail from './ActivityDetail';
import Limbo from './Limbo';
import ThreadFilter from './ThreadFilter';
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

const LimboContainer = props => {
  const {
    allSuspendedActivities,
    updateActivity,
    events,
    submitCommand,
    allBlocks,
    allThreads,
  } = props;

  const [selectedActivity_id, setSelectedActivity_id] = React.useState(null);
  const initialThreads = () => {
    try {
      return JSON.parse(window.localStorage.getItem('limbo-threads')) || [];
    } catch {
      return [];
    }
  };
  const [includedThreads, setIncludedThreads] = React.useState(initialThreads);

  React.useEffect(() => {
    window.localStorage.setItem(
      'limbo-threads',
      JSON.stringify(includedThreads),
    );
  }, [includedThreads]);

  const activities =
    allSuspendedActivities
    |> filter(([_id, a]) =>
      includedThreads.map(({ value }) => Number(value)).includes(a.thread_id),
    )
    |> fromPairs;

  const setSelectedActivity = id => {
    setSelectedActivity_id(id);

    const blocks = blocksForActivityWithIndices(id, props.filteredBlocks);

    const [block_id, block] = last(blocks);
    console.log(`🔥  activities`, activities);
    const activity = activities[id];

    props.focusBlock(block_id, id, activity.status, activity.thread_id);
  };

  const weightlessActivities =
    activities
    |> Object.entries
    |> filter(
      ([_id, a]) => a.weight === null || typeof a.weight === 'undefined',
    )
    |> fromPairs;

  const weightedActivities =
    activities |> Object.entries |> filter(([_id, a]) => a.weight) |> fromPairs;

  return (
    <>
      <ThreadFilter
        allThreads={allThreads}
        includedThreads={includedThreads}
        onChange={setIncludedThreads}
      />
      <Wrapper>
        <div style={{ position: 'relative' }}>
          <Limbo
            activities={weightedActivities}
            events={events}
            categories={props.categories}
            setSelectedActivity={setSelectedActivity}
          />
        </div>
        {size(weightlessActivities) > 0 && (
          <ScrollView>
            <WeightlessActivities
              activities={weightlessActivities}
              selectedActivity_id={selectedActivity_id}
              updateActivity={updateActivity}
              setSelectedActivity={setSelectedActivity}
            />
          </ScrollView>
        )}
        {selectedActivity_id && (
          <ScrollView>
            <ActivityDetail
              activity={{
                id: selectedActivity_id,
                ...activities[selectedActivity_id],
              }}
              blocks={allBlocks}
              submitCommand={submitCommand}
              activities={activities}
            />
          </ScrollView>
        )}
      </Wrapper>
    </>
  );
};

export default connect(
  state => ({
    allSuspendedActivities:
      getTimeline(state).activities
      |> Object.entries
      |> filter(([_id, a]) => a.status === 'suspended'),
    events: getTimeline(state).events,
    categories: getUser(state).categories,
    allBlocks: getTimeline(state).blocks,
    allThreads: getTimeline(state).threads,
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
