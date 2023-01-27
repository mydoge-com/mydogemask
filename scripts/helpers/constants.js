export const PASSWORD = '@mydoge_PASSWORD';
export const WALLET = '@mydoge_WALLET';
export const ONBOARDING_COMPLETE = '@mydoge_ONBOARDING_COMPLETE';
export const CONNECTED_CLIENTS = '@mydoge_CONNECTED_CLIENTS';
export const AUTHENTICATED = '@mydoge_AUTHENTICATED';
export const NOWNODES_BASE_URL = 'https://dogebook.nownodes.io/api/v2';

const CLIENT_MESSAGE_TYPES = {
  CLIENT_REQUEST_CONNECTION: 'clientRequestConnection',
  CLIENT_REQUEST_CONNECTION_RESPONSE: 'clientRequestConnectionResponse',
  CLIENT_GET_BALANCE: 'clientRequestBalance',
  CLIENT_GET_BALANCE_RESPONSE: 'clientGetBalanceResponse',
  CLIENT_REQUEST_TRANSACTION: 'clientRequestTransaction',
  CLIENT_REQUEST_TRANSACTION_RESPONSE: 'clientRequestTransactionResponse',
  CLIENT_DISCONNECT: 'clientDisconnect',
  CLIENT_DISCONNECT_RESPONSE: 'clientDisconnectResponse',
};

export const MESSAGE_TYPES = {
  ...CLIENT_MESSAGE_TYPES,
  CREATE_WALLET: 'createWallet',
  RESET_WALLET: 'resetWallet',
  AUTHENTICATE: 'authenticate',
  IS_ONBOARDING_COMPLETE: 'isOnboardingComplete',
  IS_SESSION_AUTHENTICATED: 'isSessionAuthenticated',
  SIGN_OUT: 'signOut',
  DELETE_WALLET: 'deleteWallet',
  GENERATE_ADDRESS: 'generateAddress',
  DELETE_ADDRESS: 'deleteAddress',
  GET_DOGECOIN_PRICE: 'getDogecoinPrice',
  GET_ADDRESS_BALANCE: 'getAddressBalance',
  GET_TRANSACTIONS: 'getTransactions',
  CREATE_TRANSACTION: 'createTransaction',
  SEND_TRANSACTION: 'sendTransaction',
  GET_CONNECTED_CLIENTS: 'getConnectedClients',
};
export const NODE_BASE_URL = 'https://doge.nownodes.io';
