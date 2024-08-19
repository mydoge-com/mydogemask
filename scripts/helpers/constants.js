export const PASSWORD = '@mydoge_PASSWORD';
export const WALLET = '@mydoge_WALLET';
export const ONBOARDING_COMPLETE = '@mydoge_ONBOARDING_COMPLETE';
export const SELECTED_ADDRESS_INDEX = '@mydoge_SELECTED_ADDRESS_INDEX';
export const CONNECTED_CLIENTS = '@mydoge_CONNECTED_CLIENTS';
export const AUTHENTICATED = '@mydoge_AUTHENTICATED';
export const MAX_NICKNAME_LENGTH = 18;
export const FEE_RATE_KB = 0.5;
export const MAX_UTXOS = 1000;
export const MIN_TX_AMOUNT = 0.001;
export const NFT_PAGE_SIZE = 500;
export const QUERY_CACHE = '@mydoge_QUERY_CACHE';
export const INSCRIPTION_TXS_CACHE = '@mydoge_INSCRIPTION_TXS_CACHE';

export const TRANSACTION_TYPES = {
  DRC20_AVAILABLE_TX: 'drc20_available_tx',
  DRC20_SEND_INSCRIPTION_TX: 'drc20_send_inscription_tx',
  DOGINAL_TX: 'doginal_tx',
};
export const DOGINAL_TX = 'doginal_tx';

export const TRANSACTION_PENDING_TIME = 1000 * 60 * 15;

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
  CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE:
    'clientRequestDoginalTransactionResponse',
  CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION: 'clientRequestDRC20Transaction',
  CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION_RESPONSE:
    'clientRequestDRC20TransactionResponse',
  CLIENT_REQUEST_PSBT: 'clientRequestPsbt',
  CLIENT_REQUEST_PSBT_RESPONSE: 'clientRequestPsbtResponse',
  CLIENT_REQUEST_SIGNED_MESSAGE: 'clientRequestSignedMessage',
  CLIENT_REQUEST_SIGNED_MESSAGE_RESPONSE: 'clientRequestSignedMessageResponse',
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
  SIGN_PSBT: 'signPsbt',
  SEND_PSBT: 'sendPsbt',
  SIGN_MESSAGE: 'signMessage',
  GET_PSBT_FEE: 'getPsbtFee',
  GET_CONNECTED_CLIENTS: 'getConnectedClients',
  UPDATE_ADDRESS_NICKNAME: 'updateAddressNickname',
  NOTIFY_TRANSACTION_SUCCESS: 'notifyTransactionSuccess',
};

export const DOGINALS_WALLET_API_V2_URL = 'https://wallet-api.dogeord.io/v2';
export const DOGINALS_WALLET_API_URL = 'https://wallet-api.dogeord.io';
export const DOGINALS_MARKETPLACE_API_URL =
  'https://marketplace-api.dogeord.io';
export const MYDOGE_BASE_URL = 'https://api.mydoge.com'; // 'http://localhost:3000';

export const TICKER_ICON_URL =
  'https://drc-20-icons.s3.eu-central-1.amazonaws.com';
