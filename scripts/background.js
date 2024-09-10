import { Transaction } from 'bitcore-lib-doge';
import sb from 'satoshi-bitcoin';

import { logError } from '../utils/error';
import { mydoge } from './api';
import { decrypt, encrypt, hash } from './helpers/cipher';
import {
  AUTHENTICATED,
  BLOCK_CONFIRMATIONS,
  CLIENT_POPUP_MESSAGE_PAIRS,
  CONNECTED_CLIENTS,
  FEE_RATE_KB,
  INSCRIPTION_TXS_CACHE,
  MAX_UTXOS,
  MESSAGE_TYPES,
  MIN_TX_AMOUNT,
  ONBOARDING_COMPLETE,
  PASSWORD,
  SELECTED_ADDRESS_INDEX,
  SPENT_UTXOS_CACHE,
  TRANSACTION_PAGE_SIZE,
  TRANSACTION_TYPES,
  WALLET,
} from './helpers/constants';
import {
  getInscriptionsUtxo,
  getSpendableUtxos,
  inscribe,
} from './helpers/doginals';
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
  cacheSignedTx,
  decryptData,
  fromWIF,
  generateAddress,
  generateChild,
  generatePhrase,
  generateRoot,
  signMessage,
  signRawPsbt,
  signRawTx,
} from './helpers/wallet';

const NOWNODES_SLEEP_S = 10;

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

async function createClientPopup({
  sendResponse,
  sender,
  data = {},
  messageType,
}) {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['TAB'],
  });

  console.log('contexts', contexts);
  console.log('id', chrome.runtime.id);

  contexts.forEach((context) => {
    chrome.tabs.remove(context.tabId);
  });

  try {
    const url = await chrome.runtime.getURL('');
    console.log('url', url);
  } catch (err) {
    console.log('error', err);
  }
  const params = new URLSearchParams();
  params.append('originTabId', JSON.stringify(sender.tab.id));
  params.append('origin', JSON.stringify(sender.origin));
  Object.entries(data).forEach(([key, value]) => {
    params.append(key, JSON.stringify(value));
  });
  chrome.windows
    .create({
      url: `index.html?${params.toString()}#${messageType}`,
      type: 'popup',
      width: data.isOnboardingPending ? 800 : 357,
      height: 640,
    })
    .then((newWindow) => {
      if (newWindow) {
        sendResponse?.({ originTabId: sender.tab.id });
      } else {
        sendResponse?.(false);
      }
    });
}

const createClientRequestHandler =
  () =>
  async ({ data, sendResponse, sender, messageType }) => {
    const isConnected = (await getSessionValue(CONNECTED_CLIENTS))?.[
      sender.origin
    ];
    if (!isConnected) {
      sendResponse?.(false);
      return;
    }
    await createClientPopup({ sendResponse, sender, data, messageType });
    return true;
  };

