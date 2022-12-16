import React, { createContext, useCallback, useMemo, useState } from 'react';

import { useEncryptedStorage } from './hooks/useEncryptedStorage';

export const AppContext = createContext(null);

const initialAppContext = {
  isAuthenticated: false,
  isOnboardingComplete: false,
  wallet: null,
};

export const AppContextProvider = ({ children }) => {
  const { checkPassword, getOnboardingComplete } = useEncryptedStorage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(
    getOnboardingComplete()
  );
  const authenticate = useCallback(
    (password) => {
      const auth = checkPassword(password);
      if (auth) {
        setIsAuthenticated(true);
        setIsOnboardingComplete(getOnboardingComplete());
      }
      return auth;
    },
    [checkPassword, getOnboardingComplete]
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
