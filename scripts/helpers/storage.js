// Wrapper functions for chrome.storage.local and chrome.storage.session. Adds a wrapper for localStorage and sessionStorage in development mode.

import { nownodes } from '../api';

const dev = process.env.NODE_ENV === 'development';

export const getSessionValue = (key) => {
  if (dev) {
    const value = JSON.parse(sessionStorage.getItem(key));
    return Promise.resolve(value);
  }

  return chrome.storage.session.get([key]).then((result) => {
    return result[key];
  });
};

export const getLocalValue = (key) => {
  if (dev) {
    const value = JSON.parse(localStorage.getItem(key));
    return Promise.resolve(value);
  }

  return chrome.storage.local
    .get([key])
    .then((result) => {
      return result[key];
    })
    .catch(() => null);
};

export const setSessionValue = (keyValues) => {
  if (dev) {
    Object.keys(keyValues).forEach((key) => {
      sessionStorage.setItem(key, JSON.stringify(keyValues[key]));
    });
    return Promise.resolve();
  }
  return chrome.storage.session.set(keyValues);
};

export const setLocalValue = (keyValues) => {
  if (dev) {
    Object.keys(keyValues).forEach((key) => {
      localStorage.setItem(key, JSON.stringify(keyValues[key]));
    });
    return Promise.resolve();
  }
  return chrome.storage.local.set(keyValues);
};

export const removeSessionValue = (keys) => {
  if (dev) {
    if (typeof keys === 'string') {
      sessionStorage.removeItem(keys);
    } else {
      keys.forEach((key) => {
        sessionStorage.removeItem(key);
      });
    }
    return Promise.resolve();
  }
  return chrome.storage.session.remove(keys);
};

export const removeLocalValue = (keys) => {
  if (dev) {
    if (typeof keys === 'string') {
      localStorage.removeItem(keys);
    } else {
      keys.forEach((key) => {
        localStorage.removeItem(key);
      });
    }
    return Promise.resolve();
  }
  return chrome.storage.local.remove(keys);
};

export const clearSessionStorage = () => {
  if (dev) {
    sessionStorage.clear();
    return Promise.resolve();
  }
  return chrome.storage.session.clear();
};

export const clearLocalStorage = () => {
  if (dev) {
    localStorage.clear();
    return Promise.resolve();
  }
  return chrome.storage.local.clear();
};

export async function getCachedTx(txid) {
  let tx = await getLocalValue(txid);

  if (!tx || !tx.vout || tx.confirmations === 0) {
    tx = await nownodes.get(`/tx/${txid}`).json();
    await setLocalValue({ [txid]: tx });
  }

  return tx;
}
