export type SearchOptions = {
  matchCase: boolean;
  matchWholeWord: boolean;
  useRegularExpression: boolean;
};

export class InvalidSearchRegexError extends Error {
  constructor() {
    super('Invalid regular expression');
    this.name = 'InvalidSearchRegexError';
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function compileSearchRegex(searchTerm: string, options: SearchOptions): RegExp {
  const source = options.useRegularExpression ? searchTerm : escapeRegExp(searchTerm);
  const wrapped = options.matchWholeWord ? `\\b(?:${source})\\b` : source;
  const flags = options.matchCase ? '' : 'i';

  try {
    return new RegExp(wrapped, flags);
  } catch {
    throw new InvalidSearchRegexError();
  }
}

export function activityMatchesSearch(
  name: string | undefined | null,
  searchTerm: string,
  options: SearchOptions,
): boolean {
  if (!name || searchTerm.length <= 0) return false;
  return compileSearchRegex(searchTerm, options).test(name);
}
