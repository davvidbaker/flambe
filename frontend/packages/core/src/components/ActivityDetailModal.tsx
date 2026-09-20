import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import ActivityDetail from './ActivityDetail';
import AppModal from './AppModal';
import CloseButton from './CloseButton';
import { hideActivityDetailModal } from '../actions';
import type { ActivityDetailProps } from './ActivityDetail';

interface Props extends Omit<ActivityDetailProps, 'activity_id' | 'agents' | 'categories' | 'events' | 'showCategoryManager' | 'threads' | 'updateActivity'> {
  activityDetailModalVisible: boolean;
  hideActivityDetailModal: () => unknown;
}

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
`;

const ActivityDetailModal = (props: Props) => {
  const {
    activityDetailModalVisible,
    hideActivityDetailModal,
    ...passedThroughProps
  } = props;

  return (
    <AppModal
      contentLabel="Activity details"
      isOpen={activityDetailModalVisible}
      onRequestClose={hideActivityDetailModal}
    >
      <div data-activity-detail="true">
        <Header>
          <Title>Activity</Title>
          <CloseButton onClick={hideActivityDetailModal} />
        </Header>
        <ActivityDetail {...passedThroughProps} />
      </div>
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
