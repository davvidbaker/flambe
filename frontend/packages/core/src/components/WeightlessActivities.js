import React, { Component } from 'react';
import styled from 'styled-components';

import Unbutton from './Unbutton';
import Arrow90 from './Arrow90';
import NumberInput from './NumberInput';

type Props = {
  activities: Activity[],
  updateActivity: () => void,
  setSelectedActivity: (id: number) => void,
};

const LI = styled.li`
  ${props =>
    props.isSelected
      ? `
background: yellow;
border: 2px solid navajowhite;
`
      : 'border: 2px solid transparent;'};
`;

class WeightlessActivities extends Component {
  submitWeight = (activity_id, value) => {
    if (value.length === 0) {
      return;
    }

    const weight = Math.floor(value);
    this.props.updateActivity(activity_id, { weight });
  };

  render() {
    const { activities, setSelectedActivity, selectedActivity_id } = this.props;
    return (
      <>
        <h3>These activities need to be assigned weights.</h3>
        <p>Please either do that or close them out.</p>
        <ul>
          {Object.entries(activities).map(([activity_id, activity]) => (
            <LI
              key={activity_id}
              style={{ position: 'relative', display: 'flex' }}
              isSelected={Number(activity_id) === selectedActivity_id}
            >
              <NumberInput
                placeholder={'🏋️'}
                onSubmit={value => this.submitWeight(activity_id, value)}
                onBlur={e => this.submitWeight(activity_id, e.target.value)}
              />
              <Unbutton
                onClick={() => setSelectedActivity(Number(activity_id))}
              >
                {Number(activity_id) === selectedActivity_id && (
                  <div
                    style={{
                      pointerEvents: 'none',
                      position: 'absolute',
                      bottom: '96%',
                      right: 0,
                      mixBlendMode: 'multiply',
                    }}
                  >
                    <Arrow90 scale={5} />
                  </div>
                )}
                {activity.name}
              </Unbutton>
            </LI>
          ))}
        </ul>
      </>
    );
  }
}

export default WeightlessActivities;
