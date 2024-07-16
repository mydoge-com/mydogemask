import { Toast } from 'native-base';
import { useCallback, useEffect, useState } from 'react';

import { Layout } from '../../components/Layout';
import { ToastRender } from '../../components/ToastRender';
import { DISPATCH_TYPES } from '../../Context';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import {
  getConnectedAddressIndex,
  getConnectedClient,
} from '../../scripts/helpers/data';
import { sendMessage } from '../../scripts/helpers/message';
import { logError } from '../../utils/error';
import { ClientAvailableDRC20Transaction } from './ClientAvailableDRC20Transaction';
import { ClientConnect } from './ClientConnect';
import { ClientDoginalTransaction } from './ClientDoginalTransaction';
import { ClientPSBT } from './ClientPSBT';
import { ClientSignedMessage } from './ClientSignedMessage';
import { ClientTransaction } from './ClientTransaction';

const CLIENT_REQUEST_ROUTES = {
  [MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION]: ClientConnect,
  [MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION]: ClientTransaction,
  [MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION]: ClientDoginalTransaction,
  [MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION]:
    ClientAvailableDRC20Transaction,
  [MESSAGE_TYPES.CLIENT_REQUEST_PSBT]: ClientPSBT,
  [MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE]: ClientSignedMessage,
};

export function ClientRequest() {
  const { wallet, clientRequest, dispatch } = useAppContext();
  const [connectedClient, setConnectedClient] = useState({});
  const [selectedAddressIndex, setSelectedAddressIndex] = useState();
  const origin = clientRequest?.params?.origin;

  useEffect(() => {
    (async () => {
      if (!origin) return;
      const client = await getConnectedClient(origin).catch((e) => logError(e));
      if (client) {
        setConnectedClient(client);
      }
    })();
    getConnectedAddressIndex(origin).then((index) => {
      setSelectedAddressIndex(index);
    });
  }, [origin]);

  const RenderScreen = clientRequest
    ? CLIENT_REQUEST_ROUTES[clientRequest?.requestType]
    : null;

  const handleWindowClose = useCallback(() => {
    dispatch({ type: DISPATCH_TYPES.CLEAR_CLIENT_REQUEST });
  }, [dispatch]);

  const handleError = useCallback(
    ({ error = 'Transaction Failed', title = 'Error', messageType }) => {
      sendMessage(
        {
          message: messageType,
          error,
          originTabId: clientRequest?.params?.originTabId,
          origin: clientRequest?.params?.origin,
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
        connectedClient={connectedClient}
        selectedAddressIndex={selectedAddressIndex}
        handleError={handleError}
        handleWindowClose={handleWindowClose}
      />
    </Layout>
  );
}
