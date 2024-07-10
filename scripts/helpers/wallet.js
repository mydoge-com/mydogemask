// import { DogecoinJS } from '@mydogeofficial/dogecoin-js';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import * as bitcoinMessage from 'bitcoinjs-message';
import * as Validator from 'multicoin-address-validator';
import sb from 'satoshi-bitcoin';

import { MIN_TX_AMOUNT } from '../../constants/Doge';

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
  wif: 0x80,
};

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

export function signRawPsbt(rawTx, indexes, wif) {
  const keyPair = fromWIF(wif);
  const finalPsbt = bitcoin.Psbt.fromHex(rawTx, { network });
  finalPsbt.setMaximumFeeRate(100000000);

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
    rawTx: finalPsbt.extractTransaction().toHex(),
    fee: sb.toBitcoin(fee),
    amount: sb.toBitcoin(amount),
  };
}

export function signMessage(message, wif) {
  const keyPair = fromWIF(wif);
  return bitcoinMessage
    .sign(message, keyPair.privateKey, keyPair.compressed)
    .toString('hex');
}

// export async function generateRawTx(sender, recipient, amount, utxos) {
//   const dogecoin = await DogecoinJS.init();
//   const index = dogecoin.startTransaction();
//   let total = 0;
//   const fee = 0.01;

//   for (let i = 0; i < utxos.length; i++) {
//     const utxo = utxos[i];
//     console.log('utxo', utxo);
//     const value = sb.toBitcoin(utxo.value);
//     total += value;
//     console.log(
//       `added tx value ${value} for total ${total} > ${amount} + ${fee}`
//     );
//     dogecoin.addUTXO(index, utxo.txid, utxo.vout);

//     if (total > amount + fee) {
//       break;
//     }
//   }

//   dogecoin.addOutput(index, recipient, `${amount}`);
//   const rawTx = dogecoin.finalizeTransaction(
//     index,
//     recipient,
//     `${fee}`,
//     `${total}`,
//     sender
//   );

//   console.log('rawTx', rawTx);
//   return { rawTx, fee };
// }
