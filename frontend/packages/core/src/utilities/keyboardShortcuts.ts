export type ShortcutToken = 'Mod' | 'Shift' | 'Option' | string;

export interface ShortcutEntry {
  id: string;
  label: string;
  keys: ShortcutToken[];
}

export interface ShortcutSection {
  title: string;
  note?: string;
  shortcuts: ShortcutEntry[];
}

export function isAppleKeyboardPlatform(
  platform = typeof navigator === 'undefined' ? '' : navigator.platform,
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS X/i.test(userAgent);
}

export function displayKey(token: ShortcutToken, apple = isAppleKeyboardPlatform()): string {
  switch (token) {
    case 'Mod':
      return apple ? '⌘' : 'Ctrl';
    case 'Shift':
      return apple ? '⇧' : 'Shift';
    case 'Option':
      return apple ? '⌥' : 'Alt';
    default:
      return token;
  }
}

export function formatShortcut(
  keys: ShortcutToken[],
  apple = isAppleKeyboardPlatform(),
): string {
  const rendered = keys.map(token => displayKey(token, apple));
  return apple ? rendered.join(' ') : rendered.join('+');
}

type HotkeyEvent = Pick<
  KeyboardEvent,
  'altKey' | 'code' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'
>;

/** Cmd+/ on Apple, Ctrl+/ elsewhere. Shift must not be held. */
export function isKeyboardShortcutsHotkey(event: HotkeyEvent): boolean {
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return false;
  return event.key === '/' || event.code === 'Slash';
}

export const KEYBOARD_SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'General',
    shortcuts: [
      { id: 'shortcuts', label: 'Keyboard shortcuts', keys: ['Mod', '/'] },
      { id: 'settings', label: 'Open settings', keys: ['Mod', ','] },
      { id: 'commander', label: 'Command palette', keys: ['Mod', 'Shift', 'P'] },
      { id: 'undo', label: 'Undo last command', keys: ['Mod', 'Z'] },
      { id: 'mute', label: 'Mute / unmute other activities', keys: ['Mod', 'M'] },
      { id: 'collapse-threads', label: 'Collapse all threads', keys: ['Shift', '{'] },
      { id: 'expand-threads', label: 'Expand all threads', keys: ['Shift', '}'] },
    ],
  },
  {
    title: 'Search',
    shortcuts: [
      { id: 'find', label: 'Find', keys: ['Mod', 'F'] },
      { id: 'advanced-search', label: 'Advanced search', keys: ['Mod', 'Shift', 'F'] },
    ],
  },
  {
    title: 'Timeline',
    note: 'When focus is not in a text field.',
    shortcuts: [
      { id: 'zoom-now', label: 'Jump to now', keys: ['N'] },
      { id: 'zoom-chord', label: 'Zoom to a period, then H / D / W / M / Y / A', keys: ['Z'] },
    ],
  },
  {
    title: 'Focused activity',
    note: 'After selecting a block, while focus is not in a text field.',
    shortcuts: [
      { id: 'details', label: 'Edit / view details', keys: ['Space'] },
      { id: 'end', label: 'End', keys: ['E'] },
      { id: 'reject', label: 'End by rejection', keys: ['J'] },
      { id: 'resolve', label: 'End by resolution', keys: ['V'] },
      { id: 'suspend', label: 'Suspend (active activities)', keys: ['S'] },
    ],
  },
];
