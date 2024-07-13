import { useEffect, useState } from 'react';

import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { getConnectedClient } from '../../scripts/helpers/data';
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
  const { origin } = clientRequest.params;

  useEffect(() => {
    (async () => {
      const client = await getConnectedClient(origin).catch((e) => logError(e));
      if (client) {
        setConnectedClient(client);
      }
    })();
  }, [origin]);

  const RenderScreen = CLIENT_REQUEST_ROUTES[clientRequest.requestType];

  if (!RenderScreen) return null;

  return (
    <Layout p={0} alignItems='center' pt='32px'>
      <RenderScreen
        params={clientRequest.params}
        wallet={wallet}
        dispatch={dispatch}
        connectedClient={connectedClient}
      />
    </Layout>
  );
}
