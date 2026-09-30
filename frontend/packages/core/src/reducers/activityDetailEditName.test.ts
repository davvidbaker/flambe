import { hideActivityDetailModal, showActivityDetails } from '../actions';
import { activityDetailEditName, activityDetailModalVisible } from './index';

describe('activity detail name edit flag', () => {
  it('opens the modal without requesting name edit by default', () => {
    expect(activityDetailModalVisible(false, showActivityDetails())).toBe(true);
    expect(activityDetailEditName(false, showActivityDetails())).toBe(false);
  });

  it('requests name edit when opening after a schedule create', () => {
    expect(activityDetailEditName(false, showActivityDetails({ editName: true }))).toBe(true);
  });

  it('clears the name-edit request when the modal closes', () => {
    expect(activityDetailEditName(true, hideActivityDetailModal())).toBe(false);
    expect(activityDetailModalVisible(true, hideActivityDetailModal())).toBe(false);
  });
});
