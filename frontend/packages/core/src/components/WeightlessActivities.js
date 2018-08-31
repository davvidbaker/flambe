import React, { Component } from 'react';

import NumberInput from './NumberInput';

type Props = {
  activities: Activity[],
  updateActivity: () => void,
};

class WeightlessActivities extends Component {
  submitWeight = (activity_id, value) => {
    if (value.length === 0) {
      return;
    }

    const weight = Math.floor(value);
    this.props.updateActivity(activity_id, { weight });
  };

  render() {
    const activities = this.props.activities;
    return (
      <ul>
        {Object.entries(activities).map(([activity_id, activity]) => (
          <li key={activity_id}>
            <NumberInput
              placeholder={'🏋️‍'}
              onSubmit={value => this.submitWeight(activity_id, value)}
              onBlur={e => this.submitWeight(activity_id, e.target.value)}
            />
            {activity.name}
          </li>
        ))}
      </ul>
    );
  }
}

export default WeightlessActivities;
