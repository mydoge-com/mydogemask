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

export const DISPATCH_TYPES = {
  SET_CURRENT_ROUTE: 'SET_CURRENT_ROUTE',
  SET_ONBOARDING_COMPLETE: 'SET_ONBOARDING_COMPLETE',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_WALLET: 'SET_WALLET',
  SIGN_OUT: 'SIGN_OUT',
  SIGN_IN: 'SIGN_IN',
  SELECT_WALLET: 'SELECT_WALLET',
  SET_CLIENT_REQUEST: 'SET_CLIENT_REQUEST',
  CLEAR_CLIENT_REQUEST: 'CLEAR_CLIENT_REQUEST',
};

const CLIENT_REQUEST_ROUTES = {
  [MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION]: 'ClientConnect',
  [MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION]: 'ClientTransaction',
};

const reducer = (state, { type, payload }) => {
  switch (type) {
    case DISPATCH_TYPES.SET_CURRENT_ROUTE:
      return { ...state, currentRoute: payload.route };
    case DISPATCH_TYPES.SET_ONBOARDING_COMPLETE:
      return { ...state, onboardingComplete: payload };
    case DISPATCH_TYPES.SET_AUTHENTICATED:
      return { ...state, authenticated: payload };
    case DISPATCH_TYPES.SET_WALLET:
      return { ...state, wallet: payload.wallet };
    case DISPATCH_TYPES.SIGN_OUT:
      return {
        ...state,
        authenticated: false,
        wallet: undefined,
        currentRoute: payload?.navigate ?? 'Password',
      };
    case DISPATCH_TYPES.SIGN_IN:
      return {
        ...state,
        authenticated: payload?.authenticated,
        wallet: payload?.wallet,
        currentRoute: state.clientRequest
          ? CLIENT_REQUEST_ROUTES[state.clientRequest.requestType]
          : payload?.navigate ?? 'Transactions',
      };
    case DISPATCH_TYPES.SELECT_WALLET:
      return { ...state, selectedAddressIndex: payload.index };
    case DISPATCH_TYPES.SET_CLIENT_REQUEST:
      return { ...state, clientRequest: payload.clientRequest };
    case DISPATCH_TYPES.CLEAR_CLIENT_REQUEST:
      setTimeout(() => window?.close(), 1000);
      return { ...state };
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
    dispatch({ type: DISPATCH_TYPES.SET_CURRENT_ROUTE, payload: { route } });
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      addListener(messageHandler);
    }
    sendMessage(
      { message: MESSAGE_TYPES.IS_ONBOARDING_COMPLETE },
      (response) => {
        if (response) {
          dispatch({
            type: DISPATCH_TYPES.SET_ONBOARDING_COMPLETE,
            payload: response,
          });
          sendMessage(
            { message: MESSAGE_TYPES.IS_SESSION_AUTHENTICATED },
            async ({ wallet, authenticated }) => {
              let url = null;
              const extPopupWindow = await chrome?.tabs?.getCurrent();
              if (extPopupWindow?.url) {
                url = new URL(extPopupWindow?.url);
              }
              const { hash, searchParams } = url;
              // strip # from hash
              const requestType = hash?.substring(1);
              const params = {};
              searchParams?.forEach((value, key) => {
                params[key] = value;
              });
              if (requestType && params.originTabId && params.origin) {
                // Add event listener to handle window close
                window.addEventListener(
                  'beforeunload',
                  function handleWindowClose() {
                    if (state.connectionRequest) {
                      sendMessage(
                        {
                          message: `${requestType}Response`,
                          data: {
                            originTabId: params.originTabId,
                            origin: params.origin,
                          },
                        },
                        () => {
                          window.removeEventListener(
                            'beforeunload',
                            handleWindowClose
                          );
                          dispatch({
                            type: DISPATCH_TYPES.CLEAR_CLIENT_REQUEST,
                          });
                        }
                      );
                    }
                    return null;
                  }
                );
                const clientRequest = {
                  requestType,
                  params,
                };
                // const connectionRequest = { originTabId, origin };
                dispatch({
                  type: DISPATCH_TYPES.SET_CLIENT_REQUEST,
                  payload: { clientRequest },
                });
              }
              if (authenticated && wallet) {
                dispatch({
                  type: DISPATCH_TYPES.SIGN_IN,
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
  }, [navigate, state.connectionRequest]);

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
