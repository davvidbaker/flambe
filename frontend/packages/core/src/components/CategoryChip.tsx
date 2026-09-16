import React from 'react';
import styled from 'styled-components';

import type { Category } from '../types/Category';

const Chip = styled.span<{ $background: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.4;
  background: ${props => props.$background};
  color: ${props => props.$color};
`;

const Name = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Remove = styled.button`
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 0 0 2px;
  opacity: 0.75;

  &:hover,
  &:focus-visible {
    opacity: 1;
  }
`;

interface Props {
  category: Category;
  onRemove?: (id: Category['id']) => void;
}

const CategoryChip = ({ category, onRemove }: Props) => (
  <Chip
    $background={category.color_background}
    $color={category.color_text || '#000000'}
  >
    <Name>{category.name}</Name>
    {onRemove && (
      <Remove
        type="button"
        aria-label={`Remove ${category.name}`}
        onClick={() => onRemove(category.id)}
      >
        ×
      </Remove>
    )}
  </Chip>
);

export default CategoryChip;
