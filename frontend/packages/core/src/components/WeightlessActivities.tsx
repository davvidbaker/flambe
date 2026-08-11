import React, { Component, type ReactNode } from 'react';
import styled from 'styled-components';

import Unbutton from './Unbutton';
import Arrow90 from './Arrow90';
import NumberInput from './NumberInput';
import type { Activity } from '../types/Activity';

type Props = {
  activities: Record<string, Activity>;
  updateActivity: (id: string, updates: { weight: number }) => void;
  setSelectedActivity: (id: number) => void;
  selectedActivity_id?: number;
};

const LI = styled.li<{ $isSelected: boolean }>`
  ${props =>
    props.$isSelected
      ? `
background: yellow;
border: 2px solid navajowhite;
`
      : 'border: 2px solid transparent;'};
`;

class WeightlessActivities extends Component<Props> {
  submitWeight = (activity_id: string, value: string): void => {
    if (value.length === 0) {
      return;
    }

    const weight = Math.floor(Number(value));
    this.props.updateActivity(activity_id, { weight });
  };

  render(): ReactNode {
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
              $isSelected={Number(activity_id) === selectedActivity_id}
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
