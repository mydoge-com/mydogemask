import { useCallback } from 'react';
import { createChromeStorageStateHookLocal } from 'use-chrome-storage';

const SETTINGS_KEY = 'mydogemask';
const INITIAL_VALUE = {
  isAuthenticated: false,
  onboardingComplete: false,
};

const useStorageLocal = createChromeStorageStateHookLocal(
  SETTINGS_KEY,
  INITIAL_VALUE
);

export const useStorage = () => {
  const [storage, setStorage, isPersistent, error] = useStorageLocal();
  const updateStorage = useCallback(
    (appendSettings) => {
      setStorage((prevSettings) => ({ ...prevSettings, ...appendSettings }));
    },
    [setStorage]
  );
  return { storage, updateStorage, isPersistent, error };
};
