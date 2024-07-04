import sb from 'satoshi-bitcoin';

import { logError } from '../utils/error';
import { apiKey, node, nownodes } from './api';
import { decrypt, encrypt, hash } from './helpers/cipher';
import {
  AUTHENTICATED,
  CONNECTED_CLIENTS,
  DRC20_INSCRIPTION_CACHE,
  FEE_RATE_KB,
  MAX_UTXOS,
  MESSAGE_TYPES,
  MIN_TX_AMOUNT,
  ONBOARDING_COMPLETE,
  PASSWORD,
  WALLET,
} from './helpers/constants';
import { getAllInscriptions, inscribe } from './helpers/doginals';
import { addListener } from './helpers/message';
import {
  clearSessionStorage,
  getCachedTx,
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
  signMessage,
  signRawPsbt,
  signRawTx,
} from './helpers/wallet';

const TRANSACTION_PAGE_SIZE = 10;

const sleep = async (time) =>
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });

function sanitizeFloatAmount(amount) {
  return sb.toBitcoin(Math.trunc(sb.toSatoshi(amount)));
}

/**
 * Creates a client popup window.
 *
 * @param {Object} options - The options for creating the client popup.
 * @param {Function} options.sendResponse - The function to send a response to the sender.
 * @param {Object} options.sender - The sender object containing information about the sender.
 * @param {Object} [options.data={}] - Additional data to be passed to the popup window.
 * @param {string} options.messageType - The type of message to be sent to the popup window.
 */
function createClientPopup({ sendResponse, sender, data = {}, messageType }) {
  const params = new URLSearchParams();
  params.append('originTabId', sender.tab.id);
  params.append('origin', sender.origin);
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((val) => params.append(key, val));
    } else {
      params.append(key, value);
    }
  });
  chrome.windows
    .create({
      url: `index.html?${params.toString()}#${messageType}`,
      type: 'popup',
      width: data.isOnboardingPending ? 800 : 357,
      height: 640,
    })
    .then((tab) => {
      if (tab) {
        sendResponse?.({ originTabId: sender.tab.id });
      } else {
        sendResponse?.(false);
      }
    });
}

