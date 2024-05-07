import {
  Address,
  // Opcode,
  // PrivateKey,
  // Script,
  Transaction,
} from 'bitcore-lib-doge';
import sb from 'satoshi-bitcoin';

// import { MIN_TX_AMOUNT } from '../constants/Doge';
import { logError } from '../utils/error';
import { apiKey, dogechain, node, nownodes } from './api';
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
  signRawTx,
} from './helpers/wallet';

const TRANSACTION_PAGE_SIZE = 10;

// Build a raw transaction and determine fee
function onCreateTransaction({ data = {}, sendResponse } = {}) {
  const amountSatoshi = sb.toSatoshi(data.dogeAmount);
  const amount = sb.toBitcoin(amountSatoshi);
  // const jsonrpcReq = {
  //   API_key: apiKey,
  //   jsonrpc: '2.0',
  //   id: `${data.senderAddress}_create_${Date.now()}`,
  //   method: 'createrawtransaction',
  //   params: [
  //     [],
  //     {
  //       [data.recipientAddress]: amount,
  //     },
  //   ],
  // };

  dogechain
    .get(`https://dogechain.info/api/v1/address/unspent/${data.seenderAddress}`)
    .json((response) => {
      // Fetch utxos
      const utxos = response.data.unspent_outputs.map((output) => {
        return {
          txid: output.tx_hash,
          vout: output.tx_output_n,
          script: output.script,
          satoshis: output.value,
        };
      });

      // estimate fee
      const smartfeeReq = {
        API_key: apiKey,
        jsonrpc: '2.0',
        id: `${data.senderAddress}_estimatesmartfee_${Date.now()}`,
        method: 'estimatesmartfee',
        params: [2], // confirm within x blocks
      };

      node.post(smartfeeReq).json((feeData) => {
        console.log('smartfee data', feeData);

        const tx = new Transaction();
        tx.setFeePerKb(sb.toSatoshi(feeData.result.feerate));
        tx.to(new Address(data.recipientAddress), amountSatoshi);
        tx.change(data.senderAddress);

        delete tx._fee;

        for (let i = 0; i < utxos.length; i++) {
          const utxo = utxos[i];

          if (
            tx.inputs.length &&
            tx.outputs.length &&
            tx.inputAmount >= tx.outputAmount + tx.getFee()
          ) {
            break;
          }

          delete tx._fee;
          tx.from(utxo);
          tx.change(data.senderAddress);
        }

        if (tx.inputAmount < tx.outputAmount + tx.getFee()) {
          throw new Error('not enough funds');
        }

        console.log('tx', tx.toObject());

        sendResponse?.({
          rawTx: tx.serialize(),
          fee: sb.toBitcoin(tx.getFee()),
          amount,
        });
      });
    })
    .catch((err) => {
      logError(err);
      sendResponse?.(false);
    });

  // nownodes
  //   .get(`/utxo/${data.senderAddress}`)
  //   .json((response) => {
  //     // Sort by smallest + oldest
  //     const utxos = response.sort((a, b) => {
  //       const aValue = sb.toBitcoin(a.value);
  //       const bValue = sb.toBitcoin(b.value);
  //       return aValue > bValue ? 1 : aValue < bValue ? -1 : a.height - b.height;
  //     });

  //     // estimate fee
  //     const smartfeeReq = {
  //       API_key: apiKey,
  //       jsonrpc: '2.0',
  //       id: `${data.senderAddress}_estimatesmartfee_${Date.now()}`,
  //       method: 'estimatesmartfee',
  //       params: [2], // confirm within x blocks
  //     };
  //     node.post(smartfeeReq).json((feeData) => {
  //       console.log('smartfee data', feeData);
  //     });

  //     // console.log('smart fee', feeData.result.feerate)
  //     const feePerInput = 0.0012; // estimate fee per input
  //     let fee = feePerInput;
  //     let total = 0;

  //     for (let i = 0; i < utxos.length; i++) {
  //       const utxo = utxos[i];
  //       const value = sb.toBitcoin(utxo.value);
  //       total += value;
  //       fee = feePerInput * (i + 1);

  //       jsonrpcReq.params[0].push({
  //         txid: utxo.txid,
  //         vout: utxo.vout,
  //       });

  //       if (total >= amount + fee) {
  //         break;
  //       }
  //     }
  //     // Set a dummy amount in the change address
  //     jsonrpcReq.params[1][data.senderAddress] = feePerInput;
  //     // console.log('estimated fee', fee);
  //     // Get the raw transaction to determine actual size
  //     return node.post(jsonrpcReq).json((estimateRes) => {
  //       const size = estimateRes.result.length / 2;
  //       // console.log('estimated size', size);
  //       fee = Math.max(
  //         parseFloat(((size / 1000) * 0.01).toFixed(8)),
  //         feePerInput
  //       );
  //       // console.log('calculated fee', fee);
  //       // Add change address and amount if enough, otherwise add to fee
  //       const changeSatoshi = Math.trunc(
  //         sb.toSatoshi(total) - sb.toSatoshi(amount) - sb.toSatoshi(fee)
  //       );
  //       // console.log('calculated change', changeSatoshi);
  //       if (changeSatoshi >= 0) {
  //         const changeAmount = sb.toBitcoin(changeSatoshi);
  //         if (changeAmount >= MIN_TX_AMOUNT) {
  //           jsonrpcReq.params[1][data.senderAddress] = changeAmount;
  //         } else {
  //           delete jsonrpcReq.params[1][data.senderAddress];
  //           fee += changeAmount;
  //         }
  //       } else {
  //         delete jsonrpcReq.params[1][data.senderAddress];
  //         // All inputs can't cover fee, send max
  //         jsonrpcReq.params[1][data.recipientAddress] = sb.toBitcoin(
  //           sb.toSatoshi(amount) - sb.toSatoshi(fee)
  //         );
  //       }
  //       // console.log('createrawtransaction req', jsonrpcReq);
  //       // Return the raw tx and the fee
  //       node.post(jsonrpcReq).json((jsonrpcRes) => {
  //         // console.log('actual size', jsonrpcRes.result.length / 2);
  //         // console.log('raw tx', jsonrpcRes.result);
  //         sendResponse?.({
  //           rawTx: jsonrpcRes.result,
  //           fee,
  //           amount: jsonrpcReq.params[1][data.recipientAddress],
  //         });
  //       });
  //     });
  //   })
  //   .catch((err) => {
  //     logError(err);
  //     sendResponse?.(false);
  //   });
}

