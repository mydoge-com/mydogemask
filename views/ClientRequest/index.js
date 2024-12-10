import { Toast } from 'native-base';
import { useCallback, useEffect, useRef } from 'react';

import { Layout } from '../../components/Layout';
import { ToastRender } from '../../components/ToastRender';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { ClientAvailableDRC20Transaction } from './ClientAvailableDRC20Transaction';
import { ClientConnect } from './ClientConnect';
import { ClientDecryptedMessage } from './ClientDecryptedMessage';
import { ClientDoginalTransaction } from './ClientDoginalTransaction';
import { ClientDunesTransaction } from './ClientDunesTransaction';
import { ClientPSBT } from './ClientPSBT';
import { ClientSignedMessage } from './ClientSignedMessage';
import { ClientTransaction } from './ClientTransaction';

const CLIENT_REQUEST_ROUTES = {
  [MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION]: {
    component: ClientConnect,
    response: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION_RESPONSE,
  },
  [MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION]: {
    component: ClientTransaction,
    response: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE,
  },
  [MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION]: {
    component: ClientDoginalTransaction,
    response: MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE,
  },
  [MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION]: {
    component: ClientAvailableDRC20Transaction,
    response: MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION_RESPONSE,
  },
  [MESSAGE_TYPES.CLIENT_REQUEST_DUNES_TRANSACTION]: {
    component: ClientDunesTransaction,
    response: MESSAGE_TYPES.CLIENT_REQUEST_DUNES_TRANSACTION_RESPONSE,
  },
  [MESSAGE_TYPES.CLIENT_REQUEST_PSBT]: {
    component: ClientPSBT,
    response: MESSAGE_TYPES.CLIENT_REQUEST_PSBT_RESPONSE,
  },
  [MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE]: {
    component: ClientSignedMessage,
    response: MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE_RESPONSE,
  },
  [MESSAGE_TYPES.CLIENT_REQUEST_DECRYPTED_MESSAGE]: {
    component: ClientDecryptedMessage,
    response: MESSAGE_TYPES.CLIENT_REQUEST_DECRYPTED_MESSAGE_RESPONSE,
  },
};

export function ClientRequest() {
  const { wallet, clientRequest, dispatch } = useAppContext();

  const { params } = clientRequest;
  const timeoutRef = useRef(null);

  const RenderScreen = clientRequest
    ? CLIENT_REQUEST_ROUTES[clientRequest?.requestType]?.component
    : null;

  const responseMessageType =
    CLIENT_REQUEST_ROUTES[clientRequest?.requestType]?.response;
  //   ({ error = 'Transaction Failed', title = 'Error', messageType }) => {
  //     sendMessage(
  //       {
  //         message: messageType,
  //         data: {
  //           error,
  //           originTabId: clientRequest?.params?.originTabId,
  //           origin: clientRequest?.params?.origin,
  //         },
  //       },
  //       () => {
  //         Toast.show({
  //           duration: 3000,
  //           render: () => {
  //             return (
  //               <ToastRender title={title} description={error} status='error' />
  //             );
  //           },
  //         });
  //         handleWindowClose();
  //       }
  //     );
  //   },
  //   [
  //     clientRequest?.params?.origin,
  //     clientRequest?.params?.originTabId,
  //     handleWindowClose,
  //   ]
  // );

  /**
   * Handles the response for client requests
   * @param {Object} options - The options for handling the response
   * @param {string} options.toastMessage - The message to display in the toast
   * @param {string} options.toastTitle - The title of the toast
   * @param {Object} options.data - Additional data to be sent with the response
   * @param {string} [options.error] - Error message, if any
   */
  const handleResponse = useCallback(
    ({ toastMessage, toastTitle, data, error }) => {
      Toast.show({
        duration: 1500,
        render: () => {
          return (
            <ToastRender
              title={toastTitle}
              description={toastMessage}
              status={error ? 'error' : 'success'}
            />
          );
        },
      });
      timeoutRef.current = setTimeout(() => {
        sendMessage(
          {
            message: responseMessageType,
            data: {
              ...data,
              error,
              originTabId: clientRequest?.params?.originTabId,
              origin: clientRequest?.params?.origin,
            },
          },
          () => window.close()
        );
      }, 1500);
    },
    [
      clientRequest?.params?.origin,
      clientRequest?.params?.originTabId,
      responseMessageType,
    ]
  );

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!RenderScreen) return null;

  return (
    <Layout p={0} alignItems='center' pt='32px'>
      <RenderScreen
        params={clientRequest.params}
        wallet={wallet}
        dispatch={dispatch}
        connectedClient={params.connectedClient}
        connectedAddressIndex={params.connectedAddressIndex}
        handleResponse={handleResponse}
      />
    </Layout>
  );
}
