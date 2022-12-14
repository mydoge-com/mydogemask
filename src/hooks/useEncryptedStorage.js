import { EncryptStorage } from 'encrypt-storage';
import { useCallback, useRef } from 'react';

const PASSWORD = 'PASSWORD';
const WALLET = 'WALLET';

export const useEncryptedStorage = () => {
  const storage = useRef(null);

  const getInstance = useCallback((password) => {
    if (storage.current == null) {
      storage.current = new EncryptStorage(password, { prefix: '@mydoge' });
    }
    return storage.current;
  }, []);

  const setPassword = useCallback(
    (password) => {
      const instance = getInstance(password);
      instance.setItem(PASSWORD, instance.hash(password));
    },
    [getInstance]
  );

  const checkPassword = useCallback(
    (password) => {
      const instance = getInstance(password);
      return instance.hash(password) === instance.getItem(PASSWORD);
    },
    [getInstance]
  );

  const setWallet = useCallback(
    ({ phrase, priv, pub, addr, password }) => {
      const instance = getInstance(password);
      instance.setItem(WALLET, { phrase, priv, pub, addr });
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

  return { setPassword, checkPassword, getStorage, setWallet };
};