import { MESSAGE_TYPES } from './constants';
import { sendMessage } from './message';

export const getConnectedClient = (origin) => {
  return new Promise((resolve, reject) => {
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_CONNECTED_CLIENTS,
      },
      (connectedClients) => {
        if (!origin) {
          resolve(connectedClients);
          return;
        }
        const client = connectedClients?.[origin];
        if (client) {
          resolve(client);
        } else {
          reject(new Error('MyDogeMask is not connected to this website'));
        }
      }
    );
  });
};

export const getConnectedAddressIndex = (origin) => {
  return new Promise((resolve, reject) => {
    Promise.all([getWallet(), getConnectedClient(origin)])
      .then(([wallet, client]) => {
        const addressIndex = wallet.addresses.indexOf(client.address);
        if (addressIndex !== -1) {
          resolve(addressIndex);
        } else {
          reject(new Error('Unable to get address index'));
        }
      })
      .catch((e) => {
        reject(e);
      });
  });
};

export const getWallet = () => {
  return new Promise((resolve, reject) => {
    sendMessage(
      {
        message: MESSAGE_TYPES.IS_SESSION_AUTHENTICATED,
      },
      ({ wallet }) => {
        if (wallet) {
          resolve(wallet);
        } else {
          reject(new Error('Unable to get wallet'));
        }
      }
    );
  });
};

export const getAddressBalance = (address) => {
  return new Promise((resolve, reject) => {
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_ADDRESS_BALANCE,
        data: { address },
      },
      (balance) => {
        if (balance) {
          resolve(balance);
        } else {
          reject(new Error('Unable to get address balance'));
        }
      }
    );
  });
};
