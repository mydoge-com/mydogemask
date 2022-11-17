import { useCallback } from 'react';
import { createChromeStorageStateHookLocal } from 'use-chrome-storage';
import useLocalStorage from 'use-local-storage';

const SETTINGS_KEY = 'mydogemask';
const INITIAL_VALUE = {
  isAuthenticated: false,
  onboardingComplete: false,
};

const useStorageLocal = chrome?.storage
  ? createChromeStorageStateHookLocal(SETTINGS_KEY, INITIAL_VALUE)
  : useLocalStorage;

export const useStorage = () => {
  const [storage, setStorage, isPersistent, error] = useStorageLocal(
    SETTINGS_KEY,
    INITIAL_VALUE
  );
  const updateStorage = useCallback(
    (appendSettings) => {
      if (chrome?.storage) {
        setStorage((prevSettings) => ({ ...prevSettings, ...appendSettings }));
      } else {
        setStorage({
          ...storage,
          ...appendSettings,
        });
      }
    },
    [setStorage, storage]
  );
  return { storage, updateStorage, isPersistent, error };
};