// Build a raw transaction and determine fee
async function onCreateTransaction({ data = {}, sendResponse } = {}) {
  const amountSatoshi = sb.toSatoshi(data.dogeAmount);
  let amount = sb.toBitcoin(amountSatoshi);

  try {
    // get utxos and inscriptions
    const utxos = (
      await nownodes.get(`/utxo/${data.senderAddress}`).json()
    ).sort((a, b) => {
      const aValue = sb.toBitcoin(a.value);
      const bValue = sb.toBitcoin(b.value);
      return bValue > aValue ? 1 : bValue < aValue ? -1 : a.height - b.height;
    });

    console.log('found utxos', utxos.length);

    const inscriptions = await getAllInscriptions(data.senderAddress);

    console.log('found inscriptions', inscriptions.length);

    // estimate fee
    const smartfeeReq = {
      API_key: apiKey,
      jsonrpc: '2.0',
      id: `${data.senderAddress}_estimatesmartfee_${Date.now()}`,
      method: 'estimatesmartfee',
      params: [2], // confirm within x blocks
    };
    const feeData = await node.post(smartfeeReq).json();
    const feePerKB = feeData.result.feerate || FEE_RATE_KB;
    const feePerInput = sanitizeFloatAmount(feePerKB / 5); // about 5 inputs per KB
    const jsonrpcReq = {
      API_key: apiKey,
      jsonrpc: '2.0',
      id: `${data.senderAddress}_create_${Date.now()}`,
      method: 'createrawtransaction',
      params: [
        [],
        {
          [data.recipientAddress]: amount,
        },
      ],
    };
    let fee = feePerInput;
    let total = 0;
    let i = 0;
    let skipped = 0;

    console.log('found feerate', feeData.result.feerate);
    console.log('using feePerKb', feePerKB);
    console.log('estimated feePerInput', feePerInput);

    for (const utxo of utxos) {
      // Avoid inscription UTXOs
      if (
        inscriptions.find(
          (ins) => ins.txid === utxo.txid && ins.vout === utxo.vout
        )
      ) {
        // console.log('skipping inscription', utxo.txid, utxo.vout);
        skipped++;
        continue;
      }

      const value = sb.toBitcoin(utxo.value);

      total += value;
      fee = feePerInput * (i + 1);
      jsonrpcReq.params[0].push({
        txid: utxo.txid,
        vout: utxo.vout,
      });

      i++;

      if (total >= amount + fee) {
        console.log('utxo', i, total, '>=', amount + fee);
        break;
      }

      if (i === MAX_UTXOS) {
        total = amount = sanitizeFloatAmount(total);

        console.warn(`hit UTXO limit with ${i} inputs, sending max ${amount}`);
        break;
      }
    }

    total = sanitizeFloatAmount(total);
    amount = sanitizeFloatAmount(amount);
    fee = sanitizeFloatAmount(fee);

    console.log('skipped utxos', skipped);
    console.log('num utxos', i);
    console.log('total', total);
    console.log('amount', amount);
    console.log('estimated fee', fee);

    // Detect insufficient funds, discounting estimated fee from amount to allow for max send
    if (total === 0 || i === 0 || total - fee < MIN_TX_AMOUNT) {
      throw new Error(
        `Insufficient funds ${total} < ${amount} + ${fee} with ${i}/${utxos.length} inputs`
      );
    }

    // Set a dummy amount in the change address
    jsonrpcReq.params[1][data.senderAddress] = feePerInput;
    const estimateRes = await node.post(jsonrpcReq).json();
    const size = estimateRes.result.length / 2;

    console.log('tx size', size);

    fee = Math.max(sanitizeFloatAmount((size / 1000) * feePerKB), feePerInput);

    // Adjust for max send
    if (total < amount + fee) {
      amount = sanitizeFloatAmount(total - fee);
      jsonrpcReq.params[1][data.recipientAddress] = amount;
    }

    console.log('calculated fee', fee);

    // Add change address and amount if enough, otherwise add to fee
    const changeSatoshi = Math.trunc(
      sb.toSatoshi(total) - sb.toSatoshi(amount) - sb.toSatoshi(fee)
    );

    console.log('calculated change', changeSatoshi);

    if (changeSatoshi >= 0) {
      const changeAmount = sb.toBitcoin(changeSatoshi);
      if (changeAmount >= MIN_TX_AMOUNT) {
        jsonrpcReq.params[1][data.senderAddress] = changeAmount;
      } else {
        delete jsonrpcReq.params[1][data.senderAddress];
        fee += changeAmount;
      }
    }

    const rawTx = await node.post(jsonrpcReq).json();

    console.log('raw tx', rawTx.result);

    sendResponse?.({
      rawTx: rawTx.result,
      fee,
      amount,
    });
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }
}

