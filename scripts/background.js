import { logError } from '../utils/error';
import { nownodes } from './api';
import { decrypt, encrypt, hash } from './helpers/cipher';
import {
  AUTHENTICATED,
  CONNECTED_CLIENTS,
  MESSAGE_TYPES,
  ONBOARDING_COMPLETE,
  PASSWORD,
  WALLET,
} from './helpers/constants';
import { addListener } from './helpers/message';
import {
  clearSessionStorage,
  getLocalValue,
  getSessionValue,
  removeLocalValue,
  setLocalValue,
  setSessionValue,
} from './helpers/storage';
import {
  generateAddress,
  generateChild,
  generatePhrase,
  generateRoot,
} from './helpers/wallet';

const TRANSACTION_PAGE_SIZE = 10;

// onRequestTransaction: Launch notification popup
function onRequestTransaction({ data = {}, sendResponse } = {}) {
  chrome.windows.getCurrent((w) => {
    const width = 360;
    const height = 540;
    chrome.windows.create(
      {
        url: `notification.html?amount=${data.amount}`,
        type: 'popup',
        width,
        height,
        left: w.width + w.left - width,
        top: w.top,
      },
      (newWindow) => {
        console.log(
          `can use ${newWindow.id} to set up listener for transaction success/fail maybe?`
        );
        if (sendResponse) sendResponse('success');
      }
    );
  });
}

// Generates a seed phrase, root keypair, child keypair + address 0
// Encrypt + store the private data and address
function onCreateWallet({ data = {}, sendResponse } = {}) {
  if (data.password) {
    const phrase = data.seedPhrase ?? generatePhrase();
    const root = generateRoot(phrase);
    const child = generateChild(root, 0);
    const address0 = generateAddress(child);

    const wallet = {
      phrase,
      root: root.toWIF(),
      children: [child.toWIF()],
      addresses: [address0],
    };

    const encryptedPassword = encrypt({
      data: hash(data.password),
      password: data.password,
    });
    const encryptedWallet = encrypt({
      data: wallet,
      password: data.password,
    });

    Promise.all([
      setLocalValue({
        [PASSWORD]: encryptedPassword,
        [WALLET]: encryptedWallet,
        [ONBOARDING_COMPLETE]: true,
      }),
      setSessionValue({
        [AUTHENTICATED]: true,
        [WALLET]: wallet,
        [PASSWORD]: data.password,
      }),
    ])
      .then(() => {
        sendResponse?.({ authenticated: true, wallet });
      })
      .catch(() => sendResponse?.(false));
  } else {
    sendResponse?.(false);
  }
  return true;
}

function onGetDogecoinPrice({ sendResponse } = {}) {
  nownodes
    .get('/tickers/?currency=usd')
    .json((response) => {
      sendResponse?.(response.rates);
    })
    .catch((err) => {
      logError(err);
      sendResponse?.(false);
    });
  return true;
}

function onGetAddressBalance({ data, sendResponse } = {}) {
  if (data.addresses) {
    Promise.all(
      data.addresses.map((address) =>
        nownodes.get(`/address/${address}`).json((response) => response.balance)
      )
    )
      .then((balances) => {
        sendResponse?.(balances);
      })
      .catch((err) => {
        logError(err);
        sendResponse?.(false);
      });

    return true;
  }
  nownodes
    .get(`/address/${data.address}`)
    .json((response) => {
      sendResponse?.(response.balance);
    })
    .catch((err) => {
      logError(err);
      sendResponse?.(false);
    });
  return true;
}

async function onGetTransactions({ data, sendResponse } = {}) {
  // Get txids
  let txIds = [];
  let totalPages;
  let page;

  nownodes
    .get(
      `/address/${data.address}?page=${
        data.page || 1
      }&pageSize=${TRANSACTION_PAGE_SIZE}`
    )
    .json((response) => {
      txIds = response.txids;
      totalPages = response.totalPages;
      page = response.page;
    })
    // Get tx details
    .then(async () => {
      if (!txIds?.length) {
        sendResponse?.({ transactions: [], totalPages, page });
        return;
      }
      const transactions = (
        await Promise.all(
          txIds.map((txId) => nownodes.get(`/tx/${txId}`).json())
        )
      ).sort((a, b) => b.blockTime - a.blockTime);
      sendResponse?.({ transactions, totalPages, page });
    })
    .catch((err) => {
      logError(err);
      sendResponse?.(false);
    });
  return true;
}

function onGenerateAddress({ sendResponse } = {}) {
  Promise.all([getLocalValue(WALLET), getSessionValue(PASSWORD)]).then(
    ([wallet, password]) => {
      const decryptedWallet = decrypt({
        data: wallet,
        password,
      });
      if (!decryptedWallet) {
        sendResponse?.(false);
        return;
      }
      const root = generateRoot(decryptedWallet.phrase);
      const child = generateChild(root, decryptedWallet.children.length);
      const address = generateAddress(child);
      decryptedWallet.children.push(child.toWIF());
      decryptedWallet.addresses.push(address);
      const encryptedWallet = encrypt({
        data: decryptedWallet,
        password,
      });
      Promise.all([
        setSessionValue({ [WALLET]: decryptedWallet }),
        setLocalValue({
          [WALLET]: encryptedWallet,
        }),
      ])
        .then(() => {
          sendResponse?.({ wallet: decryptedWallet });
        })
        .catch(() => sendResponse?.(false));
    }
  );
  return true;
}

