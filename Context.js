import { createContext, useEffect, useMemo, useState } from 'react';

import { messageHandler } from './scripts/background';
import { addListener, sendMessage } from './scripts/helpers/message';

export const AppContext = createContext(null);

const initialAppContext = {
  authenticated: false,
  onboardingComplete: undefined,
};

export const AppContextProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(undefined);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      addListener(messageHandler);
    }
    sendMessage({ message: 'isOnboardingComplete' }, setOnboardingComplete);

    sendMessage({ message: 'isAuthenticated' }, setAuthenticated);
  }, []);

  const providerValue = useMemo(
    () => ({
      ...initialAppContext,
      authenticated,
      setAuthenticated,
      onboardingComplete,
      setOnboardingComplete,
    }),
    [authenticated, onboardingComplete]
  );
  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};
