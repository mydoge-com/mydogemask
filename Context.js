import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { messageHandler } from './scripts/background';
import { addListener, sendMessage } from './scripts/helpers/message';

export const AppContext = createContext(null);

const reducer = (state, { type, payload }) => {
  switch (type) {
    case 'SET_CURRENT_ROUTE':
      return { ...state, currentRoute: payload };
    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, onboardingComplete: payload };
    case 'SET_AUTHENTICATED':
      return { ...state, authenticated: payload };
    case 'SET_WALLET':
      return { ...state, wallet: payload };
    case 'SIGN_OUT':
      return {
        ...state,
        authenticated: false,
        wallet: undefined,
        currentRoute: 'Password',
      };
    case 'SIGN_IN':
      return {
        ...state,
        authenticated: payload.authenticated,
        wallet: payload.wallet,
        currentRoute: payload.navigate ?? 'Transactions',
      };
    case 'SELECT_WALLET':
      return { ...state, currentWalletIndex: payload };
    default:
      return state;
  }
};

export const AppContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    authenticated: false,
    onboardingComplete: undefined,
    wallet: undefined,
    currentRoute: undefined,
    currentWalletIndex: 0,
  });

  const navigate = useCallback((route) => {
    dispatch({ type: 'SET_CURRENT_ROUTE', payload: route });
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      addListener(messageHandler);
    }
    sendMessage({ message: 'isOnboardingComplete' }, (response) => {
      if (response) {
        dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: response });
        sendMessage(
          { message: 'isSessionAuthenticated' },
          ({ wallet, authenticated }) => {
            if (authenticated && wallet) {
              dispatch({ type: 'SIGN_IN', payload: { authenticated, wallet } });
            } else {
              navigate('Password');
            }
          }
        );
      } else {
        navigate('Intro');
      }
    });
  }, [navigate]);

  const providerValue = useMemo(
    () => ({
      ...state,
      dispatch,
      navigate,
    }),
    [navigate, state]
  );
  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};
