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
import { MIN_TX_AMOUNT } from '../scripts/helpers/constants';

async function run() {
  const keyPair = bitcoin.ECPair.fromWIF(process.env.WIF_1, network);
  const senderAddress = bitcoin.payments.p2pkh({
    pubkey: keyPair.publicKey,
    network,
  }).address;
  const recipientAddress = process.env.RECIPIENT_ADDRESS;
  const fee = Number(process.env.FEE);

  console.log('initialized keypairs and addresses');

  const inscriptionUtxos = await getInscriptionsUtxos(senderAddress);
  const spendableUtxos = await getSpendableUtxos(senderAddress);

  if (inscriptionUtxos.length < 2) {
    throw new Error('not enough inscription utxos for sender');
  }

  if (spendableUtxos.length < 3) {
    throw new Error('no spendable utxos for sender');
  }

  const tx = new Transaction();

  console.log(
    'spendable input 1',
    spendableUtxos[0].txid,
    spendableUtxos[0].vout,
    sb.toBitcoin(spendableUtxos[0].outputValue)
  );
  console.log(
    'inscription input 2',
    inscriptionUtxos[0].txid,
    inscriptionUtxos[0].vout,
    sb.toBitcoin(inscriptionUtxos[0].outputValue)
  );
  console.log(
    'spendable input 3',
    spendableUtxos[1].txid,
    spendableUtxos[1].vout,
    sb.toBitcoin(spendableUtxos[1].outputValue)
  );
  console.log(
    'inscription input 4',
    inscriptionUtxos[1].txid,
    inscriptionUtxos[1].vout,
    sb.toBitcoin(inscriptionUtxos[1].outputValue)
  );
  console.log(
    'spendable input 5',
    spendableUtxos[2].txid,
    spendableUtxos[2].vout,
    sb.toBitcoin(spendableUtxos[2].outputValue)
  );

  tx.from({
    txid: spendableUtxos[0].txid,
    vout: spendableUtxos[0].vout,
    script: spendableUtxos[0].script,
    satoshis: Number(spendableUtxos[0].outputValue),
  });
  tx.from({
    txid: inscriptionUtxos[0].txid,
    vout: inscriptionUtxos[0].vout,
    script: inscriptionUtxos[0].script,
    satoshis: Number(inscriptionUtxos[0].outputValue),
  });
  tx.from({
    txid: spendableUtxos[1].txid,
    vout: spendableUtxos[1].vout,
    script: spendableUtxos[1].script,
    satoshis: Number(spendableUtxos[1].outputValue),
  });
  tx.from({
    txid: inscriptionUtxos[1].txid,
    vout: inscriptionUtxos[1].vout,
    script: inscriptionUtxos[1].script,
    satoshis: Number(inscriptionUtxos[1].outputValue),
  });
  tx.from({
    txid: spendableUtxos[2].txid,
    vout: spendableUtxos[2].vout,
    script: spendableUtxos[2].script,
    satoshis: Number(spendableUtxos[2].outputValue),
  });

  const inputAmount = sb.toBitcoin(tx._getInputAmount());

  console.log('input amount', inputAmount);

  if (inputAmount < fee + MIN_TX_AMOUNT * 2) {
    throw new Error('not enough inputs to cover fee');
  }

  // recipient
  tx.to(recipientAddress, sb.toSatoshi(inputAmount - fee));
  console.log('recipient', recipientAddress, inputAmount - fee);
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
