import { MESSAGE_TYPES } from './helpers/constants';
import {
  getAddressBalance,
  getConnectedAddressIndex,
  getConnectedClient,
} from './helpers/data';
import { getDRC20Balances, getDRC20Inscriptions } from './helpers/doginals';

(() => {
  // Inject doge API to all websites
  function injectScript(filePath, tag) {
    const node = document.getElementsByTagName(tag)[0];
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', filePath);
    node.appendChild(script);
  }

  injectScript(chrome.runtime.getURL('scripts/inject-script.js'), 'body');

  const handleError = ({ errorMessage, origin, messageType }) => {
    window.postMessage(
      {
        type: messageType,
        error: errorMessage,
      },
      origin
    );
  };

  // Handle connection requests from injected script by sending a message to the background script. The background script will handle the connection request and send a response back to the content script.
  function onRequestConnection({ data, origin }) {
    chrome.runtime.sendMessage(
      {
        message: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION,
        data,
      },
      (response) => {
        if (!response) {
          handleError({
            errorMessage: 'Unable to connect to MyDoge',
            origin,
            messageType: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION_RESPONSE,
          });
        }
      }
    );
  }

  async function onGetBalance({ origin }) {
    let client;
    let balance;
    try {
      client = await getConnectedClient(origin);
      balance = await getAddressBalance(client?.address);
    } catch (e) {
      handleError({
        errorMessage: e.message,
        origin,
        messageType: MESSAGE_TYPES.CLIENT_GET_BALANCE_RESPONSE,
      });
      return;
    }
    if (client && balance) {
      window.postMessage(
        {
          type: MESSAGE_TYPES.CLIENT_GET_BALANCE_RESPONSE,
          data: {
            balance,
            address: client.address,
          },
        },
        origin
      );
    }
  }

  async function onGetDRC20Balance({ origin, data }) {
    let client;
    let availableBalance = '0';
    let transferableBalance = '0';

    try {
      client = await getConnectedClient(origin);
      const balances = [];
      await getDRC20Balances(client?.address, 0, balances);
      const balance = balances.find((ins) => ins.ticker === data.ticker);

      if (balance) {
        availableBalance = balance.availableBalance;
        transferableBalance = balance.transferableBalance;
      }
    } catch (e) {
      handleError({
        errorMessage: e.message,
        origin,
        messageType: MESSAGE_TYPES.CLIENT_GET_DRC20_BALANCE_RESPONSE,
      });
      return;
    }
    if (client) {
      window.postMessage(
        {
          type: MESSAGE_TYPES.CLIENT_GET_DRC20_BALANCE_RESPONSE,
          data: {
            availableBalance,
            transferableBalance,
            ticker: data.ticker,
            address: client.address,
          },
        },
        origin
      );
    }
  }

  async function onGetTransferableDRC20({ origin, data }) {
    let client;
    const inscriptions = [];

    try {
      client = await getConnectedClient(origin);
      await getDRC20Inscriptions(client?.address, data.ticker, 0, inscriptions);
    } catch (e) {
      handleError({
        errorMessage: e.message,
        origin,
        messageType: MESSAGE_TYPES.CLIENT_GET_TRANSFERABLE_DRC20_RESPONSE,
      });
      return;
    }

    if (client) {
      window.postMessage(
        {
          type: MESSAGE_TYPES.CLIENT_GET_TRANSFERABLE_DRC20_RESPONSE,
          data: {
            inscriptions,
            ticker: data.ticker,
            address: client.address,
          },
        },
        origin
      );
    }
  }

  async function onGetConnectionStatus({ origin }) {
    try {
      const client = await getConnectedClient(origin);
      if (client) {
        window.postMessage(
          {
            type: MESSAGE_TYPES.CLIENT_CONNECTION_STATUS_RESPONSE,
            data: {
              connected: true,
              address: client.address,
            },
          },
          origin
        );
      } else {
        throw new Error('MyDoge is not connected to this website');
      }
    } catch (e) {
      handleError({
        errorMessage: e.message,
        origin,
        messageType: MESSAGE_TYPES.CLIENT_CONNECTION_STATUS_RESPONSE,
      });
    }
  }

  async function onGetTransactionStatus({ origin, data }) {
    try {
      const client = await getConnectedClient(origin);
      if (client) {
        chrome.runtime.sendMessage(
          {
            message: MESSAGE_TYPES.GET_TRANSACTION_DETAILS,
            data: { txId: data.txId },
          },
          (transaction) => {
            if (transaction) {
              window.postMessage(
                {
                  type: MESSAGE_TYPES.CLIENT_TRANSACTION_STATUS_RESPONSE,
                  data: {
                    txId: transaction.txid,
                    confirmations: transaction.confirmations,
                    status:
                      transaction.confirmations > 0 ? 'confirmed' : 'pending',
                    dogeAmount: transaction.vout[0].value,
                    blockTime: transaction.blockTime,
                    address: transaction.vout[0].addresses[0],
                  },
                },
                origin
              );
            } else {
              throw new Error('Unable to get transaction details');
            }
          }
        );
      }
    } catch (e) {
      handleError({
        errorMessage: e.message,
        origin,
        messageType: MESSAGE_TYPES.CLIENT_TRANSACTION_STATUS_RESPONSE,
      });
    }
  }

  async function onDisconnectClient({ origin }) {
    try {
      chrome.runtime.sendMessage(
        {
          message: MESSAGE_TYPES.CLIENT_DISCONNECT,
          data: { origin },
        },
        () => {
          window.postMessage(
            {
              type: MESSAGE_TYPES.CLIENT_DISCONNECT_RESPONSE,
              data: {
                disconnected: true,
              },
            },
            origin
          );
        }
      );
    } catch (e) {
      handleError({
        errorMessage: e.message,
        origin,
        messageType: MESSAGE_TYPES.CLIENT_DISCONNECT_RESPONSE,
      });
    }
  }

  async function onRequestTransaction({ origin, data }) {
    try {
      await getConnectedClient(origin);

      chrome.runtime.sendMessage({
        message: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION,
        data,
      });
    } catch (e) {
      handleError({
        errorMessage: e.message,
        origin,
        messageType: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE,
      });
    }
  }

  async function onRequestDoginalTransaction({ origin, data }) {
    try {
      await getConnectedClient(origin);

      chrome.runtime.sendMessage({
        message: MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION,
        data,
      });
    } catch (e) {
      handleError({
        errorMessage: e.message,
        origin,
        messageType: MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE,
      });
    }
  }

  async function onRequestAvailableDRC20Transaction({ origin, data }) {
    try {
      await getConnectedClient(origin);

      chrome.runtime.sendMessage({
        message: MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION,
        data,
      });
    } catch (e) {
      handleError({
        errorMessage: e.message,
        origin,
        messageType: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE,
      });
    }
  }

  async function onRequestPsbt({ origin, data }) {
    try {
      chrome.runtime.sendMessage({
        message: MESSAGE_TYPES.CLIENT_REQUEST_PSBT,
        data,
      });
    } catch (e) {
      handleError({
        errorMessage: e.message,
        origin,
        messageType: MESSAGE_TYPES.CLIENT_REQUEST_PSBT_RESPONSE,
      });
    }
  }

  async function onRequestSignedMessage({ origin, data }) {
    try {
      const selectedAddressIndex = await getConnectedAddressIndex(origin);

      chrome.runtime.sendMessage({
        message: MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE,
        data: {
          ...data,
          selectedAddressIndex,
          message: data.message,
        },
      });
    } catch (e) {
      handleError({
        errorMessage: e.message,
        origin,
        messageType: MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE_RESPONSE,
      });
    }
  }

  // Listen to messages from injected script and pass to the respective handler functions tro forward to the background script
  window.addEventListener(
    'message',
    ({ source, data: { type, data } }) => {
      // only accept messages from the current tab
      if (source !== window) return;

      switch (type) {
        case MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION:
          onRequestConnection({ origin: source.origin });
          break;
        case MESSAGE_TYPES.CLIENT_GET_BALANCE:
          onGetBalance({ origin: source.origin });
          break;
        case MESSAGE_TYPES.CLIENT_GET_DRC20_BALANCE:
          onGetDRC20Balance({ origin: source.origin, data });
          break;
        case MESSAGE_TYPES.CLIENT_GET_TRANSFERABLE_DRC20:
          onGetTransferableDRC20({ origin: source.origin, data });
          break;
        case MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION:
          onRequestTransaction({ origin: source.origin, data });
          break;
        case MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION:
          onRequestDoginalTransaction({ origin: source.origin, data });
          break;
        case MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION:
          onRequestAvailableDRC20Transaction({ origin: source.origin, data });
          break;
        case MESSAGE_TYPES.CLIENT_REQUEST_PSBT:
          onRequestPsbt({ origin: source.origin, data });
          break;
        case MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE:
          onRequestSignedMessage({ origin: source.origin, data });
          break;
        case MESSAGE_TYPES.CLIENT_DISCONNECT:
          onDisconnectClient({ origin: source.origin });
          break;
        case MESSAGE_TYPES.CLIENT_CONNECTION_STATUS:
          onGetConnectionStatus({ origin: source.origin });
          break;
        case MESSAGE_TYPES.CLIENT_TRANSACTION_STATUS:
          onGetTransactionStatus({ origin: source.origin, data });
          break;
        default:
      }
    },
    false
  );

  // Listen to messages from the background script and pass to the injected script
  chrome.runtime.onMessage.addListener(
    ({ type, data, error, origin }, sender) => {
      // Confirm that message is coming from the extension
      if (sender.id !== chrome.runtime.id) return;
      // Pass message to injected script
      window.postMessage({ type, data, error }, origin);
    }
  );
})();