// Build a raw transaction and determine fee
async function onCreateTransaction({ data = {}, sendResponse } = {}) {
  const amountSatoshi = sb.toSatoshi(data.dogeAmount);
  let amount = sb.toBitcoin(amountSatoshi);

  try {
    // get spendable utxos
    let utxos = await getSpendableUtxos(data.senderAddress);

    const spentUtxosCache = (await getLocalValue(SPENT_UTXOS_CACHE)) ?? [];

    utxos = utxos.filter(
      (utxo) => !spentUtxosCache.find((cache) => cache.txid === utxo.txid)
    );

    console.log('found utxos', utxos.length);

    // estimate fee
    const smartfeeReq = {
      jsonrpc: '2.0',
      id: `${data.senderAddress}_estimatesmartfee_${Date.now()}`,
      method: 'estimatesmartfee',
      params: [BLOCK_CONFIRMATIONS], // confirm within x blocks
    };
    const feeData = (await mydoge.post('/wallet/rpc', smartfeeReq)).data;
    const feePerKB = feeData.result.feerate * 2 || FEE_RATE_KB;
    const feePerInput = sanitizeFloatAmount(feePerKB / 5); // about 5 inputs per KB
    const jsonrpcReq = {
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

    console.log('found feerate', feeData.result.feerate);
    console.log('using feePerKb', feePerKB);
    console.log('estimated feePerInput', feePerInput);

    for (const utxo of utxos) {
      const value = sb.toBitcoin(utxo.outputValue);

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
    const estimateRes = (await mydoge.post('/wallet/rpc', jsonrpcReq)).data;
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

    const rawTx = (await mydoge.post('/wallet/rpc', jsonrpcReq)).data;

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
  const split = data.location.split(':');

  if (split.length !== 3) {
    sendResponse?.(false);
    return;
  }

  const txid = split[0];
  const vout = Number(split[1]);
  const offset = Number(split[2]);
  const amount = Number(data.outputValue);
  const minSats = sb.toSatoshi(MIN_TX_AMOUNT);

  console.log(
    'sending inscription',
    data.inscriptionId,
    'in tx',
    txid,
    'vout',
    vout,
    'offset',
    offset,
    'amount',
    sb.toBitcoin(amount)
  );

  try {
    // Get the inscribed utxo
    const inUtxo = await getInscriptionsUtxo(data.address, { txid, vout });
    console.log(
      'found inscription utxo with',
      inUtxo.inscriptions.length,
      'inscriptions and',
      sb.toBitcoin(inUtxo.outputValue),
      'value'
    );

    // estimate fee
    const smartfeeReq = {
      jsonrpc: '2.0',
      id: `${data.address}_estimatesmartfee_${Date.now()}`,
      method: 'estimatesmartfee',
      params: [BLOCK_CONFIRMATIONS], // confirm within x blocks
    };
    const feeData = (await mydoge.post('/wallet/rpc', smartfeeReq)).data;
    const feePerKB = feeData.result.feerate * 2 || FEE_RATE_KB;
    const tx = new Transaction();

    // Populate the transaction with initial input
    tx.from({
      txid,
      vout,
      script: inUtxo.script,
      satoshis: Number(inUtxo.outputValue),
    });

    // Determine the outputs for the specific inscription
    let currOffset = 0;
    let output = 0;
    let total = 0;

    for (let i = 0; i < inUtxo.inscriptions.length; i++) {
      const inscription = inUtxo.inscriptions[i];
      const currSat = inscription.offset - currOffset;

      if (currSat > 0) {
        tx.to(data.address, inscription.offset - currOffset);
        console.log(
          'output',
          output,
          'to',
          data.address,
          'with',
          sb.toBitcoin(inscription.offset - currOffset)
        );
        output++;
        total += inscription.offset - currOffset;
      }

      if (inscription.offset === offset) {
        tx.to(data.recipientAddress, minSats);
        console.log(
          'output',
          output,
          'to',
          data.recipientAddress,
          'with',
          MIN_TX_AMOUNT
        );
      } else {
        tx.to(data.address, minSats);
        console.log(
          'output',
          output,
          'to',
          data.address,
          'with',
          MIN_TX_AMOUNT
        );
      }

      output++;
      total += minSats;
      currOffset += inscription.offset + minSats;
    }

    console.log('total outputs', sb.toBitcoin(total));

    const estimatedSize = tx._estimateSize() / 1000;
    const estimatedFee = Math.trunc(sb.toSatoshi(estimatedSize * feePerKB));
    const remainder = amount - total;

    console.log('estimated size', estimatedSize);
    console.log('fee per kb', feePerKB);
    console.log('estimated fee', sb.toBitcoin(estimatedFee));
    console.log('remainder', sb.toBitcoin(remainder));

    if (remainder >= estimatedFee) {
      if (remainder - estimatedFee >= minSats) {
        console.log(
          'change to',
          data.address,
          'should be',
          sb.toBitcoin(remainder - estimatedFee)
        );
        tx.to(data.address, remainder - estimatedFee);
      }
    } else {
      const diff = estimatedFee - remainder;
      console.log('needed to cover fee', sb.toBitcoin(diff));
      let extra = 0;
      // Find another utxo to cover the fee
      // get spendable utxos
      let utxos = await getSpendableUtxos(data.address);

      const spentUtxosCache = (await getLocalValue(SPENT_UTXOS_CACHE)) ?? [];

      utxos = utxos.filter(
        (utxo) => !spentUtxosCache.find((cache) => cache.txid === utxo.txid)
      );

      console.log('found utxos', utxos.length);
      for (const utxo of utxos) {
        const value = Number(utxo.outputValue);

        tx.from({
          txid: utxo.txid,
          vout: utxo.vout,
          script: utxo.script,
          satoshis: value,
        });
        console.log('added utxo', utxo.txid, 'amount', sb.toBitcoin(value));

        extra += value;

        if (extra >= diff) {
          break;
        }
      }

      console.log('total added to cover fee', sb.toBitcoin(extra));

      if (extra - diff >= minSats) {
        tx.to(data.address, extra - diff);
        console.log(
          'change to',
          data.address,
          'should be',
          sb.toBitcoin(extra - diff)
        );
      }
    }

    const rawTx = tx.toString();
    const fee = sb.toBitcoin(tx._getUnspentValue());

    console.log('total input amount', sb.toBitcoin(tx._getInputAmount()));
    console.log('total output amount', sb.toBitcoin(tx._getOutputAmount()));
    console.log('total fee', fee);
    console.log('raw tx', rawTx);

    sendResponse?.({
      rawTx,
      fee,
      amount: MIN_TX_AMOUNT,
    });
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }
}

async function onInscribeTransferTransaction({ data = {}, sendResponse } = {}) {
  try {
    // Get utxos
    let utxos = await getSpendableUtxos(data.walletAddress);

    const spentUtxosCache = (await getLocalValue(SPENT_UTXOS_CACHE)) ?? [];

    utxos = utxos.filter(
      (utxo) => !spentUtxosCache.find((cache) => cache.txid === utxo.txid)
    );

    console.log('found utxos', utxos.length);

    // Map satoshis to integers
    utxos = await Promise.all(
      utxos.map(async (utxo) => {
        return {
          txid: utxo.txid,
          vout: utxo.vout,
          script: utxo.script,
          satoshis: sb.toSatoshi(sb.toBitcoin(utxo.outputValue)),
        };
      })
    );

    console.log('num utxos', utxos.length);

    const smartfeeReq = {
      jsonrpc: '2.0',
      id: `${data.address}_estimatesmartfee_${Date.now()}`,
      method: 'estimatesmartfee',
      params: [BLOCK_CONFIRMATIONS], // confirm within x blocks
    };
    const feeData = (await mydoge.post('/wallet/rpc', smartfeeReq)).data;
    const feePerKB = sb.toSatoshi(feeData.result.feerate * 2 || FEE_RATE_KB);

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

function onSendTransaction({ data = {}, sendResponse } = {}) {
  Promise.all([getLocalValue(WALLET), getSessionValue(PASSWORD)]).then(
    async ([wallet, password]) => {
      try {
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
          jsonrpc: '2.0',
          id: `${data.senderAddress}_send_${Date.now()}`,
          method: 'sendrawtransaction',
          params: [signed],
        };
        const jsonrpcRes = (await mydoge.post('/wallet/rpc', jsonrpcReq)).data;

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

        // Cache spent utxos
        await cacheSignedTx(signed);

        // Cache transaction if it's a DRC20 transaction
        if (data.txType) {
          const txsCache = (await getLocalValue(INSCRIPTION_TXS_CACHE)) ?? [];

          txsCache.push({
            txs: [jsonrpcRes.result],
            txType: data.txType,
            timestamp: Date.now(),
            ticker: data.ticker,
            tokenAmount: data.tokenAmount,
            location: data.location,
          });

          setLocalValue({ [INSCRIPTION_TXS_CACHE]: txsCache });
        }

        sendResponse(jsonrpcRes.result);
      } catch (err) {
        logError(err);
        sendResponse?.(false);
      }
    }
  );
}

async function onSendInscribeTransfer({ data = {}, sendResponse } = {}) {
  try {
    const results = [];
    let i = 0;

    for await (const signed of data.txs) {
      if (i > 0) {
        await sleep(NOWNODES_SLEEP_S * 1000); // Nownodes needs some time between txs
      }

      const jsonrpcReq = {
        jsonrpc: '2.0',
        id: `send_${Date.now()}`,
        method: 'sendrawtransaction',
        params: [signed],
      };

      console.log(
        `sending inscribe transfer tx ${i + 1} of ${data.txs.length}`,
        jsonrpcReq.params[0]
      );

      const jsonrpcRes = (await mydoge.post('/wallet/rpc', jsonrpcReq)).data;
      await cacheSignedTx(signed);

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

    const txsCache = (await getLocalValue(INSCRIPTION_TXS_CACHE)) ?? [];

    txsCache.push({
      txs: results,
      txType: TRANSACTION_TYPES.DRC20_AVAILABLE_TX,
      tokenAmount: data.tokenAmount,
      timestamp: Date.now(),
      ticker: data.ticker,
      location: `${results[1]}:0:0`,
    });

    setLocalValue({ [INSCRIPTION_TXS_CACHE]: txsCache });

    sendResponse(results[1]);
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }
}

async function onSignPsbt({ data = {}, sendResponse } = {}) {
  try {
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

    const { rawTx, fee, amount } = signRawPsbt(
      data.rawTx,
      data.indexes,
      decryptedWallet.children[data.selectedAddressIndex],
      !data.feeOnly
    );

    sendResponse?.({
      rawTx,
      fee,
      amount,
    });
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }

  return true;
}

async function onSendPsbt({ data = {}, sendResponse } = {}) {
  try {
    const jsonrpcReq = {
      jsonrpc: '2.0',
      id: `send_${Date.now()}`,
      method: 'sendrawtransaction',
      params: [data.rawTx],
    };

    console.log(`sending signed psbt`, jsonrpcReq.params[0]);

    const jsonrpcRes = (await mydoge.post('/wallet/rpc', jsonrpcReq)).data;

    console.log(`tx id ${jsonrpcRes.result}`);

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

    await cacheSignedTx(data.rawTx);

    sendResponse(jsonrpcRes.result);
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }
}

async function onSignMessage({ data = {}, sendResponse } = {}) {
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

      sendResponse?.(signedMessage);
    }
  );
}

async function onDecryptMessage({ data = {}, sendResponse } = {}) {
  Promise.all([getLocalValue(WALLET), getSessionValue(PASSWORD)]).then(
    ([wallet, password]) => {
      const decryptedWallet = decrypt({
        data: wallet,
        password,
      });

      if (!decryptedWallet) {
        sendResponse?.(false);
      }

      const signedMessage = decryptData(
        decryptedWallet.children[data.selectedAddressIndex],
        data.message
      );

      sendResponse?.(signedMessage);
    }
  );
}

const clientRequestHandlers = CLIENT_POPUP_MESSAGE_PAIRS.reduce((acc, pair) => {
  const [messageType] = Object.values(pair.request);
  const [responseType] = Object.values(pair.response);
  acc[messageType] = createClientRequestHandler({ responseType });
  return acc;
}, {});

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

    const sessionWallet = {
      addresses: wallet.addresses,
      nicknames: wallet.nicknames,
    };

    Promise.all([
      setLocalValue({
        [PASSWORD]: encryptedPassword,
        [WALLET]: encryptedWallet,
        [ONBOARDING_COMPLETE]: true,
      }),
      setSessionValue({
        [AUTHENTICATED]: true,
        [WALLET]: sessionWallet,
        [PASSWORD]: data.password,
      }),
    ])
      .then(() => {
        sendResponse?.({ authenticated: true, wallet: sessionWallet });
      })
      .catch(() => sendResponse?.(false));
  } else {
    sendResponse?.(false);
  }
  return true;
}

async function onGetDogecoinPrice({ sendResponse } = {}) {
  try {
    const response = (
      await mydoge.get('/wallet/info', {
        params: { route: '/tickers/?currency=usd' },
      })
    ).data;

    sendResponse?.(response.rates);
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }
}

async function onGetAddressBalance({ data, sendResponse } = {}) {
  try {
    const addresses = data.addresses?.length ? data.addresses : [data.address];
    const balances = await Promise.all(
      addresses.map(async (address) => {
        const response = (
          await mydoge.get('/wallet/info', {
            params: { route: `/address/${address}` },
          })
        ).data;

        return response.balance;
      })
    );

    sendResponse?.(balances.length > 1 ? balances : balances[0]);
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }
}

async function onGetTransactions({ data, sendResponse } = {}) {
  // Get txids
  let txIds = [];
  let totalPages;
  let page;

  try {
    const response = (
      await mydoge.get('/wallet/info', {
        params: {
          route: `/address/${data.address}?page=${
            data.page || 1
          }&pageSize=${TRANSACTION_PAGE_SIZE}`,
        },
      })
    ).data;

    txIds = response.txids;
    totalPages = response.totalPages;
    page = response.page;

    if (!txIds?.length) {
      sendResponse?.({ transactions: [], totalPages, page });
      return;
    }

    const transactions = (
      await Promise.all(txIds.map((txId) => getCachedTx(txId)))
    ).sort((a, b) => b.blockTime - a.blockTime);

    sendResponse?.({ transactions, totalPages, page });
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }
}

async function onGetTransactionDetails({ data, sendResponse } = {}) {
  try {
    const transaction = (
      await mydoge.get('wallet/info', { params: { route: `/tx/${data.txId}` } })
    ).data;

    sendResponse?.(transaction);
  } catch (err) {
    logError(err);
    sendResponse?.(false);
  }
}

function onGenerateAddress({ sendResponse, data } = {}) {
  Promise.all([getLocalValue(WALLET), getSessionValue(PASSWORD)]).then(
    ([encryptedWallet, password]) => {
      const decryptedWallet = decrypt({
        data: encryptedWallet,
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
      encryptedWallet = encrypt({
        data: decryptedWallet,
        password,
      });

      const sessionWallet = {
        addresses: decryptedWallet.addresses,
        nicknames: decryptedWallet.nicknames,
      };
      Promise.all([
        setSessionValue({
          [WALLET]: sessionWallet,
        }),
        setLocalValue({
          [WALLET]: encryptedWallet,
        }),
      ])
        .then(() => {
          sendResponse?.({ wallet: sessionWallet });
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
      const sessionWallet = {
        addresses: decryptedWallet.addresses,
        nicknames: decryptedWallet.nicknames,
      };
      Promise.all([
        setSessionValue({
          [WALLET]: sessionWallet,
        }),
        setLocalValue({
          [WALLET]: encryptedWallet,
        }),
      ])
        .then(() => {
          sendResponse?.({ wallet: sessionWallet });
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
  data: {
    approved,
    address,
    selectedAddressIndex,
    balance,
    originTabId,
    origin,
    error,
  },
} = {}) {
  if (approved) {
    const connectedClients = (await getSessionValue(CONNECTED_CLIENTS)) || {};
    setSessionValue({
      [CONNECTED_CLIENTS]: {
        ...connectedClients,
        [origin]: { address, originTabId, origin },
      },
    });

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

        chrome.tabs?.sendMessage(originTabId, {
          type: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION_RESPONSE,
          data: {
            approved: true,
            publicKey: fromWIF(
              decryptedWallet.children[selectedAddressIndex]
            ).publicKey.toString('hex'),
            address,
            balance,
          },
          origin,
        });

        sendResponse(true);
      }
    );
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

async function onApprovePsbt({
  sendResponse,
  data: { txId, error, originTabId, origin },
} = {}) {
  if (txId) {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_PSBT_RESPONSE,
      data: {
        txId,
      },
      origin,
    });
    sendResponse(true);
  } else {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_PSBT_RESPONSE,
      error,
      origin,
    });
    sendResponse(false);
  }
  return true;
}

async function onApproveSignedMessage({
  sendResponse,
  data: { signedMessage, error, originTabId, origin },
} = {}) {
  if (signedMessage) {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE_RESPONSE,
      data: {
        signedMessage,
      },
      origin,
    });
    sendResponse(true);
  } else {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE_RESPONSE,
      error,
      origin,
    });
    sendResponse(false);
  }
  return true;
}

