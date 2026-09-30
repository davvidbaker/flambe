import emojiRegex from 'emoji-regex';

/** Emoji characters embedded in a thread name (same extraction as the flame-chart headers). */
export function emojisInThreadName(name: string | null | undefined): string[] {
  if (!name) return [];
  const regex = emojiRegex();
  const emoji: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(name))) {
    emoji.push(match[0]);
  }
  return emoji;
}

export function threadEmojiLabel(name: string | null | undefined): string {
  return emojisInThreadName(name).join('');
}
