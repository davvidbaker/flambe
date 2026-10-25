export interface SettingsSearchable {
  copy: string;
  description?: string;
  setting: string;
  number?: { copy: string; setting: string };
  select?: { copy: string; options: readonly string[]; setting: string };
  subsettings?: ReadonlyArray<{
    copy: string;
    description?: string;
    setting: string;
  }>;
}

export function settingsSearchHaystack(item: SettingsSearchable): string {
  const parts = [item.copy, item.description ?? '', item.setting];
  if (item.number) parts.push(item.number.copy, item.number.setting);
  if (item.select) parts.push(item.select.copy, item.select.setting, ...item.select.options);
  for (const subsetting of item.subsettings ?? []) {
    parts.push(subsetting.copy, subsetting.description ?? '', subsetting.setting);
  }
  return parts.join(' ');
}

/** Empty queries match everything. Every whitespace-separated term must appear. */
export function matchesSettingsQuery(text: string, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = text.toLowerCase();
  return terms.every(term => haystack.includes(term));
}

export function filterBySettingsQuery<T extends SettingsSearchable>(items: readonly T[], query: string): T[] {
  return items.filter(item => matchesSettingsQuery(settingsSearchHaystack(item), query));
}
