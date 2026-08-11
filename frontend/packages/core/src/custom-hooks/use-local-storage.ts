import * as React from 'react';

// NOT CURRENTLY USING THIS. IT ALSO MIGHT NOT WORK
const useLocalStorage = (key: string): string | null | undefined => {
  let localStorageItem: string | null | undefined;

  if (key) {
    localStorageItem = localStorage.getItem(key);
  }

  const [localState, updateLocalState] = React.useState(localStorageItem);

  function syncLocalStorage(event: StorageEvent) {
    if (event.key === key) {
      updateLocalState(event.newValue);
    }
  }

  React.useEffect(() => {
    window.addEventListener('storage', syncLocalStorage);
    return () => {
      window.removeEventListener('storage', syncLocalStorage);
    };
  }, [key]);

  return localState;
};

export default useLocalStorage;
