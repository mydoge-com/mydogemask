import { MESSAGE_TYPES } from './helpers/constants';

function onConnectionResponse({ data, error, resolve, reject, listener }) {
  if (error) {
    reject(new Error('Unable to connect to MyDogeMask'));
  } else if (data.approved && data.address) {
    resolve(data);
  } else {
    reject(new Error('User rejected connection request'));
  }
  window.removeEventListener('message', listener);
}

// API we expose to allow websites to detect & interact with extension
window.doge = {
  isMyDogeMask: true,
  async connect() {
    return new Promise((resolve, reject) => {
      window.postMessage(
        { type: MESSAGE_TYPES.CONNECTION_REQUEST },
        window.location.origin
      );
      window.addEventListener(
        'message',
        function listener({ data: { type, data, error }, origin }) {
          // only accept messages from the same origin
          if (origin !== window.location.origin) return;
          switch (type) {
            case MESSAGE_TYPES.APPROVE_CONNECTION:
              onConnectionResponse({ data, error, resolve, reject, listener });
              break;
            default:
          }
        }
      );
    });
  },
  getAddress: () => {
    // TODO
  },
  getBalance: () => {
    // TODO
  },
  requestTransaction: () => {
    window.postMessage({
      type: 'FROM_PAGE',
      message: 'requestTransaction',
      data: {},
    });
  },
};
const initEvent = new Event('doge#initialized');
window.dispatchEvent(initEvent);
