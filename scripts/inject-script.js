import { MESSAGE_TYPES } from './helpers/constants';

// API we expose to allow websites to detect & interact with extension
window.doge = {
  isMyDogeMask: true,
  async connect() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { message: MESSAGE_TYPES.CONNECT },
        (response) => {
          if (response) {
            resolve(response);
          } else {
            reject(new Error('Failed to connect'));
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
