import React from 'react';
import styled from 'styled-components';
import day from 'dayjs';

const Div = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: ${({ showTime }) => (showTime ? '75px 1fr' : '1fr')};
  max-width: 100%;
  width: 100%;
  overflow-x: scroll;

  font-size: 11px;
  margin: 0;

  p {
    margin: 0;
  }

  .time-message {
    .type {
      color: #aaa;
    }

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
`;

const copy = {
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

const ActivityEvent = ({
  showTime, eventType, time, message
}) => (
  <Div showTime={showTime} message={message}>
    {showTime && (
      <div className="time-message">
        {/* 🔮 should be moved  */}
        <div className="type">{copy[eventType]}</div>
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
}) => (
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
