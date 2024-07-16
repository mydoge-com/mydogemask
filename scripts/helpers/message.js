// Wrapper for chrome.runtime.sendMessage and chrome.runtime.onMessage. Adds a listener for messages in development mode.

const listeners = [];

/**
 * Sends a message to the background script. In development mode, it triggers local listeners instead.
 * @param {{ message: string; data: Object }} params - An object containing the message type (as a key of MESSAGE_TYPES) and associated data.
 * @param {Function} sendResponse - A callback function to send a response back to the message sender.
 */
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