async function onCreateNFTTransaction({ data = {}, sendResponse } = {}) {
  const txid = data.output.split(':')[0];
  const vout = parseInt(data.output.split(':')[1], 10);
  const amount = sb.toBitcoin(data.outputValue);

  console.log('nft tx', txid, vout, amount);

  try {
    // get utxos and inscriptions
    const utxos = (await nownodes.get(`/utxo/${data.address}`).json()).sort(
      (a, b) => {
        const aValue = sb.toBitcoin(a.value);
        const bValue = sb.toBitcoin(b.value);
        return bValue > aValue ? 1 : bValue < aValue ? -1 : a.height - b.height;
      }
    );

    console.log('found utxos', utxos.length);

    const inscriptions = await getAllInscriptions(data.address);

    console.log('found inscriptions', inscriptions.length);

    // estimate fee
    const smartfeeReq = {
      API_key: apiKey,
      jsonrpc: '2.0',
      id: `${data.address}_estimatesmartfee_${Date.now()}`,
      method: 'estimatesmartfee',
      params: [2], // confirm within x blocks
    };
    const feeData = await node.post(smartfeeReq).json();
    const feePerKB = feeData.result.feerate || FEE_RATE_KB;
    const feePerInput = sanitizeFloatAmount(feePerKB / 5); // about 5 inputs per KB
    const jsonrpcReq = {
      API_key: apiKey,
      jsonrpc: '2.0',
      id: `${data.address}_create_${Date.now()}`,
      method: 'createrawtransaction',
      params: [
        [{ txid, vout }],
        {
          [data.recipientAddress]: amount,
        },
      ],
    };
    let fee = feePerInput;
    let total = amount;
    let i = 1;
    let skipped = 0;

    console.log('found feerate', feeData.result.feerate);
    console.log('using feePerKb', feePerKB);
    console.log('estimated feePerInput', feePerInput);

    for (const utxo of utxos) {
      // Avoid inscription UTXOs
      if (
        inscriptions.find(
          (ins) => ins.txid === utxo.txid && ins.vout === utxo.vout
        )
      ) {
        skipped++;
        continue;
      }

      const value = sb.toBitcoin(utxo.value);
      total += value;
      fee = feePerInput * (i + 1);
      jsonrpcReq.params[0].push({
        txid: utxo.txid,
        vout: utxo.vout,
      });

      console.log('utxo', i + 1, total, '>=', amount + fee);
      i++;

      if (total >= amount + fee) {
        break;
      }
    }

    total = sanitizeFloatAmount(total);
    fee = sanitizeFloatAmount(fee);

    console.log('skipped utxos', skipped);
    console.log('num utxos', i);
    console.log('total', total);
    console.log('amount', amount);
    console.log('estimated fee', fee);

    // Detect insufficient funds, discounting estimated fee from amount to allow for max send
    if (total - fee < MIN_TX_AMOUNT) {
      throw new Error(
        `Insufficient funds ${total} < ${amount} + ${fee} with ${i}/${utxos.length} inputs`
      );
    }

    // Set a dummy amount in the change address
    jsonrpcReq.params[1][data.address] = feePerInput;
    const estimateRes = await node.post(jsonrpcReq).json();
    const size = estimateRes.result.length / 2;

    console.log('tx size', size);

    fee = Math.max(sanitizeFloatAmount((size / 1000) * feePerKB), feePerInput);

    console.log('calculated fee', fee);

    // Add change address and amount if enough, otherwise add to fee
    const changeSatoshi = Math.trunc(
      sb.toSatoshi(total) - sb.toSatoshi(amount) - sb.toSatoshi(fee)
    );

    console.log('calculated change', changeSatoshi);

    if (changeSatoshi >= 0) {
      const changeAmount = sb.toBitcoin(changeSatoshi);
      if (changeAmount >= MIN_TX_AMOUNT) {
        jsonrpcReq.params[1][data.address] = changeAmount;
      } else {
        delete jsonrpcReq.params[1][data.address];
        fee += changeAmount;
      }
    }

    const rawTx = await node.post(jsonrpcReq).json();

    console.log('raw tx', rawTx.result);

    sendResponse?.({
      rawTx: rawTx.result,
      fee,
      amount,
    });
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }
}