function onSendTransaction({ data = {}, sendResponse } = {}) {
  Promise.all([getLocalValue(WALLET), getSessionValue(PASSWORD)]).then(
    ([wallet, password]) => {
      const decryptedWallet = decrypt({
        data: wallet,
        password,
      });
      if (!decryptedWallet) {
        sendResponse?.(false);
      }
      const signed = signRawTx(
        data.rawTx,
        decryptedWallet.children[data.selectedAddressIndex]
      );

      const jsonrpcReq = {
        API_key: apiKey,
        jsonrpc: '2.0',
        id: `${data.senderAddress}_send_${Date.now()}`,
        method: 'sendrawtransaction',
        params: [signed],
      };
      node
        .post(jsonrpcReq)
        .json((jsonrpcRes) => {
          // Open offscreen notification page to handle transaction status notifications
          chrome.offscreen
            .createDocument({
              url: chrome.runtime.getURL(
                `notification.html/?txId=${jsonrpcRes.result}`
              ),
              reasons: ['BLOBS'],
              justification: 'Handle transaction status notifications',
            })
            .catch(() => {});

          sendResponse(jsonrpcRes.result);
        })
        .catch((err) => {
          logError(err);
          sendResponse?.(false);
        });
    }
  );
}

async function onRequestTransaction({
  data: { recipientAddress, dogeAmount, rawTx, fee } = {},
  sendResponse,
  sender,
} = {}) {
  const isConnected = (await getSessionValue(CONNECTED_CLIENTS))?.[
    sender.origin
  ];
  if (!isConnected) {
    sendResponse?.(false);
    return;
  }
  const params = new URLSearchParams();
  Object.entries({
    originTabId: sender.tab.id,
    origin: sender.origin,
    recipientAddress,
    dogeAmount,
    rawTx,
    fee,
  }).forEach(([key, value]) => {
    params.append(key, value);
  });
  chrome.windows
    .create({
      url: `index.html?${params.toString()}#${
        MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION
      }`,
      type: 'popup',
      width: 357,
      height: 640,
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
      nicknames: { [address0]: 'Address 1' },
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

function onGetTransactionDetails({ data, sendResponse } = {}) {
  nownodes
    .get(`/tx/${data.txId}`)
    .json((transaction) => {
      sendResponse?.(transaction);
    })
    .catch((err) => {
      logError(err);
      sendResponse?.(false);
    });
  return true;
}

function onGenerateAddress({ sendResponse, data } = {}) {
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
      decryptedWallet.nicknames = {
        ...decryptedWallet.nicknames,
        [address]: data.nickname.length
          ? data.nickname
          : `Address ${decryptedWallet.addresses.length}`,
      };
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

function onUpdateAddressNickname({ sendResponse, data } = {}) {
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
      decryptedWallet.nicknames = {
        ...decryptedWallet.nicknames,
        [data.address]: data.nickname,
      };
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

// Open the extension popup window for the user to approve a connection request, passing url params so the popup knows the origin of the connection request
async function onConnectionRequest({ sendResponse, sender } = {}) {
  // Hack for setting the right popup window size. Need to fetch the onboarding status to determine the correct size
  const onboardingComplete = await getLocalValue(ONBOARDING_COMPLETE);
  const params = new URLSearchParams();
  params.append('originTabId', sender.tab.id);
  params.append('origin', sender.origin);
  chrome.windows
    .create({
      url: `index.html?${params.toString()}#${
        MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION
      }`,
      type: 'popup',
      width: onboardingComplete ? 357 : 800,
      height: 640,
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
  data: { approved, address, balance, originTabId, origin, error },
} = {}) {
  if (approved) {
    const connectedClients = (await getSessionValue(CONNECTED_CLIENTS)) || {};
    setSessionValue({
      [CONNECTED_CLIENTS]: {
        ...connectedClients,
        [origin]: { address, originTabId, origin },
      },
    });
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION_RESPONSE,
      data: {
        approved: true,
        address,
        balance,
      },
      origin,
    });
    sendResponse(true);
  } else {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION_RESPONSE,
      error: error || 'User rejected connection request',
      origin,
    });
    sendResponse(false);
  }
  return true;
}

async function onDisconnectClient({ sendResponse, data: { origin } } = {}) {
  const connectedClients = (await getSessionValue(CONNECTED_CLIENTS)) || {};
  delete connectedClients[origin];
  setSessionValue({
    [CONNECTED_CLIENTS]: { ...connectedClients },
  });
  sendResponse(true);

  return true;
}

async function onApproveTransaction({
  sendResponse,
  data: { txId, error, originTabId, origin },
} = {}) {
  if (txId) {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE,
      data: {
        txId,
      },
      origin,
    });
    sendResponse(true);
  } else {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE,
      error,
      origin,
    });
    sendResponse(false);
  }
  return true;
}

