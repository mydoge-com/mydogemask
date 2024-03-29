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
        onError?.(new Error('Unable to connect to MyDogeMask'));
        reject(new Error('Unable to connect to MyDogeMask'));
      }
      window.removeEventListener('message', listener);
    }
    window.addEventListener('message', listener);
  };

// API we expose to allow websites to detect & interact with extension
const doge = {
  isMyDogeMask: true,

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },
};

window.addEventListener('load', () => {
  window.doge = doge;
  window.dispatchEvent(new Event('doge#initialized'));
});
