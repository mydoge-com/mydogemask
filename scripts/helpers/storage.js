// Wrapper functions for chrome.storage.local and chrome.storage.session. Adds a wrapper for localStorage and sessionStorage in development mode.

export const getSessionValue = (key) => {
  if (process.env.NODE_ENV === 'development') {
    const value = JSON.parse(sessionStorage.getItem(key));
    return Promise.resolve(value);
  }

  chrome.storage.session.get([key]).then((result) => {
    return result[key];
  });
};

export const getLocalValue = (key) => {
  if (process.env.NODE_ENV === 'development') {
    const value = JSON.parse(localStorage.getItem(key));
    return Promise.resolve(value);
  }

  chrome.storage.local.get([key]).then((result) => {
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

export const removeSessionValue = (keys) => {
  if (process.env.NODE_ENV === 'development') {
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
