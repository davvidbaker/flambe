export const colors = {
  background: '#fff',
  hover: '#ddd',
  'hover-activity-bg': 'hsla(216, 68%, 54%, 0.2)',
  'focus-activity-bg': 'hsla(216, 68%, 54%, 0.1)',
  text: '#000',
  red: '#e85050',
  flames: {
    // Must be hex for color-picker; rgba/hsla are objects there.
    main: '#efc360',
  },
  dropTarget: 'hsl(130, 61%, 74%)',
} as const;

export const layout = {
  headerHeight: '40px',
} as const;

/** Flame-chart activity names (canvas) and the HTML hover card. */
export const timelineActivityFontFamily = 'sans-serif';
export const timelineActivityFontSizePx = 11;

export function timelineActivityCanvasFont(bold = false): string {
  return `${bold ? 'bold ' : ''}${timelineActivityFontSizePx}px ${timelineActivityFontFamily}`;
}
