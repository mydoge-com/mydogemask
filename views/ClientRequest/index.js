import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { ClientAvailableDRC20Transaction } from './ClientAvailableDRC20Transaction';
import { ClientConnect } from './ClientConnect';
import { ClientDoginalTransaction } from './ClientDoginalTransaction';
import { ClientTransaction } from './ClientTransaction';

const CLIENT_REQUEST_ROUTES = {
  [MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION]: ClientConnect,
  [MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION]: ClientTransaction,
  [MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION]: ClientDoginalTransaction,
  [MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION]:
    ClientAvailableDRC20Transaction,
};

export function ClientRequest() {
  const { wallet, clientRequest, dispatch } = useAppContext();

  const RenderScreen = CLIENT_REQUEST_ROUTES[clientRequest.requestType];

  if (!RenderScreen) return null;

  return (
    <Layout p={0} alignItems='center' pt='32px'>
      <RenderScreen
        params={clientRequest.params}
        wallet={wallet}
        dispatch={dispatch}
      />
    </Layout>
  );
}
