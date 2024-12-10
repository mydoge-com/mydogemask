// import { DogecoinJS } from '@mydogeofficial/dogecoin-js';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import * as bitcoinMessage from 'bitcoinjs-message';
import * as crypto from 'crypto';
import { ec as EC } from 'elliptic';
import * as Validator from 'multicoin-address-validator';
import sb from 'satoshi-bitcoin';
import * as wif from 'wif';

import {
  MIN_TX_AMOUNT,
  SIGHASH_TYPE_WHITELIST,
  SPENT_UTXOS_CACHE,
} from './constants';
import { getLocalValue, setLocalValue } from './storage';

const ec = new EC('secp256k1');

// Dogecoin mainnet
export const network = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: 'dc',
  bip44: 3,
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398,
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e,
};

export function generatePhrase() {
  return bip39.generateMnemonic(128);
}

export function generateRoot(phrase) {
  return bip32.fromSeed(bip39.mnemonicToSeedSync(phrase), network);
}

export function generateChild(root, idx) {
  return root.derivePath(`m/44'/${network.bip44}'/0'/0/${idx}`);
}

export function generateAddress(child) {
  return bitcoin.payments.p2pkh({
    pubkey: child.publicKey,
    network,
  }).address;
}

export function fromWIF(wifKey) {
  let pair;
  try {
    pair = new bitcoin.ECPair.fromWIF(wifKey, network); // eslint-disable-line
  } catch (e) {
    console.error(e.message);
  }
  return pair;
}

export function decodeRawPsbt(rawTx) {
  return bitcoin.Psbt.fromHex(rawTx, { network });
}

export function decodeRawTx(rawTx) {
  return bitcoin.Transaction.fromHex(rawTx);
}

export function validateAddress(data) {
  return Validator.validate(data, 'doge', 'prod');
}

export const validateTransaction = ({
  senderAddress,
  recipientAddress,
  dogeAmount,
  addressBalance,
}) => {
  if (!validateAddress(recipientAddress)) {
    return 'Invalid address';
  } else if (senderAddress.trim() === recipientAddress.trim()) {
    return 'Cannot send to yourself';
  } else if (!Number(dogeAmount) || Number(dogeAmount) < MIN_TX_AMOUNT) {
    return 'Invalid Doge amount';
  } else if (Number(dogeAmount) > sb.toBitcoin(addressBalance)) {
    return 'Insufficient balance';
  }
  return undefined;
};

export function signRawTx(rawTx, wifKey) {
  const keyPair = fromWIF(wifKey);
  const tx = bitcoin.Transaction.fromHex(rawTx);
  const txb = bitcoin.TransactionBuilder.fromTransaction(tx, network);

  for (let i = 0; i < tx.ins.length; i++) {
    txb.sign(i, keyPair);
  }

  return txb.build().toHex();
}

export function signRawPsbt(
  rawTx,
  indexes,
  wifKey,
  withTx = true,
  partial = false,
  sighashType = bitcoin.Transaction.SIGHASH_ALL
) {
  const keyPair = fromWIF(wifKey);
  const finalPsbt = bitcoin.Psbt.fromHex(rawTx, { network });
  finalPsbt.setMaximumFeeRate(100000000);

  if (partial) {
    if (!SIGHASH_TYPE_WHITELIST.includes(sighashType)) return;
    for (let i = 0; i < indexes.length; i++) {
      const index = Number(indexes[i]);
      finalPsbt.signInput(index, keyPair, [sighashType]);
      finalPsbt.finalizeInput(index);
    }
    return {
      rawTx: finalPsbt.toHex(),
    };
  }
  // Sign / finalize inputs
  for (let i = 0; i < indexes.length; i++) {
    const index = Number(indexes[i]);
    finalPsbt.signInput(index, keyPair);
  }

  for (let i = 0; i < finalPsbt.txInputs.length; i++) {
    finalPsbt.finalizeInput(i);
  }

  // Get total outputs and fee
  const amount = finalPsbt.txOutputs.reduce(
    (acc, output) => acc + output.value,
    0
  );
  const fee = finalPsbt.getFee();

  return {
    ...(withTx && { rawTx: finalPsbt.extractTransaction().toHex() }),
    fee: sb.toBitcoin(fee),
    amount: sb.toBitcoin(amount),
  };
}

export function signMessage(message, wifKey) {
  const keyPair = fromWIF(wifKey);
  return bitcoinMessage
    .sign(message, keyPair.privateKey, keyPair.compressed)
    .toString('base64');
}

export async function cacheSignedTx(signed) {
  // cache spent utxos
  const tx = decodeRawTx(signed);
  // Get the input UTXOs
  const inputUtxos = tx.ins.map((input) => {
    const txid = Buffer.from(input.hash.reverse()).toString('hex');
    return {
      txid,
      vout: input.index,
      timestamp: Date.now(),
    };
  });
  const spentUtxosCache = (await getLocalValue(SPENT_UTXOS_CACHE)) ?? [];
  spentUtxosCache.push(...inputUtxos);
  setLocalValue({ [SPENT_UTXOS_CACHE]: spentUtxosCache });
}

function decryptAesKeyWithPrivkey(
  privkey, // : EC.KeyPair,
  encryptedAesKey // : Buffer
) /*: Buffer */ {
  const tempPubKeyBuffer = encryptedAesKey.slice(0, 33);
  const iv = encryptedAesKey.slice(33, 45);
  const ciphertext = encryptedAesKey.slice(45, -16);
  const tag = encryptedAesKey.slice(-16);

  const tempPubKey = ec.keyFromPublic(tempPubKeyBuffer);

  const sharedSecret = privkey.derive(tempPubKey.getPublic());

  const derivedKey = crypto
    .createHmac('sha256', Buffer.from('ecdh derived key'))
    .update(Buffer.from(sharedSecret.toString(16), 'hex'))
    .digest();

  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
  decipher.setAuthTag(tag);
  const aesKey = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return aesKey;
}

function decryptDataWithAes(
  aesKey /*: Buffer */,
  encryptedData /*: Buffer */
) /*: Buffer */ {
  const iv = encryptedData.slice(0, 12);
  const tag = encryptedData.slice(-16);
  const ciphertext = encryptedData.slice(12, -16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function decryptData(
  wifKey, // : string,
  encryptedData // : Buffer | string
) /*: string */ {
  const decoded = wif.decode(wifKey);
  const privKey = ec.keyFromPrivate(decoded.privateKey);

  if (typeof encryptedData === 'string') {
    encryptedData = Buffer.from(encryptedData, 'base64');
  }

  // Assuming the first 33 + 12 + len(encrypted AES key) bytes are the encrypted AES key data
  const encryptedAesKey = encryptedData.slice(0, 33 + 12 + 32 + 16);
  const encryptedMessage = encryptedData.slice(33 + 12 + 32 + 16);

  const aesKey = decryptAesKeyWithPrivkey(privKey, encryptedAesKey);

  return decryptDataWithAes(aesKey, encryptedMessage).toString('utf8');
}
