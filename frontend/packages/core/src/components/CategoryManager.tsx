import React, { useState } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import AppModal from './AppModal';
import Button from './Button';
import {
  createCategory as createCategoryAction,
  updateCategory as updateCategoryAction,
  hideCategoryManager as hideCategoryManagerAction,
} from '../actions';
import { getUser, type UserState } from '../reducers/user';
import { colors } from '../styles';
import type { Category as CategoryType } from '../types/Category';
import type { EntityId } from '../types/ids';

const Heading = styled.h1`
  margin: 0 0 12px;
  font-size: 16px;
`;

const CreateRow = styled.form`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 8px;
  align-items: end;
  margin-bottom: 16px;

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
    color: #666;
  }

  input[type='text'] {
    min-width: 0;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  input[type='color'] {
    width: 36px;
    height: 28px;
    padding: 0;
    border: 1px solid #ccc;
    background: #fff;
  }
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Row = styled.form`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 8px;
  align-items: end;

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
    color: #666;
  }

  input[type='text'] {
    min-width: 0;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  input[type='color'] {
    width: 36px;
    height: 28px;
    padding: 0;
    border: 1px solid #ccc;
    background: #fff;
  }
`;

interface Props {
  categories: CategoryType[];
  categoryManagerVisible: boolean;
  createCategory: (input: { name: string; color_background: string; color_text: string }) => unknown;
  hideCategoryManager: () => unknown;
  updateCategory: (id: EntityId, updates: Record<string, unknown>) => unknown;
}

function hexColor(value: string | undefined, fallback: string): string {
  if (value && /^#[0-9a-fA-F]{6}$/.test(value)) return value;
  return fallback;
}

const CategoryRow = ({
  category,
  updateCategory,
}: {
  category: CategoryType;
  updateCategory: Props['updateCategory'];
}) => {
  const [name, setName] = useState(category.name);
  const [background, setBackground] = useState(hexColor(category.color_background, colors.flames.main));
  const [text, setText] = useState(hexColor(category.color_text, '#000000'));

  return (
    <Row
      onSubmit={event => {
        event.preventDefault();
        updateCategory(category.id, {
          name,
          color_background: background,
          color_text: text,
        });
      }}
    >
      <label>
        Name
        <input value={name} onChange={event => setName(event.target.value)} />
      </label>
      <label>
        Background
        <input type="color" value={background} onChange={event => setBackground(event.target.value)} />
      </label>
      <label>
        Text
        <input type="color" value={text} onChange={event => setText(event.target.value)} />
      </label>
      <Button looksLikeButton type="submit">Save</Button>
    </Row>
  );
};

const CategoryManager = ({
  categoryManagerVisible,
  categories,
  createCategory,
  updateCategory,
  hideCategoryManager,
}: Props) => {
  const [name, setName] = useState('');
  const [background, setBackground] = useState<string>(colors.flames.main);
  const [text, setText] = useState('#000000');

  return (
    <AppModal
      isOpen={categoryManagerVisible}
      contentLabel="Categories"
      onRequestClose={hideCategoryManager}
      wide
    >
      <Heading>Categories</Heading>
      <CreateRow
        onSubmit={event => {
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          createCategory({
            name: trimmed,
            color_background: background,
            color_text: text,
          });
          setName('');
        }}
      >
        <label>
          New category
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Name"
          />
        </label>
        <label>
          Background
          <input type="color" value={background} onChange={event => setBackground(event.target.value)} />
        </label>
        <label>
          Text
          <input type="color" value={text} onChange={event => setText(event.target.value)} />
        </label>
        <Button looksLikeButton type="submit">Add</Button>
      </CreateRow>
      <List>
        {categories.map(category => (
          <li key={`${category.id}-${category.name}-${category.color_background}-${category.color_text}`}>
            <CategoryRow category={category} updateCategory={updateCategory} />
          </li>
        ))}
      </List>
    </AppModal>
  );
};

export default connect(
  (state: { categoryManagerVisible: boolean; user: UserState }) => ({
    categoryManagerVisible: state.categoryManagerVisible,
    categories: getUser(state).categories,
  }),
  dispatch => ({
    createCategory: (input: { name: string; color_background: string; color_text: string }) =>
      dispatch(createCategoryAction(input)),
    updateCategory: (id: EntityId, updates: Record<string, unknown>) =>
      dispatch(updateCategoryAction(id, updates)),
    hideCategoryManager: () => dispatch(hideCategoryManagerAction()),
  }),
)(CategoryManager);
