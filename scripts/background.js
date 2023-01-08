import { decrypt, encrypt, hash } from './helpers/cipher';
import {
  AUTHENTICATED,
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
    case 'requestTransaction':
      onRequestTransaction({ data, sendResponse });
      break;
    case 'createWallet':
    case 'resetWallet':
      onCreateWallet({ data, sendResponse });
      break;
    case 'authenticate':
      onAuthenticate({ data, sendResponse });
      break;
    case 'isOnboardingComplete':
      getOnboardingStatus({ sendResponse });
      break;
    case 'isSessionAuthenticated':
      getAuthStatus({ sendResponse });
      break;
    case 'signOut':
      signOut({ sendResponse });
      break;
    case 'deleteWallet':
      onDeleteWallet({ sendResponse });
      break;
    case 'generateAddress':
      onGenerateAddress({ sendResponse });
      break;
    case 'deleteAddress':
      onDeleteAddress({ data, sendResponse });
      break;
    default:
  }
  return true;
};

// Listen for messages from the popup
addListener(messageHandler);
