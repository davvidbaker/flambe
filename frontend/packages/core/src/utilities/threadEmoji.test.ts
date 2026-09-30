import { describe, expect, it } from 'vitest';

import { emojisInThreadName, threadEmojiLabel } from './threadEmoji';

describe('threadEmoji', () => {
  it('extracts emoji from a thread name', () => {
    expect(emojisInThreadName('flambé🔥')).toEqual(['🔥']);
    expect(threadEmojiLabel('sell van 🚐')).toBe('🚐');
  });

  it('joins multiple emoji and ignores names without any', () => {
    expect(threadEmojiLabel('release 🚀✨')).toBe('🚀✨');
    expect(threadEmojiLabel('plain thread')).toBe('');
    expect(threadEmojiLabel(undefined)).toBe('');
  });
});
