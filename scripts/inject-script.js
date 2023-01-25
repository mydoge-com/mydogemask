import { MESSAGE_TYPES } from './helpers/constants';

function responseHandler({ data, error, resolve, reject, onSuccess, onError }) {
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
}

const SUPPORTED_RESPONSE_TYPES = [
  MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION_RESPONSE,
  MESSAGE_TYPES.CLIENT_GET_BALANCE_RESPONSE,
];

const onResponse = ({ resolve, reject, onSuccess, onError }) => {
  function listener({ data: { type, data, error }, origin }) {
    // only accept messages from the same origin
    if (origin !== window.location.origin) return;

    if (SUPPORTED_RESPONSE_TYPES.includes(type)) {
      responseHandler({ data, error, resolve, reject, onSuccess, onError });
      window.removeEventListener('message', listener);
    }
  }
  window.addEventListener('message', listener);
};

// API we expose to allow websites to detect & interact with extension
window.doge = {
  isMyDogeMask: true,

  async connect(onSuccess, onError) {
    return new Promise((resolve, reject) => {
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION },
        window.location.origin
      );
      onResponse({ resolve, reject, onSuccess, onError });
    });
  },

  async getBalance(onSuccess, onError) {
    return new Promise((resolve, reject) => {
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_GET_BALANCE },
        window.location.origin
      );
      onResponse({ resolve, reject, onSuccess, onError });
    });
  },
};
const initEvent = new Event('doge#initialized');
window.dispatchEvent(initEvent);
