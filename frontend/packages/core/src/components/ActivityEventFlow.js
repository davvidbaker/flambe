import React from 'react';
import ActivityBlockDetails from './ActivityBlockDetails';

// styled.div`
// `

const ActivityEventFlow = ({ activityBlocks }) => (
  <div>
    {activityBlocks &&
      activityBlocks.map(
        ({
          beginning,
          startMessage,
          endMessage,
          ending,
          startTime,
          endTime,
        }) => (
          <ActivityBlockDetails
            key={startMessage || endMessage || startTime}
            beginning={beginning}
            startMessage={startMessage}
            endMessage={endMessage}
            ending={ending}
            startTime={startTime}
            endTime={endTime}
            showTime
          />
        ),
      )}
  </div>
);

export default ActivityEventFlow;
