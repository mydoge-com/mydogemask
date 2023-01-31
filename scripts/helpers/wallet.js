import DogecoinJS from '@mydogeofficial/dogecoin-js';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import * as Validator from 'multicoin-address-validator';
import sb from 'satoshi-bitcoin';

import { MIN_TX_AMOUNT } from '../../constants/Doge';

// Dogecoin mainnet
const network = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: 'dc',
  bip44: 3,
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398,
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x80,
};
let libdogecoin = null;

export async function initDogecoinJS() {
  if (libdogecoin === null) {
    console.log('bundled dogecoin-js:', DogecoinJS);
    libdogecoin = await DogecoinJS.init();
  }
}

export function generatePhrase() {
  return bip39.generateMnemonic(128);
}

export function generateRoot(phrase) {
  return bip32.fromSeed(bip39.mnemonicToSeedSync(phrase));
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

export function fromWIF(wif) {
  return new bitcoin.ECPair.fromWIF(wif, network); // eslint-disable-line
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

export function signRawTx(rawTx, wif) {
  const keyPair = fromWIF(wif);
  const tx = bitcoin.Transaction.fromHex(rawTx);
  const txb = bitcoin.TransactionBuilder.fromTransaction(tx, network);

  for (let i = 0; i < tx.ins.length; i++) {
    txb.sign(i, keyPair);
  }

  return txb.build().toHex();
}

export async function generateRawTx(sender, recipient, amount, utxos) {
  const index = libdogecoin.startTransaction();
  const minFee = 0.0015;
  let fee = 0;
  let total = 0;

  for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i];
    console.log('utxo', utxo);
    const value = sb.toBitcoin(utxo.value);
    total += value;
    fee += minFee;
    console.log(
      `added tx value ${value} for total ${total} > ${amount} + ${fee}`
    );
    libdogecoin.addUTXO(index, utxo.txid, utxo.vout);

    if (total >= amount + fee) {
      break;
    }
  }

  // Check for max send and update amount and fee
  if (total >= amount + fee) {
    libdogecoin.addOutput(index, recipient, `${amount}`);

    let rawTx = libdogecoin.finalizeTransaction(
      index,
      recipient,
      `${fee}`.toFixed(8), // estimated fee
      `${total}`,
      sender
    );

    const size = rawTx.length / 2;

    console.log('estimated fee', fee);

    fee = Math.max(parseFloat(((size / 1000) * 0.01).toFixed(8)), minFee);

    console.log('actual fee', fee);

    rawTx = libdogecoin.finalizeTransaction(
      index,
      recipient,
      `${fee}`, // actual fee
      `${total}`,
      sender
    );

    console.log('rawTx', rawTx);
    return { rawTx, fee };
  }

  return { rawTx: '0', fee: 0 };
}