async function onInscribeTransferTransaction({ data = {}, sendResponse } = {}) {
  try {
    // Get utxos
    let utxos;
    await nownodes.get(`/utxo/${data.walletAddress}`).json((res) => {
      utxos = res.sort((a, b) => {
        const aValue = sb.toBitcoin(a.value);
        const bValue = sb.toBitcoin(b.value);
        return bValue > aValue ? 1 : bValue < aValue ? -1 : a.height - b.height;
      });
    });

    console.log('found utxos', utxos.length);

    const inscriptions = await getAllInscriptions(data.walletAddress);

    console.log('found inscriptions', inscriptions.length);

    let skipped = 0;

    // Map and cache scripts
    utxos = (
      await Promise.all(
        utxos.map(async (utxo) => {
          if (
            inscriptions.find(
              (ins) => ins.txid === utxo.txid && ins.vout === utxo.vout
            )
          ) {
            skipped++;
            return;
          }

          const tx = await getCachedTx(utxo.txid);
          const script = tx.vout[utxo.vout].hex;

          return {
            txid: utxo.txid,
            vout: utxo.vout,
            script,
            satoshis: parseInt(utxo.value, 10),
          };
        })
      )
    ).filter((utxo) => utxo);

    console.log('skipped utxos', skipped);
    console.log('num utxos', utxos.length);

    const smartfeeReq = {
      API_key: apiKey,
      jsonrpc: '2.0',
      id: `${data.address}_estimatesmartfee_${Date.now()}`,
      method: 'estimatesmartfee',
      params: [2], // confirm within x blocks
    };
    const feeData = await node.post(smartfeeReq).json();
    const feePerKB = sb.toSatoshi(feeData.result.feerate || FEE_RATE_KB);

    console.log('found feePerKB', feePerKB);

    // Build the inscription json
    const inscription = `{"p":"drc-20","op":"transfer","tick":"${data.ticker}","amt":"${data.tokenAmount}"}`;
    const inscriptionHex = Buffer.from(inscription).toString('hex');

    console.log('inscription', inscription, inscriptionHex);

    // Fetch the keys and inscribe the transactions
    const [wallet, password] = await Promise.all([
      getLocalValue(WALLET),
      getSessionValue(PASSWORD),
    ]);

    const decryptedWallet = decrypt({
      data: wallet,
      password,
    });

    if (!decryptedWallet) {
      sendResponse?.(false);
    }

    const txs = inscribe(
      utxos,
      data.walletAddress,
      decryptedWallet.children[data.selectedAddressIndex],
      feePerKB,
      'text/plain;charset=utf8',
      inscriptionHex
    );

    console.log('inscription txs', txs);

    let fee = 0;

    for (const tx of txs) {
      fee += tx.getFee();
    }

    fee = sb.toBitcoin(fee);

    console.log('calculated fee', fee);

    sendResponse?.({
      txs: txs.map((tx) => tx.toString()),
      fee,
    });
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }
}

async function onCreatePSBT({ data = {}, sendResponse } = {}) {
  Promise.all([getLocalValue(WALLET), getSessionValue(PASSWORD)]).then(
    ([wallet, password]) => {
      const decryptedWallet = decrypt({
        data: wallet,
        password,
      });
      if (!decryptedWallet) {
        sendResponse?.(false);
      }
      const rawTx = signRawPsbt(
        data.rawTx,
        data.index,
        decryptedWallet.children[data.selectedAddressIndex]
      );

      sendResponse?.({
        rawTx,
        // fee,
        // amount,
      });
    }
  );
}

