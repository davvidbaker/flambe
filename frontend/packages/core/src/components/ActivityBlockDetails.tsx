import React from 'react';
import styled from 'styled-components';
import day from 'dayjs';
import type { EventPhase } from '../types/TraceEvent';
import type { ActivityBlock } from './ActivityEventFlow';

interface EventStyleProps {
  message?: string;
  showTime?: boolean;
}

const Div = styled.div<EventStyleProps>`
  display: grid;
  align-items: center;
  grid-template-columns: ${({ showTime }) => (showTime ? '90px 1fr' : '1fr')};
  max-width: 100%;
  width: 100%;
  overflow-x: scroll;

  font-size: 11px;
  margin: 0;

  p {
    margin: 0;
  }

  .time-message {
    overflow: hidden;
    overflow-x: visible;

    .time {
      color: #bbb;
      font-size: 0.75em;
    }
  }

  .message-container {
    display: flex;
    width: 100%;
    min-height: 5px;
    height: ${({ message }) => (message ? '100%' : '5px')};

    .message {
      background: white;
      border: 1px solid lightgray;
      border-left: none;
      opacity: 0.9;
      padding: 5px;
    }

    > div {
      display: flex;
      align-items: center;
      &:last-of-type {
        flex-grow: 1;
      }
    }
  }

  .timeline-marker {
    width: 5px;
  }

  .B,
  .R {
    background: grey;
  }

  .V {
    background: mediumseagreen;
  }

  .E {
    background: lightgrey;
  }

  .J {
    background: #d9646a;
  }

  .S {
    background: #6746a3;
  }

  .X {
    background: #2d2d2d;
  }
`;

const EventType = styled.div<{ eventType?: EventPhase }>`
  color: #aaa;
  position: relative;

  ${({ eventType }) =>
    (eventType === 'X'
      ? `
    &::after {
      content: "🧟";
      display: block;
      position: absolute;
      font-size: 2em;
      right: 0;
      top: 0;
    }
`
      : '')};
`;

const copy: Partial<Record<EventPhase, string>> = {
  B: 'Began',
  J: 'Rejected',
  Q: 'Questioned',
  R: 'Resumed',
  S: 'Suspended',
  V: 'Resolved',
  X: 'Resurrected'
};

const NoMessage = styled.div`
  color: white;
  text-align: center;
  justify-content: center;
  width: 100%;
`;

interface ActivityEventProps {
  eventType?: EventPhase;
  message?: string;
  showTime?: boolean;
  time?: number;
}

const ActivityEvent = ({
  showTime, eventType, time, message
}: ActivityEventProps) => (
  <Div showTime={showTime} message={message}>
    {showTime && (
      <div className="time-message">
        {/* 🔮 should be moved  */}
        <EventType eventType={eventType}>{eventType ? copy[eventType] : ''}</EventType>
        {/* 🔮 better formatting */}
        <div className="time">{day(time).format('YYYY-MM-DD')}</div>
      </div>
    )}
    <div className={`${eventType} message-container`}>
      <div className={'timeline-marker'} />
      {message ? <div className="message">{message}</div> : null
      // <NoMessage>
      //   {/* 🔮 should be moved  */}
      //   <span className="type">{copy[eventType]}</span><span style={{padding: '5px'}}>{' • '}</span>
      //   {/* 🔮 better formatting */}
      //   <span className="time">{day(time).format('YYYY-MM-DD')}</span>
      // </NoMessage>
      }
    </div>
  </Div>
);

const Wrapper = styled.div`
  margin-bottom: 10px;
  width: 100%;
`;

const ActivityBlockDetails = ({
  beginning,
  startMessage,
  startTime,
  endMessage,
  endTime,
  ending,
  showTime
}: ActivityBlock & { showTime?: boolean }) => (
  <Wrapper>
    <ActivityEvent
      eventType={beginning}
      time={startTime}
      message={startMessage}
      showTime={showTime}
    />
    <ActivityEvent
      eventType={ending}
      time={endTime}
      message={endMessage}
      showTime={showTime}
    />
  </Wrapper>
);

export default ActivityBlockDetails;
