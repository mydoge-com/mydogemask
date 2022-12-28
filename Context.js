import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  const [currentRoute, setCurrentRoute] = useState();

  const navigate = useCallback((route) => {
    setCurrentRoute(route);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      addListener(messageHandler);
    }
    sendMessage({ message: 'isOnboardingComplete' }, (response) => {
      if (response) {
        setOnboardingComplete(response);
        sendMessage({ message: 'isSessionAuthenticated' }, (res) => {
          if (res) {
            setAuthenticated(res);
            setCurrentRoute('Transactions');
          } else {
            setCurrentRoute('Password');
          }
        });
      } else {
        setCurrentRoute('Intro');
      }
    });
  }, []);

  const providerValue = useMemo(
    () => ({
      ...initialAppContext,
      authenticated,
      setAuthenticated,
      onboardingComplete,
      setOnboardingComplete,
      navigate,
      currentRoute,
    }),
    [authenticated, currentRoute, navigate, onboardingComplete]
  );
  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};
