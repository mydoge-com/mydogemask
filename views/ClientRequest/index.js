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
  const { wallet, selectedAddressIndex, clientRequest, dispatch } =
    useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];

  const addressNickname =
    wallet.nicknames?.[selectedAddressIndex] ??
    `Address ${selectedAddressIndex + 1}`;

  const RenderScreen = CLIENT_REQUEST_ROUTES[clientRequest.requestType];

  if (!RenderScreen) return null;

  return (
    <Layout p={0} alignItems='center' pt='32px'>
      <RenderScreen
        walletAddress={walletAddress}
        params={clientRequest.params}
        addressNickname={addressNickname}
        wallet={wallet}
        dispatch={dispatch}
      />
    </Layout>
  );
}
