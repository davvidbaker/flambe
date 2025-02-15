import * as React from 'react';

// NOT CURRENTLY USING THIS. IT ALSO MIGHT NOT WORK
const useLocalStorage = key => {
  let localStorageItem;

  if (key) {
    localStorageItem = localStorage[key];
  }

  const [localState, updateLocalState] = React.useState(localStorageItem);

  function syncLocalStorage(event) {
    if (event.key === key) {
      updateLocalState(event.newValue);
    }
  }

  React.useEffect(() => {
    window.addEventListener('storage', syncLocalStorage);
    return () => {
      window.removeEventListener('storage', syncLocalStorage);
    };
  }, []);

  return localState;
};

export default useLocalStorage;
