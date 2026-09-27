import React from 'react';
import styled from 'styled-components';
import day from 'dayjs';
import type { EventPhase } from '../types/TraceEvent';
import type { ActivityBlock } from './ActivityEventFlow';
import { timelineActivityFontFamily, timelineActivityFontSizePx } from '../styles';
import { reducerDecisionParts } from '../utilities/reducerActor';

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

  font-size: ${timelineActivityFontSizePx}px;
  font-family: ${timelineActivityFontFamily};

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

      &.reducer-fields {
        flex-wrap: wrap;
        align-items: baseline;
        gap: 6px 12px;
      }

      .part {
        display: inline-flex;
        align-items: baseline;
        gap: 5px;
        white-space: nowrap;
      }

      .part.prose {
        flex: 0 1 100%;
        white-space: normal;
      }

      .key {
        color: #666;
      }

      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.92em;
        background: #f3f1ee;
        border-radius: 3px;
        padding: 0 4px;
      }
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

  .reducer_decision,
  .reducer_incoming,
  .reducer_created {
    background: #8a5a2b;
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
  X: 'Resurrected',
  reducer_created: 'Created',
  reducer_decision: 'Reducer',
  reducer_incoming: 'Message',
};

interface ActivityEventProps {
  eventType?: EventPhase;
  message?: string;
  showTime?: boolean;
  time?: number;
}

const codedKeys = new Set(['model', 'assessment', 'direction', 'rule', 'applied', 'categories', 'thread']);

function formatEventMessage(eventType: EventPhase | undefined, message: string) {
  if (eventType !== 'reducer_decision') return message;

  return reducerDecisionParts(message).map((part, index) => {
    const prose = part.key === 'rationale' || (!part.key && part.value.includes(' '));
    const coded = !prose && (!part.key || codedKeys.has(part.key));
    return (
      <span
        className={prose ? 'part prose' : 'part'}
        key={`${part.key ?? 'text'}-${index}`}
      >
        {part.key ? <span className="key">{part.key}</span> : null}
        {coded ? <code>{part.value}</code> : part.value}
      </span>
    );
  });
}

const ActivityEvent = ({
  showTime, eventType, time, message
}: ActivityEventProps) => {
  if (!eventType && !message) return null;

  return (
    <Div showTime={showTime} message={message}>
      {showTime && (
        <div className="time-message">
          <EventType eventType={eventType}>{eventType ? copy[eventType] : ''}</EventType>
          <div className="time">{day(time).format('YYYY-MM-DD')}</div>
        </div>
      )}
      <div className={`${eventType} message-container`}>
        <div className="timeline-marker" />
        {message ? (
          <div className={eventType === 'reducer_decision' ? 'message reducer-fields' : 'message'}>
            {formatEventMessage(eventType, message)}
          </div>
        ) : null}
      </div>
    </Div>
  );
};

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
