import { EncryptStorage } from 'encrypt-storage';
import { useCallback, useRef } from 'react';

// Example of secret_key variable in an .env file
// const encryptStorage = new EncryptStorage(process.env.SECRET_KEY, options);
// export const encryptStorage = new EncryptStorage('secret-key-value', options);

const PASSWORD = 'PASSWORD';

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

  return { setPassword, checkPassword };
};
