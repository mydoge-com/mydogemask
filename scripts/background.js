import { decrypt, encrypt, hash } from './helpers/cipher';
import {
  AUTHENTICATED,
  ONBOARDING_COMPLETE,
  PASSWORD,
  WALLET,
} from './helpers/constants';
import { addListener } from './helpers/message';
import {
  getLocalValue,
  getSessionValue,
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
      setSessionValue({ [AUTHENTICATED]: true }),
    ])
      .then(() => {
        sendResponse?.(true);
      })
      .catch(() => sendResponse?.(false));
  } else {
    sendResponse?.(false);
  }
  return true;
}

function onAuthenticate({ data = {}, sendResponse } = {}) {
  getLocalValue(PASSWORD, (encryptedPass) => {
    const decryptedPass = decrypt({
      data: encryptedPass,
      password: data.password,
    });
    const authenticated = decryptedPass === hash(data.password);
    if (authenticated) {
      setSessionValue({ [AUTHENTICATED]: true });
    }
    sendResponse?.(authenticated);
  });
  return true;
}

function getOnboardingComplete({ sendResponse } = {}) {
  getLocalValue(ONBOARDING_COMPLETE, (value) => {
    sendResponse?.(!!value);
  });
}

function getAuthenticated({ sendResponse } = {}) {
  getSessionValue(AUTHENTICATED, (value) => {
    sendResponse?.(!!value);
  });
}

export const messageHandler = ({ message, data }, sender, sendResponse) => {
  if (!message) return;
  switch (message) {
    case 'requestTransaction':
      onRequestTransaction({ data, sendResponse });
      break;
    case 'createWallet':
      onCreateWallet({ data, sendResponse });
      break;
    case 'resetWallet':
      onCreateWallet({ data, sendResponse });
      break;
    case 'authenticate':
      onAuthenticate({ data, sendResponse });
      break;
    case 'isOnboardingComplete':
      getOnboardingComplete({ data, sendResponse });
      break;
    case 'isAuthenticated':
      getAuthenticated({ data, sendResponse });
      break;
    default:
  }
  return true;
};

// Listen for messages from the popup
addListener(messageHandler);
