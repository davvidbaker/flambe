import React, { type ChangeEvent } from 'react';

const DEFAULT_COLOR = '#ffffff';

export interface ColorValue { hex: string }
interface Props { color?: string | ColorValue | null; onChangeComplete: (color: ColorValue) => void }

const normalizeColor = (color?: string | ColorValue | null): string => {
  const value = (typeof color === 'string' ? color : color?.hex) ?? '';

  if (/^#[0-9a-f]{6}$/i.test(value || '')) {
    return value;
  }

  if (/^#[0-9a-f]{3}$/i.test(value || '')) {
    return `#${value.slice(1).split('').map(character => `${character}${character}`).join('')}`;
  }

  return DEFAULT_COLOR;
};

// Retain React Color's small `{ hex }` callback contract while using the
// browser's accessible, dependency-free color picker.
const ColorPicker = ({ color, onChangeComplete }: Props) => (
  <input
    aria-label="Choose color"
    type="color"
    value={normalizeColor(color)}
    onChange={(event: ChangeEvent<HTMLInputElement>) => onChangeComplete({ hex: event.target.value })}
  />
);

export default ColorPicker;
