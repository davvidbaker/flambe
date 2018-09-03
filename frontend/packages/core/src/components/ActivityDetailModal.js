import React from 'react';
import { connect } from 'react-redux';

import ActivityDetail from './ActivityDetail';
import DraggableModal from './DraggableModal';
import { hideActivityDetailModal } from '../actions';

const ActivityDetailModal = props => {
  const {
    activityDetailModalVisible,
    hideActivityDetailModal,
    ...passedThroughProps
  } = props;

  return (
    <DraggableModal
      isOpen={activityDetailModalVisible}
      onRequestClose={hideActivityDetailModal}
      onDragStop={(e, { x, y }) => {
        window.localStorage.setItem('activityDetailPositionX', x);
        window.localStorage.setItem('activityDetailPositionY', y);
      }}
      defaultPosition={{
        x: Number(window.localStorage.getItem('activityDetailPositionX')),
        y: Number(window.localStorage.getItem('activityDetailPositionY')),
      }}
    >
      <ActivityDetail {...passedThroughProps} />
    </DraggableModal>
  );
};

export default connect(
  state => ({
    activityDetailModalVisible: state.activityDetailModalVisible,
  }),
  dispatch => ({
    hideActivityDetailModal: () => dispatch(hideActivityDetailModal()),
  }),
)(ActivityDetailModal);
