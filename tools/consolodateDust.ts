import * as bitcoin from 'bitcoinjs-lib';
import { Transaction } from 'bitcore-lib-doge';
import dotenv from 'dotenv';
import sb from 'satoshi-bitcoin';

dotenv.config();

import { mydoge } from '../scripts/api';
import { getSpendableUtxos } from '../scripts/helpers/doginals';
import { network } from '../scripts/helpers/wallet';
import { MIN_TX_AMOUNT } from '../scripts/helpers/constants';

const UTXO_LIMIT = 101;
const FEE = 1;

async function run() {
  const keyPair = bitcoin.ECPair.fromWIF(process.env.WIF_1, network);
  const senderAddress = bitcoin.payments.p2pkh({
    pubkey: keyPair.publicKey,
    network,
  }).address;
  const fee = Number(FEE);

  console.log('initialized keypairs and addresses');

  const spendableUtxos = await getSpendableUtxos(senderAddress);

  if (spendableUtxos.length === 0) {
    throw new Error('no spendable utxos for sender');
  }

  const tx = new Transaction();
  let hasLargeUtxo = false;
  let i = 0;

  for (const utxo of spendableUtxos) {
    if (i === UTXO_LIMIT) {
      break;
    }

    if (hasLargeUtxo && sb.toBitcoin(utxo.outputValue) > MIN_TX_AMOUNT) {
      continue;
    }

    tx.from({
      txid: utxo.txid,
      vout: utxo.vout,
      script: utxo.script,
      satoshis: Number(utxo.outputValue),
    });

    if (sb.toBitcoin(utxo.outputValue) > MIN_TX_AMOUNT) {
      hasLargeUtxo = true;
    }

    console.log('input', utxo.txid, utxo.vout, sb.toBitcoin(utxo.outputValue));
    i++;
  }

  const inputAmount = sb.toBitcoin(tx._getInputAmount());

  console.log('input amount', inputAmount);

  if (inputAmount < fee + MIN_TX_AMOUNT * UTXO_LIMIT) {
    throw new Error('not enough inputs to cover fee');
  }

  // recipient
  tx.to(senderAddress, Math.trunc(sb.toSatoshi(inputAmount - fee)));
  console.log('recipient', senderAddress, inputAmount - fee);
  console.log('fee', sb.toBitcoin(tx.getFee()));
  console.log('tx size', tx._estimateSize());

  // sign
  tx.sign(process.env.WIF_1);
  console.log('sending signedt tx', tx.toString());

  // send
  const jsonrpcReq = {
    jsonrpc: '2.0',
    id: `send_${Date.now()}`,
    method: 'sendrawtransaction',
    params: [tx.toString()],
  };
  const jsonrpcRes = (await mydoge.post('/wallet/rpc', jsonrpcReq)).data;
  console.log('\nresult', jsonrpcRes.result);
}

run()
  .then(() => console.log('done'))
  .catch(console.error);
