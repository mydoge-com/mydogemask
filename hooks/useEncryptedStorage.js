import { useCallback, useRef } from 'react';
import SecureLS from 'secure-ls';

const PASSWORD = '@mydoge_PASSWORD';
const WALLET = '@mydoge_WALLET';

const CryptoJS = require('crypto-js');

export const hash = (password) => {
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
      const instance = getInstance();
      try {
        return hash(password) === instance.get(PASSWORD);
      } catch (e) {
        return false;
      }
    },
    [getInstance]
  );

  const setWallet = useCallback(
    ({ phrase, priv, pub, addr, password }) => {
      const instance = getInstance(password);
      instance.set(WALLET, { phrase, priv, pub, addr });
    },
    [getInstance]
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

  // const setOnboardingComplete = useCallback((status) => {
  //   new SecureLS().set(ONBOARDING_COMPLETE, status);
  // }, []);

  // const getOnboardingComplete = useCallback(() => {
  //   return new SecureLS().get(ONBOARDING_COMPLETE);
  // }, []);

  return {
    setPassword,
    checkPassword,
    getStorage,
    setWallet,
  };
};
