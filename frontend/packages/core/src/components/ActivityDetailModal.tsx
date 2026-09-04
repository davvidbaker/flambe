import React from 'react';
import { connect } from 'react-redux';

import ActivityDetail from './ActivityDetail';
import AppModal from './AppModal';
import { hideActivityDetailModal } from '../actions';
import type { ActivityDetailProps } from './ActivityDetail';

interface Props extends Omit<ActivityDetailProps, 'activity_id' | 'categories' | 'createCategory' | 'deleteActivity' | 'events' | 'threads' | 'updateActivity' | 'updateCategory'> {
  activityDetailModalVisible: boolean;
  hideActivityDetailModal: () => unknown;
}

const ActivityDetailModal = (props: Props) => {
  const {
    activityDetailModalVisible,
    hideActivityDetailModal,
    ...passedThroughProps
  } = props;

  return (
    <AppModal
      isOpen={activityDetailModalVisible}
      onRequestClose={hideActivityDetailModal}
    >
      <ActivityDetail {...passedThroughProps} />
    </AppModal>
  );
};

export default connect(
  (state: { activityDetailModalVisible: boolean }) => ({
    activityDetailModalVisible: state.activityDetailModalVisible,
  }),
  dispatch => ({
    hideActivityDetailModal: () => dispatch(hideActivityDetailModal()),
  }),
)(ActivityDetailModal);
