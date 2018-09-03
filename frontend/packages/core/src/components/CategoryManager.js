import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Modal from 'react-modal';
import map from 'lodash/fp/map';
import pipe from 'lodash/fp/pipe';
import sortBy from 'lodash/fp/sortBy';
import tinycolor from 'tinycolor2';

import Category from './Category';
import {
  updateCategory as updateCategoryAction,
  hideCategoryManager as hideCategoryManagerAction,
} from '../actions';

const Wrapper = styled.div``;

const CategoryManager = ({
  categoryManagerVisible,
  categories,
  updateCategory,
  hideCategoryManager,
}) => (
  <Modal
    isOpen={categoryManagerVisible}
    shouldCloseOnOverlayClick
    contentLabel="Categories"
    onRequestClose={hideCategoryManager}
  >
    <h1>Manage Categories</h1>
    <ul>
      {categories
        |> sortBy(
          ({ color_background }) =>
            tinycolor(color_background)
              .spin(180)
              .toHsl().h,
        )
        |> map(category => (
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
  state => ({ categoryManagerVisible: state.categoryManagerVisible }),
  dispatch => ({
    updateCategory: (id, updates) =>
      dispatch(updateCategoryAction(id, updates)),
    hideCategoryManager: () => dispatch(hideCategoryManagerAction()),
  }),
)(CategoryManager);
