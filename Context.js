/* eslint-disable import/no-relative-packages */
import { createContext, useEffect, useMemo, useState } from 'react';

import { messageHandler } from './scripts/background';
import {
  AUTHENTICATED,
  ONBOARDING_COMPLETE,
} from './scripts/helpers/constants';
import { addListener } from './scripts/helpers/message';
import { getLocalValue, getSessionValue } from './scripts/helpers/storage';

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
    getLocalValue(ONBOARDING_COMPLETE, (value) => {
      setOnboardingComplete(!!value);
    });

    getSessionValue(AUTHENTICATED, (value) => {
      setAuthenticated(!!value);
    });
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