// Open the extension popup window for thew user to approve a connection request, passing url params so the popup knows the origin of the connection request
function onConnectionRequest({ sendResponse, sender } = {}) {
  chrome.windows
    .create({
      url: `index.html?originTabId=${sender.tab.id}&origin=${sender.origin}#connect`,
      type: 'popup',
    })
    .then((tab) => {
      if (tab) {
        sendResponse?.({ originTabId: sender.tab.id });
      } else {
        sendResponse?.(false);
      }
    });
  return true;
}

// Handle the user's response to the connection request popup and send a message to the content script with the response
async function onApproveConnection({
  sendResponse,
  data: { approved, selectedAddressIndex, originTabId, origin },
} = {}) {
  if (approved) {
    const connectedClients = (await getSessionValue(CONNECTED_CLIENTS)) || [];
    setSessionValue({
      [CONNECTED_CLIENTS]: {
        ...connectedClients,
        [origin]: { selectedAddressIndex, originTabId, origin },
      },
    });
    chrome.tabs.sendMessage(originTabId, {
      type: MESSAGE_TYPES.APPROVE_CONNECTION,
      data: {
        connected: true,
      },
      origin,
    });
    sendResponse(true);
  } else {
    chrome.tabs.sendMessage(originTabId, {
      type: MESSAGE_TYPES.APPROVE_CONNECTION,
      data: {
        connected: false,
      },
    });
    sendResponse(false);
  }
  return true;
}

function onDeleteAddress({ sendResponse, data } = {}) {
  Promise.all([getLocalValue(WALLET), getSessionValue(PASSWORD)]).then(
    ([wallet, password]) => {
      const decryptedWallet = decrypt({
        data: wallet,
        password,
      });
      if (!decryptedWallet) {
        sendResponse?.(false);
        return;
      }

      decryptedWallet.addresses.splice(data.index, 1);
      const encryptedWallet = encrypt({
        data: decryptedWallet,
        password,
      });
      Promise.all([
        setSessionValue({ [WALLET]: decryptedWallet }),
        setLocalValue({
          [WALLET]: encryptedWallet,
        }),
      ])
        .then(() => {
          sendResponse?.({ wallet: decryptedWallet });
        })
        .catch(() => sendResponse?.(false));
    }
  );
  return true;
}

function onDeleteWallet({ sendResponse } = {}) {
  Promise.all([
    clearSessionStorage(),
    removeLocalValue([PASSWORD, WALLET, ONBOARDING_COMPLETE]),
  ])
    .then(() => {
      sendResponse?.(true);
    })
    .catch(() => sendResponse?.(false));
  return true;
}

function onAuthenticate({ data = {}, sendResponse } = {}) {
  Promise.all([getLocalValue(PASSWORD), getLocalValue(WALLET)]).then(
    ([encryptedPass, encryptedWallet]) => {
      const decryptedPass = decrypt({
        data: encryptedPass,
        password: data.password,
      });

      const decryptedWallet = decrypt({
        data: encryptedWallet,
        password: data.password,
      });
      const authenticated = decryptedPass === hash(data.password);
      if (authenticated) {
        setSessionValue({
          [AUTHENTICATED]: true,
          [WALLET]: decryptedWallet,
          [PASSWORD]: data.password,
        });
      }
      sendResponse?.({ authenticated, wallet: decryptedWallet });
    }
  );
  return true;
}

function getOnboardingStatus({ sendResponse } = {}) {
  getLocalValue(ONBOARDING_COMPLETE).then((value) => {
    sendResponse?.(!!value);
  });
}

function getAuthStatus({ sendResponse } = {}) {
  Promise.all([getSessionValue(AUTHENTICATED), getSessionValue(WALLET)]).then(
    ([authenticated, wallet]) => {
      sendResponse?.({ authenticated, wallet });
    }
  );
}

function signOut({ sendResponse } = {}) {
  clearSessionStorage().then(() => sendResponse?.(true));
}

export const messageHandler = ({ message, data }, sender, sendResponse) => {
  if (!message) return;
  switch (message) {
    case MESSAGE_TYPES.REQUEST_TRANSACTION:
      onRequestTransaction({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.CREATE_WALLET:
    case MESSAGE_TYPES.RESET_WALLET:
      onCreateWallet({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.AUTHENTICATE:
      onAuthenticate({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.IS_ONBOARDING_COMPLETE:
      getOnboardingStatus({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.IS_SESSION_AUTHENTICATED:
      getAuthStatus({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.SIGN_OUT:
      signOut({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.DELETE_WALLET:
      onDeleteWallet({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.GENERATE_ADDRESS:
      onGenerateAddress({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.DELETE_ADDRESS:
      onDeleteAddress({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.GET_DOGECOIN_PRICE:
      onGetDogecoinPrice({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.GET_ADDRESS_BALANCE:
      onGetAddressBalance({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.GET_TRANSACTIONS:
      onGetTransactions({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.CONNECTION_REQUEST:
      onConnectionRequest({ sender, sendResponse, data });
      break;
    case MESSAGE_TYPES.APPROVE_CONNECTION:
      onApproveConnection({ sender, sendResponse, data });
      break;
    default:
  }
  return true;
};

// Listen for messages from the popup
addListener(messageHandler);