async function onApproveDecryptedMessage({
  sendResponse,
  data: { decryptedMessage, error, originTabId, origin },
} = {}) {
  if (decryptedMessage) {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_DECRYPTED_MESSAGE_RESPONSE,
      data: {
        decryptedMessage,
      },
      origin,
    });
    sendResponse(true);
  } else {
    chrome.tabs?.sendMessage(originTabId, {
      type: MESSAGE_TYPES.CLIENT_REQUEST_DECRYPTED_MESSAGE_RESPONSE,
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

      const sessionWallet = {
        addresses: decryptedWallet.addresses,
        nicknames: decryptedWallet.nicknames,
      };
      Promise.all([
        setSessionValue({
          [WALLET]: sessionWallet,
        }),
        setLocalValue({
          [WALLET]: encryptedWallet,
        }),
      ])
        .then(() => {
          sendResponse?.({ wallet: sessionWallet });
        })
        .catch(() => sendResponse?.(false));
    }
  );
  return true;
}

function onDeleteWallet({ sendResponse } = {}) {
  Promise.all([
    clearSessionStorage(),
    removeLocalValue([
      PASSWORD,
      WALLET,
      ONBOARDING_COMPLETE,
      SELECTED_ADDRESS_INDEX,
    ]),
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

      const authenticated = decryptedPass === hash(data.password);

      if (authenticated) {
        const decryptedWallet = decrypt({
          data: encryptedWallet,
          password: data.password,
        });

        if (!decryptedWallet) {
          sendResponse?.(false);
          return;
        }

        // MIGRATE Bitcon WIF to Dogecoin WIF
        if (!fromWIF(decryptedWallet.root)) {
          const root = generateRoot(decryptedWallet.phrase);
          const numChildren = decryptedWallet.children.length;
          decryptedWallet.root = root.toWIF();
          decryptedWallet.children = [];

          for (let i = 0; i < numChildren; i++) {
            const child = generateChild(root, i);
            decryptedWallet.children.push(child.toWIF());
          }

          const migratedWallet = encrypt({
            data: decryptedWallet,
            password: data.password,
          });

          setLocalValue({
            [WALLET]: migratedWallet,
          });

          console.info('migrated wif format');
        }

        // decryptedWallet.children.forEach((wif) => console.log(wif));

        const sessionWallet = {
          addresses: decryptedWallet.addresses,
          nicknames: decryptedWallet.nicknames,
        };

        setSessionValue({
          [AUTHENTICATED]: true,
          [WALLET]: sessionWallet,
          [PASSWORD]: data.password,
        });

        if (data._dangerouslyReturnSecretPhrase) {
          sessionWallet.phrase = decryptedWallet.phrase;
        }

        sendResponse?.({
          authenticated,
          wallet: sessionWallet,
        });
      } else {
        sendResponse?.({
          authenticated,
          wallet: null,
        });
      }
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
  Promise.all([
    getSessionValue(AUTHENTICATED),
    getSessionValue(WALLET),
    getLocalValue(SELECTED_ADDRESS_INDEX),
  ]).then(([authenticated, wallet, selectedAddressIndex]) => {
    sendResponse?.({ authenticated, wallet, selectedAddressIndex });
  });
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
    case MESSAGE_TYPES.SIGN_PSBT:
      onSignPsbt({ data, sendResponse });
      break;
    case MESSAGE_TYPES.SEND_PSBT:
      onSendPsbt({ data, sendResponse });
      break;
    case MESSAGE_TYPES.SIGN_MESSAGE:
      onSignMessage({ data, sendResponse });
      break;
    case MESSAGE_TYPES.DECRYPT_MESSAGE:
      onDecryptMessage({ data, sendResponse });
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
    case MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE:
      onApproveDoginalTransaction({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION:
    case MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION:
    case MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION:
    case MESSAGE_TYPES.CLIENT_REQUEST_PSBT:
    case MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE:
    case MESSAGE_TYPES.CLIENT_REQUEST_DECRYPTED_MESSAGE:
      clientRequestHandlers[message]({
        data,
        sendResponse,
        sender,
        messageType: message,
      });
      break;
    case MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE:
      onApproveTransaction({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.CLIENT_REQUEST_PSBT_RESPONSE:
      onApprovePsbt({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION_RESPONSE:
      onApproveAvailableDRC20Transaction({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE_RESPONSE:
      onApproveSignedMessage({ data, sendResponse, sender });
      break;
    case MESSAGE_TYPES.CLIENT_REQUEST_DECRYPTED_MESSAGE_RESPONSE:
      onApproveDecryptedMessage({ data, sendResponse, sender });
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
