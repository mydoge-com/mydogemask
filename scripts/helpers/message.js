// Wrapper for chrome.runtime.sendMessage and chrome.runtime.onMessage. Adds a listener for messages in development mode.

const listeners = [];

export const sendMessage = ({ message, data }, sendResponse) => {
  if (process.env.NODE_ENV === 'development') {
    listeners.forEach((listener) => {
      listener({ message, data }, { origin: 'localhost' }, sendResponse);
    });
    return;
  }
  chrome.runtime.sendMessage({ message, data }, sendResponse);
};

export const addListener = (callback) => {
  if (process.env.NODE_ENV === 'development' && !listeners.length) {
    listeners.push(callback);
    return;
  }
  if (typeof chrome !== 'undefined') {
    chrome?.runtime?.onMessage?.addListener?.(callback);
    chrome?.runtime?.onConnect?.addListener((port) => {
      port.onMessage.addListener(callback);
    });
  }
};
