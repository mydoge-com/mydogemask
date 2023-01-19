import sb from 'satoshi-bitcoin';

import { logError } from '../utils/error';
import { node, nownodes } from './api';
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

const TRANSACTION_PAGE_SIZE = 10;

// Build a raw transaction and determine fee
function onCreateTransaction({ data = {}, sendResponse } = {}) {
  const amountSatoshi = sb.toSatoshi(data.dogeAmount);
  const amount = sb.toBitcoin(amountSatoshi);
  const jsonrpcReq = {
    API_key: process.env.NEXT_PUBLIC_NOWNODES_API_KEY,
    jsonrpc: '2.0',
    id: `${data.senderAddress}_${Date.now()}`,
    method: 'createrawtransaction',
    params: [
      [],
      {
        [data.recipientAddress]: amount,
      },
    ],
  };

  nownodes
    .get(`/utxo/${data.senderAddress}`)
    .json((response) => {
      // Sort by smallest + oldest
      const utxos = response.sort((a, b) => {
        const aValue = sb.toBitcoin(a.value);
        const bValue = sb.toBitcoin(b.value);
        return aValue > bValue ? 1 : aValue < bValue ? -1 : a.height - b.height;
      });

      const feePerInput = 0.0012; // estimate fee per input
      let fee = feePerInput;
      let total = 0;

      for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i];
        const value = sb.toBitcoin(utxo.value);
        total += value;
        fee = feePerInput * (i + 1);

        jsonrpcReq.params[0].push({
          txid: utxo.txid,
          vout: utxo.vout,
        });

        if (total >= amount + fee) {
          break;
        }
      }
      // Set a dummy amount in the change address
      jsonrpcReq.params[1][data.senderAddress] = feePerInput;
      // console.log('estimated fee', fee);
      // Get the raw transaction to determine actual size
      return node.post(jsonrpcReq).json((estimateRes) => {
        const size = estimateRes.result.length / 2;
        // console.log('estimated size', size);
        fee = Math.max(
          parseFloat(((size / 1000) * 0.01).toFixed(8)),
          feePerInput
        );
        // console.log('calculated fee', fee);
        // Add change address and amount if enough, otherwise add to fee
        const changeSatoshi =
          sb.toSatoshi(total) - sb.toSatoshi(amount) - sb.toSatoshi(fee);

        if (changeSatoshi >= 0) {
          const changeAmount = sb.toBitcoin(changeSatoshi);
          if (changeAmount > feePerInput) {
            jsonrpcReq.params[1][data.senderAddress] = changeAmount;
          } else {
            delete jsonrpcReq.params[1][data.senderAddress];
            fee += changeAmount;
          }
        } else {
          delete jsonrpcReq.params[1][data.senderAddress];
          // All inputs can't cover fee, send max
          jsonrpcReq.params[1][data.recipientAddress] = sb.toBitcoin(
            sb.toSatoshi(amount) - sb.toSatoshi(fee)
          );
        }
        // console.log('createrawtransaction req', jsonrpcReq);
        // Return the raw tx and the fee
        node.post(jsonrpcReq).json((jsonrpcRes) => {
          // console.log('actual size', jsonrpcRes.result.length / 2);
          // console.log('raw tx', jsonrpcRes.result);
          sendResponse?.({
            rawTx: jsonrpcRes.result,
            fee,
            amount: jsonrpcReq.params[1][data.recipientAddress],
          });
        });
      });
    })
    .catch((err) => {
      logError(err);
      sendResponse?.(false);
    });
}

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
      decryptedWallet.children.splice(data.index, 1);
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
    case 'createTransaction':
      onCreateTransaction({ data, sendResponse });
      break;
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
    case 'getDogecoinPrice':
      onGetDogecoinPrice({ sendResponse });
      break;
    case 'getAddressBalance':
      onGetAddressBalance({ data, sendResponse });
      break;
    case 'getTransactions':
      onGetTransactions({ data, sendResponse });
      break;
    default:
  }
  return true;
};

// Listen for messages from the popup
addListener(messageHandler);
