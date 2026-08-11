export default function containsGithubLink(text: string): RegExpMatchArray | null {
  return text.match(/(.*\s)?(.*)#(\d*)\b/);
}
