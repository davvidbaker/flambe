import React from 'react';
import ActivityBlockDetails from './ActivityBlockDetails';
import type { EventPhase } from '../types/TraceEvent';

// styled.div`
// `

export interface ActivityBlock {
  beginning?: EventPhase;
  endMessage?: string;
  endTime?: number;
  ending?: EventPhase;
  startMessage?: string;
  startTime?: number;
}

const ActivityEventFlow = ({ activityBlocks }: { activityBlocks: ActivityBlock[] }) => (
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
            key={startTime || endTime}
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
