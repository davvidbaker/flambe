import { describe, expect, it } from 'vitest';

import {
  displayKey,
  formatShortcut,
  isAppleKeyboardPlatform,
  isKeyboardShortcutsHotkey,
} from './keyboardShortcuts';

describe('keyboardShortcuts', () => {
  it('detects Apple platforms', () => {
    expect(isAppleKeyboardPlatform('MacIntel', '')).toBe(true);
    expect(isAppleKeyboardPlatform('Win32', 'Windows')).toBe(false);
    expect(isAppleKeyboardPlatform('', 'Macintosh; Intel Mac OS X')).toBe(true);
  });

  it('formats chords for Apple and non-Apple keyboards', () => {
    expect(formatShortcut(['Mod', '/'], true)).toBe('⌘ /');
    expect(formatShortcut(['Mod', '/'], false)).toBe('Ctrl+/');
    expect(formatShortcut(['Mod', 'Shift', 'P'], true)).toBe('⌘ ⇧ P');
    expect(formatShortcut(['Mod', 'Shift', 'P'], false)).toBe('Ctrl+Shift+P');
    expect(displayKey('Option', true)).toBe('⌥');
    expect(displayKey('Option', false)).toBe('Alt');
  });

  it('matches Command/Ctrl slash without Shift', () => {
    expect(
      isKeyboardShortcutsHotkey({
        key: '/',
        code: 'Slash',
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      }),
    ).toBe(true);
    expect(
      isKeyboardShortcutsHotkey({
        key: '/',
        code: 'Slash',
        metaKey: false,
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
      }),
    ).toBe(true);
    expect(
      isKeyboardShortcutsHotkey({
        key: '/',
        code: 'Slash',
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
      }),
    ).toBe(false);
    expect(
      isKeyboardShortcutsHotkey({
        key: '?',
        code: 'Slash',
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
      }),
    ).toBe(false);
    expect(
      isKeyboardShortcutsHotkey({
        key: ',',
        code: 'Comma',
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      }),
    ).toBe(false);
  });
});
