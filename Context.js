import React, { createContext, useCallback, useMemo } from 'react';

import { useEncryptedStorage } from './hooks/useEncryptedStorage';
import { useStorage } from './hooks/useStorage';

const ONBOARDING_COMPLETE = '@mydoge_ONBOARDING_COMPLETE';
const AUTH = '@mydoge_AUTH';

export const AppContext = createContext(null);

const initialAppContext = {
  isAuthenticated: false,
  isOnboardingComplete: false,
  wallet: null,
};

export const AppContextProvider = ({ children }) => {
  const { checkPassword } = useEncryptedStorage();
  const [isAuthenticated, setIsAuthenticated] = useStorage({
    key: AUTH,
    value: false,
    persist: false,
  });

  const [isOnboardingComplete, setIsOnboardingComplete] = useStorage({
    key: ONBOARDING_COMPLETE,
    value: false,
    persist: true,
  });

  const authenticate = useCallback(
    (password) => {
      const auth = checkPassword(password);
      if (auth) {
        setIsAuthenticated(true);
        setIsOnboardingComplete(true);
      }
      return auth;
    },
    [checkPassword, setIsAuthenticated, setIsOnboardingComplete]
  );

  const providerValue = useMemo(
    () => ({
      ...initialAppContext,
      authenticate,
      isAuthenticated,
      isOnboardingComplete,
    }),
    [authenticate, isAuthenticated, isOnboardingComplete]
  );
  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};
