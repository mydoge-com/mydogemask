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

async function run() {
  const keyPair1 = bitcoin.ECPair.fromWIF(process.env.WIF_1, network);
  const keyPair2 = bitcoin.ECPair.fromWIF(process.env.WIF_2, network);
  const psbt = new bitcoin.Psbt({ network });
  psbt.setMaximumFeeRate(100000000);

  console.log('initialized keypairs and psbt');

  const index1 = Number(process.env.INDEX_1);
  const index2 = Number(process.env.INDEX_2);
  const tx1 = await nownodes.get(`tx/${process.env.TXID_1}`);
  const tx2 = await nownodes.get(`tx/${process.env.TXID_2}`);
  const value1 = sb.toBitcoin(tx1.data.vout[index1].value);
  const value2 = sb.toBitcoin(tx2.data.vout[index2].value);
  const amount = Number(process.env.AMOUNT);
  const fee = Number(process.env.FEE);

  console.log('tx 1', tx1.data.txid, index1, value1);
  console.log('tx 2', tx2.data.txid, index2, value2);

  const change = Math.trunc(sb.toSatoshi(value1 + value2 - amount - fee));
  const changeAddress = bitcoin.payments.p2pkh({
    pubkey: keyPair1.publicKey,
    network,
  }).address;
  const signerAddress = bitcoin.payments.p2pkh({
    pubkey: keyPair2.publicKey,
    network,
  }).address;

  // Add Inputs
  psbt.addInput({
    hash: process.env.TXID_1,
    index: index1,
    nonWitnessUtxo: Buffer.from(tx1.data.hex, 'hex'),
  });
  psbt.addInput({
    hash: process.env.TXID_2,
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
