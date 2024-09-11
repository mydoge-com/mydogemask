import { Toast } from 'native-base';
import { useCallback } from 'react';

import { Layout } from '../../components/Layout';
import { ToastRender } from '../../components/ToastRender';
import { DISPATCH_TYPES } from '../../Context';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { ClientAvailableDRC20Transaction } from './ClientAvailableDRC20Transaction';
import { ClientConnect } from './ClientConnect';
import { ClientDecryptedMessage } from './ClientDecryptedMessage';
import { ClientDoginalTransaction } from './ClientDoginalTransaction';
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

  const RenderScreen = clientRequest
    ? CLIENT_REQUEST_ROUTES[clientRequest?.requestType]?.component
    : null;

  const responseMessageType =
    CLIENT_REQUEST_ROUTES[clientRequest?.requestType]?.response;

  const handleWindowClose = useCallback(() => {
    dispatch({ type: DISPATCH_TYPES.CLEAR_CLIENT_REQUEST });
  }, [dispatch]);

  const handleError = useCallback(
    ({ error = 'Transaction Failed', title = 'Error', messageType }) => {
      sendMessage(
        {
          message: messageType,
          data: {
            error,
            originTabId: clientRequest?.params?.originTabId,
            origin: clientRequest?.params?.origin,
          },
        },
        () => {
          Toast.show({
            duration: 3000,
            render: () => {
              return (
                <ToastRender title={title} description={error} status='error' />
              );
            },
          });
          handleWindowClose();
        }
      );
    },
    [
      clientRequest?.params?.origin,
      clientRequest?.params?.originTabId,
      handleWindowClose,
    ]
  );

  if (!RenderScreen) return null;

  return (
    <Layout p={0} alignItems='center' pt='32px'>
      <RenderScreen
        params={clientRequest.params}
        wallet={wallet}
        dispatch={dispatch}
        connectedClient={params.connectedClient}
        connectedAddressIndex={params.connectedAddressIndex}
        handleError={handleError}
        handleWindowClose={handleWindowClose}
        responseMessageType={responseMessageType}
      />
    </Layout>
  );
}
