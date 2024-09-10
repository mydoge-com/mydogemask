import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { messageHandler } from './scripts/background';
import {
  MESSAGE_TYPES,
  SELECTED_ADDRESS_INDEX,
} from './scripts/helpers/constants';
import { addListener, sendMessage } from './scripts/helpers/message';
import { setLocalValue } from './scripts/helpers/storage';
import { useTransactions } from './views/Transactions/Transactions.hooks';

export const AppContext = createContext(null);

export const DISPATCH_TYPES = {
  SET_CURRENT_ROUTE: 'SET_CURRENT_ROUTE',
  SET_ONBOARDING_COMPLETE: 'SET_ONBOARDING_COMPLETE',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_WALLET: 'SET_WALLET',
  SET_CONTEXT_LOADED: 'SET_CONTEXT_LOADED',
  SIGN_OUT: 'SIGN_OUT',
  SIGN_IN: 'SIGN_IN',
  SELECT_WALLET: 'SELECT_WALLET',
  SET_CLIENT_REQUEST: 'SET_CLIENT_REQUEST',
  CLEAR_CLIENT_REQUEST: 'CLEAR_CLIENT_REQUEST',
  COMPLETE_ONBOARDING: 'COMPLETE_ONBOARDING',
};

export const AppContextProvider = ({ children }) => {
  const reducer = useCallback(
    (state, { type, payload }) => {
      switch (type) {
        case DISPATCH_TYPES.SET_CURRENT_ROUTE:
          navigate(payload.route);
          return { ...state };
        case DISPATCH_TYPES.SET_ONBOARDING_COMPLETE:
          return { ...state, onboardingComplete: payload };
        case DISPATCH_TYPES.SET_AUTHENTICATED:
          return { ...state, authenticated: payload };
        case DISPATCH_TYPES.SET_WALLET:
          return { ...state, wallet: payload.wallet };
        case DISPATCH_TYPES.SIGN_OUT:
          navigate(payload?.navigate ?? 'Password');
          return {
            ...state,
            authenticated: false,
            wallet: undefined,
          };
        case DISPATCH_TYPES.SIGN_IN:
          navigate(
            payload?.navigate
              ? payload?.navigate
              : state.clientRequest
              ? 'ClientRequest'
              : 'Transactions'
          );
          return {
            ...state,
            authenticated: payload?.authenticated,
            wallet: payload?.wallet,
          };
        case DISPATCH_TYPES.COMPLETE_ONBOARDING:
          navigate(
            payload?.navigate
              ? payload?.navigate
              : state.clientRequest
              ? 'ClientRequest'
              : 'Transactions'
          );
          return {
            ...state,
          };
        case DISPATCH_TYPES.SELECT_WALLET:
          setLocalValue({ [SELECTED_ADDRESS_INDEX]: payload.index });
          return { ...state, selectedAddressIndex: payload.index };
        case DISPATCH_TYPES.SET_CLIENT_REQUEST:
          return { ...state, clientRequest: payload.clientRequest };
        case DISPATCH_TYPES.CLEAR_CLIENT_REQUEST:
          setTimeout(() => window?.close(), 1500);
          return { ...state };
        case DISPATCH_TYPES.SET_CONTEXT_LOADED:
          return { ...state, ready: payload.ready };
        default:
          return state;
      }
    },
    [navigate]
  );
  const [state, dispatch] = useReducer(reducer, {
    authenticated: false,
    onboardingComplete: undefined,
    wallet: undefined,
    selectedAddressIndex: undefined,
    txTabIndex: 0,
    ready: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      addListener(messageHandler);
    }
    sendMessage(
      { message: MESSAGE_TYPES.IS_ONBOARDING_COMPLETE },
      async (response) => {
        const popupTab = chrome?.tabs?.getCurrent();
        let url = null;
        if (popupTab?.url) {
          url = new URL(popupTab?.url);
        } else {
          // Dev environment
          url = new URL(window?.location?.href);
        }

        const requestType = url?.hash?.substring(1);
        const params = {};
        url?.searchParams?.forEach((_, key) => {
          const val = JSON.parse(url.searchParams.get(key));
          params[key] = val;
        });

        params.originTabId = Number(params.originTabId);
        if (requestType && params?.originTabId && params?.origin) {
          const clientRequest = {
            requestType,
            params,
          };

          dispatch({
            type: DISPATCH_TYPES.SET_CLIENT_REQUEST,
            payload: { clientRequest },
          });
          // Add event listener to handle window close
          window.addEventListener('beforeunload', function handleWindowClose() {
            sendMessage(
              {
                message: `${requestType}Response`,
                data: {
                  originTabId: params.originTabId,
                  origin: params.origin,
                  error: 'Request rejected by user',
                },
              },
              () => null
            );
            return null;
          });
        }
        if (response) {
          dispatch({
            type: DISPATCH_TYPES.SET_ONBOARDING_COMPLETE,
            payload: response,
          });
          sendMessage(
            { message: MESSAGE_TYPES.IS_SESSION_AUTHENTICATED },
            async ({ wallet, authenticated, selectedAddressIndex }) => {
              if (authenticated && wallet) {
                dispatch({
                  type: DISPATCH_TYPES.SIGN_IN,
                  payload: {
                    authenticated,
                    wallet,
                  },
                });
              }
              dispatch({
                type: DISPATCH_TYPES.SELECT_WALLET,
                payload: { index: selectedAddressIndex ?? 0 },
              });
              dispatch({
                type: DISPATCH_TYPES.SET_CONTEXT_LOADED,
                payload: { ready: true },
              });
            }
          );
        } else {
          dispatch({
            type: DISPATCH_TYPES.SET_CONTEXT_LOADED,
            payload: { ready: true },
          });
        }
      }
    );
  }, []);

  const transactionsData = useTransactions({
    wallet: state.wallet,
    selectedAddressIndex: state.selectedAddressIndex,
    navigate,
  });

  const providerValue = useMemo(
    () => ({
      ...state,
      dispatch,
      navigate,
      transactionsData,
    }),
    [navigate, state, transactionsData]
  );
  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};
