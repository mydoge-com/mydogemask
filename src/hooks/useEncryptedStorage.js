import { EncryptStorage } from 'encrypt-storage';
import { useCallback, useRef } from 'react';

const PASSWORD = 'PASSWORD';
const PHRASE = 'PHRASE';
const ROOT_KEY = 'ROOT_KEY';
// const CHILD_KEY = 'CHILD_KEY_';

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

  const setWalletRoot = useCallback(
    ({ phrase, root, password }) => {
      const instance = getInstance(password);
      instance.setItem(PHRASE, phrase);
      instance.setItem(ROOT_KEY, root);
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

  return { setPassword, checkPassword, getStorage, setWalletRoot };
};
