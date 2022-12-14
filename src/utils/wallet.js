import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import Validator from 'multicoin-address-validator';

const constants = require('dogecoin-bip84/src/constants');
const networks = require('bitcoinjs-lib/src/networks');

// Hack bitcoinjs-lib values to use the dogecoin values from bip84
networks.dogecoin = { ...constants.NETWORKS.mainnet };
networks.dogecoin.wif = networks.bitcoin.wif;

export function generatePhrase() {
  return bip39.generateMnemonic(128);
}

export function generateRootWIF(phrase) {
  // Generate bip32 priv, pub and address
  // const root = bip32.fromSeed(bip39.mnemonicToSeedSync(phrase));
  // const child = root.derivePath("m/44'/3'/0'/0/0");
  // const priv = child.toWIF();
  // const pub = root.publicKey.toString('hex'); // Store the root public key so we can identify all addresses generated from this root in the future
  // const network =
  //   process.env.USE_TESTNET === 'true' ? networks.testnet : networks.dogecoin;
  // const addr = bitcoin.payments.p2pkh({
  //   pubkey: child.publicKey,
  //   network,
  // }).address;

  // return { addr, priv, pub };
  return bip32.fromSeed(bip39.mnemonicToSeedSync(phrase)).toWIF();
}

export function fromWIF(wif) {
  return new bitcoin.ECPair.fromWIF(wif, networks.dogecoin); // eslint-disable-line
}

export function validateAddress(data) {
  return Validator.validate(data, 'doge', 'prod');
}
