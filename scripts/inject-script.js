import { MESSAGE_TYPES } from './helpers/constants';

const createResponseHandler =
  () =>
  ({ resolve, reject, onSuccess, onError, messageType }) => {
    function listener({ data: { type, data, error }, origin }) {
      // only accept messages from the same origin and message type of this context
      if (origin !== window.location.origin || type !== messageType) return;

      if (error) {
        onError?.(new Error(error));
        reject(new Error(error));
      } else if (data) {
        onSuccess?.(data);
        resolve(data);
      } else {
        onError?.(new Error('Unable to connect to MyDoge'));
        reject(new Error('Unable to connect to MyDoge'));
      }
      window.removeEventListener('message', listener);
    }
    window.addEventListener('message', listener);
  };

/**
 * Class representing the MyDoge API to interact with the Dogecoin wallet.
 */
class MyDogeWallet {
  constructor() {
    this.isMyDoge = true;
    console.info('MyDoge API initialized');
  }

  /**
   * Initiates a connection request with the wallet.
   * @param {Function} [onSuccess] - Callback function to execute upon successful connection.
   * @param {Function} [onError] - Callback function to execute upon connection error.
   * @returns {Promise} Promise object represents the outcome of the connection attempt.
   * @method
   */
  connect(onSuccess, onError) {
    return new Promise((resolve, reject) => {
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION_RESPONSE,
      });
    });
  }

  /**
   * Retrieves the balance from the connected wallet.
   * @param {Function} [onSuccess] - Callback function to execute upon successful retrieval of balance.
   * @param {Function} [onError] - Callback function to execute upon error in retrieving balance.
   * @returns {Promise} Promise object represents the balance retrieval outcome.
   */
  getBalance(onSuccess, onError) {
    return new Promise((resolve, reject) => {
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_GET_BALANCE },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_GET_BALANCE_RESPONSE,
      });
    });
  }

  /**
   * Retrieves the DRC20 token balance based on provided data.
   * @param {Object} data - Data required to fetch the DRC20 balance, must contain 'ticker'.
   * @param {Function} [onSuccess] - Callback function to execute upon successful retrieval.
   * @param {Function} [onError] - Callback function to execute upon error in fetching the balance.
   * @returns {Promise} Promise object represents the DRC20 balance retrieval outcome.
   * @method
   */
  getDRC20Balance(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.ticker) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }

      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_GET_DRC20_BALANCE, data },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_GET_DRC20_BALANCE_RESPONSE,
      });
    });
  }

  /**
   * Retrieves transferable DRC20 inscriptions based on provided data.
   * @param {Object} data - Data required for the query, must contain 'ticker'.
   * @param {Function} [onSuccess] - Callback function to execute upon successful retrieval.
   * @param {Function} [onError] - Callback function to execute upon error in fetching the transferable balance.
   * @returns {Promise} Promise object represents the retrieval outcome.
   * @method
   */
  getTransferableDRC20(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.ticker) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }

      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_GET_TRANSFERABLE_DRC20, data },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_GET_TRANSFERABLE_DRC20_RESPONSE,
      });
    });
  }

  /**
   * Requests a Dogecoin transaction based on the specified data.
   * @param {Object} data - Data needed for the transaction, must contain 'recipientAddress' and 'dogeAmount'.
   * @param {Function} [onSuccess] - Callback function to execute upon successful transaction request.
   * @param {Function} [onError] - Callback function to execute upon error in processing the transaction request.
   * @returns {Promise} Promise object represents the transaction request outcome.
   * @method
   */
  requestTransaction(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.recipientAddress || !data?.dogeAmount) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION, data },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE,
      });
    });
  }

  /**
   * Requests an inscription transaction for Doginal/DRC-20 based on the specified data.
   * @param {Object} data - Data required for the transaction, must contain 'recipientAddress' and 'output'.
   * @param {Function} [onSuccess] - Callback function to execute upon successful transaction request.
   * @param {Function} [onError] - Callback function to execute upon error in processing the transaction request.
   * @returns {Promise} Promise object represents the transaction request outcome.
   * @method
   */
  requestInscriptionTransaction(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.recipientAddress || !data?.output) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }

      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION, data },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE,
      });
    });
  }

  /**
   * Requests a transaction for available DRC20 tokens based on specified data.
   * @param {Object} data - Data required for the transaction, must contain 'ticker' and 'amount'.
   * @param {Function} [onSuccess] - Callback function to execute upon successful transaction request.
   * @param {Function} [onError] - Callback function to execute upon error in processing the transaction request.
   * @returns {Promise} Promise object represents the transaction request outcome.
   * @method
   */
  requestAvailableDRC20Transaction(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.ticker || !data?.amount) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }

      window.postMessage(
        {
          type: MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION,
          data,
        },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType:
          MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION_RESPONSE,
      });
    });
  }

  /**
   * Requests the signing of a partially signed Bitcoin transaction (PSBT) based on provided data.
   * @param {Object} data - Data required for signing the PSBT, must contain 'rawTx' and an array of indexes to sign 'indexes'.
   * @param {Function} [onSuccess] - Callback function to execute upon successful signing.
   * @param {Function} [onError] - Callback function to execute upon error in signing the PSBT.
   * @returns {Promise} Promise object represents the signing request outcome.
   * @method
   */
  requestPsbt(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.rawTx || !data?.indexes?.length) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }

      window.postMessage(
        {
          type: MESSAGE_TYPES.CLIENT_REQUEST_PSBT,
          data,
        },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_REQUEST_PSBT_RESPONSE,
      });
    });
  }

  /**
   * Requests the signing of an arbitrary message based on provided data.
   * @param {Object} data - Data required for the message signing, must contain 'message'.
   * @param {Function} [onSuccess] - Callback function to execute upon successful message signing.
   * @param {Function} [onError] - Callback function to execute upon error in signing the message.
   * @returns {Promise} Promise object represents the message signing request outcome.
   * @method
   */
  requestSignedMessage(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.message) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE, data },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE_RESPONSE,
      });
    });
  }

  /**
   * Disconnects the current session with the wallet.
   * @param {Function} [onSuccess] - Callback function to execute upon successful disconnection.
   * @param {Function} [onError] - Callback function to execute upon error in disconnecting.
   * @returns {Promise} Promise object represents the disconnection outcome.
   * @method
   */
  disconnect(onSuccess, onError) {
    return new Promise((resolve, reject) => {
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_DISCONNECT },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_DISCONNECT_RESPONSE,
      });
    });
  }

  /**
   * Retrieves the connection status with the wallet.
   * @param {Function} [onSuccess] - Callback function to execute upon successfully retrieving the status.
   * @param {Function} [onError] - Callback function to execute upon error in retrieving the connection status.
   * @returns {Promise} Promise object represents the connection status retrieval outcome.
   * @method
   */
  getConnectionStatus(onSuccess, onError) {
    return new Promise((resolve, reject) => {
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_CONNECTION_STATUS },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_CONNECTION_STATUS_RESPONSE,
      });
    });
  }

  /**
   * Retrieves the status of a specific transaction based on provided data.
   * @param {Object} data - Data required for the query, must contain 'txId'.
   * @param {Function} [onSuccess] - Callback function to execute upon successful status retrieval.
   * @param {Function} [onError] - Callback function to execute upon error in retrieving the transaction status.
   * @returns {Promise} Promise object represents the transaction status retrieval outcome.
   * @method
   */
  getTransactionStatus(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.txId) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_TRANSACTION_STATUS, data },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_TRANSACTION_STATUS_RESPONSE,
      });
    });
  }
}

// API we expose to allow websites to detect & interact with extension
const doge = new MyDogeWallet();

window.addEventListener('load', () => {
  window.doge = doge;
  window.dispatchEvent(new Event('doge#initialized'));
  console.info('MyDoge API dispatched to window object');
});
