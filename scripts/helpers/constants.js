export const PASSWORD = '@mydoge_PASSWORD';
export const WALLET = '@mydoge_WALLET';
export const ONBOARDING_COMPLETE = '@mydoge_ONBOARDING_COMPLETE';
export const CONNECTED_CLIENTS = '@mydoge_CONNECTED_CLIENTS';
export const AUTHENTICATED = '@mydoge_AUTHENTICATED';
export const NOWNODES_BASE_URL = 'https://dogebook.nownodes.io/api/v2';
export const MAX_NICKNAME_LENGTH = 18;
export const FEE_RATE_KB = 0.5;
export const MAX_UTXOS = 1000;
export const MIN_TX_AMOUNT = 0.001;
export const NFT_PAGE_SIZE = 100;
export const QUERY_CACHE = '@mydoge_QUERY_CACHE';

const CLIENT_MESSAGE_TYPES = {
  CLIENT_REQUEST_CONNECTION: 'clientRequestConnection',
  CLIENT_REQUEST_CONNECTION_RESPONSE: 'clientRequestConnectionResponse',
  CLIENT_GET_BALANCE: 'clientRequestBalance',
  CLIENT_GET_BALANCE_RESPONSE: 'clientGetBalanceResponse',
  CLIENT_GET_DRC20_BALANCE: 'clientRequestDRC20Balance',
  CLIENT_GET_DRC20_BALANCE_RESPONSE: 'clientGetDRC20BalanceResponse',
  CLIENT_GET_TRANSFERABLE_DRC20: 'clientRequestTransferableDRC20',
  CLIENT_GET_TRANSFERABLE_DRC20_RESPONSE: 'clientGetTransferableDRC20Response',
  CLIENT_REQUEST_TRANSACTION: 'clientRequestTransaction',
  CLIENT_REQUEST_TRANSACTION_RESPONSE: 'clientRequestTransactionResponse',
  CLIENT_REQUEST_DOGINAL_TRANSACTION: 'clientRequestDoginalTransaction',
  CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION: 'clientRequestDRC20Transaction',
  CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION_RESPONSE:
    'clientRequestDRC20TransactionResponse',
  CLIENT_DISCONNECT: 'clientDisconnect',
  CLIENT_DISCONNECT_RESPONSE: 'clientDisconnectResponse',
  CLIENT_CONNECTION_STATUS: 'clientConnectionStatus',
  CLIENT_CONNECTION_STATUS_RESPONSE: 'clientConnectionStatusResponse',
  CLIENT_TRANSACTION_STATUS: 'clientTransactionStatus',
  CLIENT_TRANSACTION_STATUS_RESPONSE: 'clientTransactionStatusResponse',
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
  GET_TRANSACTION_DETAILS: 'getTransactionDetails',
  CREATE_TRANSACTION: 'createTransaction',
  CREATE_NFT_TRANSACTION: 'createNFTTransaction',
  CREATE_TRANSFER_TRANSACTION: 'inscribeTransferTransaction',
  SEND_TRANSACTION: 'sendTransaction',
  SEND_TRANSFER_TRANSACTION: 'sendInscribeTransferTransaction',
  GET_CONNECTED_CLIENTS: 'getConnectedClients',
  UPDATE_ADDRESS_NICKNAME: 'updateAddressNickname',
  NOTIFY_TRANSACTION_SUCCESS: 'notifyTransactionSuccess',
};

export const NODE_BASE_URL = 'https://doge.nownodes.io';
export const DOGINALS_WALLET_API_V2_URL = 'https://wallet-api.dogeord.io/v2';
export const DOGINALS_WALLET_API_URL = 'https://wallet-api.dogeord.io';
export const DOGINALS_MARKETPLACE_API_URL =
  'https://marketplace-api.dogeord.io';

export const TICKER_ICON_URL =
  'https://drc-20-icons.s3.eu-central-1.amazonaws.com';
