import { MESSAGE_TYPES } from './helpers/constants';

function onConnectionRequestResponse({ data, error, resolve, reject }) {
  if (error) {
    reject(new Error('Unable to connect to MyDogeMask'));
  } else {
    console.log({ data });
    resolve(data);
  }
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
        function listener({ data: { data, error, type } }) {
          switch (type) {
            case MESSAGE_TYPES.APPROVE_CONNECTION:
              onConnectionRequestResponse({ data, error, resolve, reject });
              break;
            default:
          }
          window.removeEventListener('message', listener);
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
