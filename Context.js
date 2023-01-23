import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { messageHandler } from './scripts/background';
import { MESSAGE_TYPES } from './scripts/helpers/constants';
import { addListener, sendMessage } from './scripts/helpers/message';

export const AppContext = createContext(null);

const reducer = (state, { type, payload }) => {
  switch (type) {
    case 'SET_CURRENT_ROUTE':
      return { ...state, currentRoute: payload.route };
    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, onboardingComplete: payload };
    case 'SET_AUTHENTICATED':
      return { ...state, authenticated: payload };
    case 'SET_WALLET':
      return { ...state, wallet: payload.wallet };
    case 'SIGN_OUT':
      return {
        ...state,
        authenticated: false,
        wallet: undefined,
        currentRoute: payload?.navigate ?? 'Password',
      };
    case 'SIGN_IN':
      return {
        ...state,
        authenticated: payload?.authenticated,
        wallet: payload?.wallet,
        currentRoute: state.connect
          ? 'Connect'
          : payload?.navigate ?? 'Transactions',
      };
    case 'SELECT_WALLET':
      return { ...state, selectedAddressIndex: payload.index };
    case 'SET_CONNECTION_REQUESTED':
      return { ...state, connect: payload.connect };
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
    selectedAddressIndex: 0,
  });

  const navigate = useCallback((route) => {
    dispatch({ type: 'SET_CURRENT_ROUTE', payload: { route } });
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      addListener(messageHandler);
    }
    sendMessage(
      { message: MESSAGE_TYPES.IS_ONBOARDING_COMPLETE },
      (response) => {
        if (response) {
          dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: response });
          sendMessage(
            { message: MESSAGE_TYPES.IS_SESSION_AUTHENTICATED },
            async ({ wallet, authenticated }) => {
              let connect;
              let url;
              if (chrome?.windows) {
                const extPopupWindow = await chrome.tabs.getCurrent();
                url = new URL(extPopupWindow.url);
              } else {
                url = new URL(window.location.href);
              }
              const tabId = url.searchParams.get('tabId');
              const origin = url.searchParams.get('origin');
              if (tabId && origin) {
                connect = { tabId, origin };
                dispatch({
                  type: 'SET_CONNECTION_REQUESTED',
                  payload: { connect },
                });
              }
              if (authenticated && wallet) {
                dispatch({
                  type: 'SIGN_IN',
                  payload: {
                    authenticated,
                    wallet,
                  },
                });
              } else {
                navigate('Password');
              }
            }
          );
        } else {
          navigate('Intro');
        }
      }
    );
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
