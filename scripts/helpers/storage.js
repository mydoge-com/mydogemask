// Wrapper functions for chrome.storage.local and chrome.storage.session. Adds a wrapper for localStorage and sessionStorage in development mode.

export const getSessionValue = (key, callback) => {
  if (process.env.NODE_ENV === 'development') {
    const value = JSON.parse(sessionStorage.getItem(key));
    callback?.(value);
    return Promise.resolve(value);
  }

  chrome.storage.session.get([key]).then((result) => {
    callback?.(result[key]);
    return result[key];
  });
};

export const getLocalValue = (key, callback) => {
  if (process.env.NODE_ENV === 'development') {
    const value = JSON.parse(localStorage.getItem(key));
    callback?.(value);
    return Promise.resolve(value);
  }

  chrome.storage.local.get([key]).then((result) => {
    callback?.(result[key]);
    return result[key];
  });
};

export const setSessionValue = (keyValues) => {
  if (process.env.NODE_ENV === 'development') {
    Object.keys(keyValues).forEach((key) => {
      sessionStorage.setItem(key, JSON.stringify(keyValues[key]));
    });
    return Promise.resolve();
  }
  return chrome.storage.session.set(keyValues);
};

export const setLocalValue = (keyValues) => {
  if (process.env.NODE_ENV === 'development') {
    Object.keys(keyValues).forEach((key) => {
      localStorage.setItem(key, JSON.stringify(keyValues[key]));
    });
    return Promise.resolve();
  }
  return chrome.storage.local.set(keyValues);
};