async function onCreateSignedMessage({ data = {}, sendResponse } = {}) {
  Promise.all([getLocalValue(WALLET), getSessionValue(PASSWORD)]).then(
    ([wallet, password]) => {
      const decryptedWallet = decrypt({
        data: wallet,
        password,
      });

      if (!decryptedWallet) {
        sendResponse?.(false);
      }

      const signedMessage = signMessage(
        data.message,
        decryptedWallet.children[data.selectedAddressIndex]
      );

      sendResponse?.({
        signedMessage,
      });
    }
  );
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
            ?.createDocument({
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

async function onSendInscribeTransfer({ data = {}, sendResponse } = {}) {
  try {
    const results = [];
    let i = 0;

    for await (const signed of data.txs) {
      if (i > 0) {
        await sleep(10 * 1000); // Nownodes needs some time between txs
      }

      const jsonrpcReq = {
        API_key: apiKey,
        jsonrpc: '2.0',
        id: `send_${Date.now()}`,
        method: 'sendrawtransaction',
        params: [signed],
      };

      console.log(
        `sending inscribe transfer tx ${i + 1} of ${data.txs.length}`,
        jsonrpcReq.params[0]
      );

      const jsonrpcRes = await node.post(jsonrpcReq).json();
      results.push(jsonrpcRes.result);
      i++;
    }

    console.log(`inscription id ${results[1]}i0`);

    // Open offscreen notification page to handle transaction status notifications
    chrome.offscreen
      ?.createDocument({
        url: chrome.runtime.getURL(`notification.html/?txId=${results[1]}`),
        reasons: ['BLOBS'],
        justification: 'Handle transaction status notifications',
      })
      .catch(() => {});

    const inscriptionCache =
      (await getLocalValue(DRC20_INSCRIPTION_CACHE)) ?? [];

    inscriptionCache.push({
      txs: results,
      txType: 'inscribe',
      tokenAmount: data.tokenAmount,
      timestamp: Date.now(),
      ticker: data.ticker,
    });

    setLocalValue({ [DRC20_INSCRIPTION_CACHE]: inscriptionCache });

    sendResponse(results[1]);
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }
}

async function onRequestTransaction({ data, sendResponse, sender } = {}) {
  const isConnected = (await getSessionValue(CONNECTED_CLIENTS))?.[
    sender.origin
  ];
  if (!isConnected) {
    sendResponse?.(false);
    return;
  }
  createClientPopup({
    sendResponse,
    sender,
    data,
    messageType: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION,
  });
  return true;
}

async function onRequestDoginalTransaction({
  data = {},
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
  createClientPopup({
    sendResponse,
    sender,
    data,
    messageType: MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION,
  });
  return true;
}

async function onRequestAvailableDRC20Transaction({
  data,
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
  createClientPopup({
    sendResponse,
    sender,
    data,
    messageType: MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION,
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
        await Promise.all(txIds.map((txId) => getCachedTx(txId)))
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
  createClientPopup({
    sendResponse,
    sender,
    messageType: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION,
    data: { isOnboardingPending: !onboardingComplete },
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

async function onApproveAvailableDRC20Transaction({
  sendResponse,
  data: { txId, error, originTabId, origin, ticker, tokenAmount },
} = {}) {
  if (txId) {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION_RESPONSE,
      data: {
        txId,
        ticker,
        amount: tokenAmount,
      },
      origin,
    });
    sendResponse(true);
  } else {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION_RESPONSE,
      error,
      origin,
    });
    sendResponse(false);
  }
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

async function onApproveDoginalTransaction({
  sendResponse,
  data: { txId, error, originTabId, origin },
} = {}) {
  if (txId) {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE,
      data: {
        txId,
      },
      origin,
    });
    sendResponse(true);
  } else {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE,
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

          chrome.offscreen?.closeDocument().catch(() => {});
        } else if (!transaction) {
          chrome.notifications.create({
            type: 'basic',
            title: 'Transaction Unconfirmed',
            iconUrl: '../assets/mydoge128.png',
            message: `Transaction details could not be retrieved for \`${txId}\`.`,
          });
          chrome.offscreen?.closeDocument();
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
    case MESSAGE_TYPES.CREATE_NFT_TRANSACTION:
      onCreateNFTTransaction({ data, sendResponse });
      break;
    case MESSAGE_TYPES.CREATE_TRANSFER_TRANSACTION:
      onInscribeTransferTransaction({ data, sendResponse });
      break;
    case MESSAGE_TYPES.CREATE_PSBT:
      onCreatePSBT({ data, sendResponse });
      break;
    case MESSAGE_TYPES.CREATE_SIGNED_MESSAGE:
      onCreateSignedMessage({ data, sendResponse });
      break;
    case MESSAGE_TYPES.SEND_TRANSACTION:
      onSendTransaction({ data, sender, sendResponse });
      break;
    case MESSAGE_TYPES.SEND_TRANSFER_TRANSACTION:
      onSendInscribeTransfer({ data, sender, sendResponse });
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
    case MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION:
      onRequestDoginalTransaction({ data, sendResponse, sender });
      break;

    case MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE:
      onApproveDoginalTransaction({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION:
      onRequestAvailableDRC20Transaction({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION_RESPONSE:
      onApproveAvailableDRC20Transaction({ data, sendResponse, sender });
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