async function onGetConnectedClients({ sendResponse } = {}) {
  const connectedClients = (await getSessionValue(CONNECTED_CLIENTS)) || {};
  sendResponse(connectedClients);
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

const TRANSACTION_CONFIRMATIONS = 1;

async function onNotifyTransactionSuccess({ data: { txId } } = {}) {
  try {
    onGetTransactionDetails({
      data: { txId },
      sendResponse: (transaction) => {
        if (transaction?.confirmations >= TRANSACTION_CONFIRMATIONS) {
          chrome.notifications.onClicked.addListener(async (notificationId) => {
            chrome.tabs.create({
              url: `https://sochain.com/tx/DOGE/${notificationId}`,
            });
            await chrome.notifications.clear(notificationId).catch(() => {});
          });
          chrome.notifications.create(txId, {
            type: 'basic',
            title: 'Transaction Confirmed',
            iconUrl: '../assets/mydoge128.png',
            message: `${sb.toBitcoin(transaction.vout[0].value)} DOGE sent to ${
              transaction.vout[0].addresses[0]
            }.`,
          });

          chrome.offscreen.closeDocument().catch(() => {});
        } else if (!transaction) {
          chrome.notifications.create({
            type: 'basic',
            title: 'Transaction Unconfirmed',
            iconUrl: '../assets/mydoge128.png',
            message: `Transaction details could not be retrieved for \`${txId}\`.`,
          });
          chrome.offscreen.closeDocument();
        }
      },
    });
  } catch (e) {
    logError(e);
  }
}

export const messageHandler = ({ message, data }, sender, sendResponse) => {
  if (!message) return;
  switch (message) {
    case MESSAGE_TYPES.CREATE_WALLET:
    case MESSAGE_TYPES.RESET_WALLET:
      onCreateWallet({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.AUTHENTICATE:
      onAuthenticate({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.CREATE_TRANSACTION:
      onCreateTransaction({ data, sendResponse });
      break;
    case MESSAGE_TYPES.SEND_TRANSACTION:
      onSendTransaction({ data, sender, sendResponse });
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
    case MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION:
      onConnectionRequest({ sender, sendResponse, data });
      break;
    case MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION_RESPONSE:
      onApproveConnection({ sender, sendResponse, data });
      break;
    case MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION:
      onRequestTransaction({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE:
      onApproveTransaction({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.GET_CONNECTED_CLIENTS:
      onGetConnectedClients({ sender, sendResponse, data });
      break;
    case MESSAGE_TYPES.CLIENT_DISCONNECT:
      onDisconnectClient({ sender, sendResponse, data });
      break;
    case MESSAGE_TYPES.GET_TRANSACTION_DETAILS:
      onGetTransactionDetails({ sender, sendResponse, data });
      break;
    case MESSAGE_TYPES.UPDATE_ADDRESS_NICKNAME:
      onUpdateAddressNickname({ sender, sendResponse, data });
      break;
    case MESSAGE_TYPES.NOTIFY_TRANSACTION_SUCCESS:
      onNotifyTransactionSuccess({ sender, sendResponse, data });
      break;
    default:
  }
  return true;
};

// Listen for messages from the popup
addListener(messageHandler);
