export const CATEGORY_SETTINGS_WINDOW_NAME = 'flambe-categories';

export function openCategorySettingsWindow(): void {
  if (typeof window === 'undefined') return;
  window.open(
    '/settings/categories',
    CATEGORY_SETTINGS_WINDOW_NAME,
    'popup=yes,width=720,height=800',
  );
}
