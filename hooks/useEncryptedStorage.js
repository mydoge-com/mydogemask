import { useCallback, useRef } from 'react';
import SecureLS from 'secure-ls';

const PASSWORD = '@mydoge_PASSWORD';
const PHRASE = '@mydoge_PHRASE';
const ROOT_KEY = '@mydoge_ROOT_KEY';
const CHILD_KEY = '@mydoge_CHILD_KEY';

const CryptoJS = require('crypto-js');

const hash = (password) => {
  return CryptoJS.SHA256(password).toString();
};

export const useEncryptedStorage = () => {
  const storage = useRef(null);

  const getInstance = useCallback((password) => {
    if (storage.current === null) {
      storage.current = new SecureLS({
        encodingType: 'aes',
        encryptionSecret: password,
        isCompression: false,
      });
    }
    return storage.current;
  }, []);

  const setPassword = useCallback(
    (password) => {
      const instance = getInstance(password);
      instance.set(PASSWORD, hash(password));
    },
    [getInstance]
  );

  const checkPassword = useCallback(
    (password) => {
      const instance = getStorage(password);
      if (instance) {
        try {
          return hash(password) === instance.get(PASSWORD);
        } catch (e) {
          return false;
        }
      }
      return false;
    },
    [getStorage]
  );

  const setWalletRoot = useCallback(
    ({ password, phrase, root, child }) => {
      const instance = getStorage(password);

      if (instance) {
        instance.setItem(PHRASE, phrase);
        instance.setItem(ROOT_KEY, root);
        instance.setItem(`${CHILD_KEY}0`, child);
        return instance;
      }

      return null;
    },
    [getStorage]
  );

  const getStorage = useCallback(
    (password) => {
      if (checkPassword(password)) {
        return storage.current;
      }
      return null;
    },
    [checkPassword]
  );

  return {
    setPassword,
    checkPassword,
    getStorage,
    setWalletRoot,
  };
};
