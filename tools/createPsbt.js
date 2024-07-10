const bitcoin = require('bitcoinjs-lib');
const dotenv = require('dotenv');
const sb = require('satoshi-bitcoin');

dotenv.config();

const api = require('./nownodes');

const { nownodes } = api;

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

/*
 * Create a PSBT with the first UTXOs from WIF_1 and WIF_2
 * Sends AMOUNT to the RECIPIENT_ADDRESS and change to WIF_1
 */
async function run() {
  const keyPair1 = bitcoin.ECPair.fromWIF(process.env.WIF_1, network);
  const keyPair2 = bitcoin.ECPair.fromWIF(process.env.WIF_2, network);
  const changeAddress = bitcoin.payments.p2pkh({
    pubkey: keyPair1.publicKey,
    network,
  }).address;
  const signerAddress = bitcoin.payments.p2pkh({
    pubkey: keyPair2.publicKey,
    network,
  }).address;
  const amount = Number(process.env.AMOUNT);
  const fee = Number(process.env.FEE);
  const psbt = new bitcoin.Psbt({ network });

  psbt.setMaximumFeeRate(100000000);

  console.log('initialized keypairs, amount, fee');

  const utxos1 = (await nownodes.get(`utxo/${changeAddress}`)).data.sort(
    (a, b) => {
      const aValue = Number(a.value);
      const bValue = Number(b.value);
      return bValue > aValue ? 1 : bValue < aValue ? -1 : a.height - b.height;
    }
  );
  const utxos2 = (await nownodes.get(`utxo/${signerAddress}`)).data.sort(
    (a, b) => {
      const aValue = Number(a.value);
      const bValue = Number(b.value);
      return bValue > aValue ? 1 : bValue < aValue ? -1 : a.height - b.height;
    }
  );

  if (utxos1.length === 0) {
    throw new Error('no utxos for address 1');
  }

  if (utxos2.length === 0) {
    throw new Error('no utxos for address 2');
  }

  if (
    sb.toBitcoin(Number(utxos1[0].value) + Number(utxos2[0].value)) <
    amount + fee
  ) {
    throw new Error('no utxos for address 2');
  }

  const index1 = utxos1[0].vout;
  const index2 = utxos2[0].vout;
  const tx1 = await nownodes.get(`tx/${utxos1[0].txid}`);
  const tx2 = await nownodes.get(`tx/${utxos2[0].txid}`);
  const value1 = sb.toBitcoin(tx1.data.vout[index1].value);
  const value2 = sb.toBitcoin(tx2.data.vout[index2].value);

  console.log('tx 1', tx1.data.txid, index1, value1);
  console.log('tx 2', tx2.data.txid, index2, value2);

  const change = Math.trunc(sb.toSatoshi(value1 + value2 - amount - fee));

  // Add Inputs
  psbt.addInput({
    hash: tx1.data.txid,
    index: index1,
    nonWitnessUtxo: Buffer.from(tx1.data.hex, 'hex'),
  });
  psbt.addInput({
    hash: tx2.data.txid,
    index: index2,
    nonWitnessUtxo: Buffer.from(tx2.data.hex, 'hex'),
  });

  // Add outputs
  psbt.addOutput({
    address: process.env.RECIPIENT_ADDRESS,
    value: sb.toSatoshi(amount),
  });
  psbt.addOutput({
    address: changeAddress,
    value: change,
  });

  console.log('added inputs and outputs');

  psbt.signInput(0, keyPair1);
  const txHex = psbt.toHex();

  // Print the raw transaction details
  console.log(changeAddress, 'sending', value1);
  console.log(signerAddress, 'sending', value2);
  console.log(
    'recipeint',
    process.env.RECIPIENT_ADDRESS,
    'amount',
    amount,
    'fee',
    fee
  );
  console.log('change', changeAddress, 'amount', sb.toBitcoin(change));
  console.log(`\nraw tx awaiting signature on index 1\n\n${txHex}`);

  // Finalize the transaction so we can compare the results
  const finalPsbt = bitcoin.Psbt.fromHex(txHex, { network });

  finalPsbt.setMaximumFeeRate(100000000);
  finalPsbt.signInput(1, keyPair2);

  finalPsbt.validateSignaturesOfInput(1, keyPair2.publicKey);
  finalPsbt.finalizeInput(1);

  // Finalize the first input (assuming it wasn't done before)
  finalPsbt.validateSignaturesOfInput(0, keyPair1.publicKey);
  finalPsbt.finalizeInput(0);

  // Export the fully signed transaction ready for broadcast
  const finalTx = finalPsbt.extractTransaction().toHex();
  console.log(`\nfinal transaction\n\n${finalTx}`);
}

run()
  .then(() => console.log('done'))
  .catch(console.error);
