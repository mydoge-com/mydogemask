import * as bitcoin from 'bitcoinjs-lib';
import { Transaction } from 'bitcore-lib-doge';
import dotenv from 'dotenv';
import sb from 'satoshi-bitcoin';

dotenv.config();

import { mydoge } from '../scripts/api';
import {
  getInscriptionsUtxos,
  getSpendableUtxos,
} from '../scripts/helpers/doginals';
import { network } from '../scripts/helpers/wallet';

async function run() {
  const keyPair = bitcoin.ECPair.fromWIF(process.env.WIF_1, network);
  const senderAddress = bitcoin.payments.p2pkh({
    pubkey: keyPair.publicKey,
    network,
  }).address;
  const recipientAddress = process.env.RECIPIENT_ADDRESS;
  const fee = Number(process.env.FEE);
  const amount = Number(process.env.AMOUNT);

  console.log('initialized keypairs and addresses');

  const inscriptionUtxos = await getInscriptionsUtxos(senderAddress);
  const spendableUtxos = await getSpendableUtxos(senderAddress);
  let total = 0;

  if (inscriptionUtxos.length < 2) {
    throw new Error('not enough inscription utxos for sender');
  }

  if (spendableUtxos.length === 0) {
    throw new Error('no spendable utxos for sender');
  }

  const tx = new Transaction();

  console.log(
    'inscription input 1',
    inscriptionUtxos[0].txid,
    inscriptionUtxos[0].vout,
    sb.toBitcoin(inscriptionUtxos[0].outputValue)
  );
  console.log(
    'inscription input 2',
    inscriptionUtxos[1].txid,
    inscriptionUtxos[1].vout,
    sb.toBitcoin(inscriptionUtxos[1].outputValue)
  );

  tx.from({
    txid: inscriptionUtxos[0].txid,
    vout: inscriptionUtxos[0].vout,
    script: inscriptionUtxos[0].script,
    satoshis: Number(inscriptionUtxos[0].outputValue),
  });
  tx.from({
    txid: inscriptionUtxos[1].txid,
    vout: inscriptionUtxos[1].vout,
    script: inscriptionUtxos[1].script,
    satoshis: Number(inscriptionUtxos[1].outputValue),
  });

  for (const utxo of spendableUtxos) {
    const value = sb.toBitcoin(utxo.outputValue);

    if (total < amount + fee) {
      tx.from({
        txid: utxo.txid,
        vout: utxo.vout,
        script: utxo.script,
        satoshis: Number(utxo.outputValue),
      });
      total += value;
      console.log(
        'payment input',
        utxo.txid,
        utxo.vout,
        sb.toBitcoin(utxo.outputValue)
      );
    } else {
      break;
    }
  }

  // recipient
  tx.to(recipientAddress, sb.toSatoshi(amount));
  // change
  tx.to(senderAddress, sb.toSatoshi(total - amount - fee));
  console.log('change', total - amount - fee);
  console.log('fee', sb.toBitcoin(tx.getFee()));
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
