import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Modal from 'react-modal';
import tinycolor from 'tinycolor2';

import Category from './Category';
import {
  updateCategory as updateCategoryAction,
  hideCategoryManager as hideCategoryManagerAction,
} from '../actions';
import type { Category as CategoryType } from '../types/Category';
import type { EntityId } from '../types/ids';

const Wrapper = styled.div``;

interface Props {
  categories: CategoryType[];
  categoryManagerVisible: boolean;
  hideCategoryManager: () => unknown;
  updateCategory: (id: EntityId, updates: Record<string, unknown>) => unknown;
}

const CategoryManager = ({
  categoryManagerVisible,
  categories,
  updateCategory,
  hideCategoryManager,
}: Props) => (
  <Modal
    isOpen={categoryManagerVisible}
    shouldCloseOnOverlayClick
    contentLabel="Categories"
    onRequestClose={hideCategoryManager}
  >
    <h1>Manage Categories</h1>
    <ul>
      {[...categories]
        .sort(
          (left, right) =>
            tinycolor(left.color_background).spin(180).toHsl().h -
            tinycolor(right.color_background).spin(180).toHsl().h,
        )
        .map(category => (
          <Category
            key={category.name}
            {...category}
            updateCategory={updateCategory}
          />
        ))}
    </ul>
  </Modal>
);

export default connect(
  (state: { categoryManagerVisible: boolean }) => ({
    categoryManagerVisible: state.categoryManagerVisible,
  }),
  dispatch => ({
    updateCategory: (id: EntityId, updates: Record<string, unknown>) =>
      dispatch(updateCategoryAction(id, updates)),
    hideCategoryManager: () => dispatch(hideCategoryManagerAction()),
  }),
)(CategoryManager);
