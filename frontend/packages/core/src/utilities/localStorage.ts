export function loadState(): unknown | undefined {
  try {
    const serializedState = window.localStorage.getItem('state');
    if (serializedState === null) return undefined;

    return JSON.parse(serializedState) as unknown;
  } catch {
    return undefined;
  }
}

export function saveState(state: unknown): void {
  try {
    const serializedState = JSON.stringify(state);
    window.localStorage.setItem('state', serializedState);
  } catch (error) {
    console.error(error);
  }
}
