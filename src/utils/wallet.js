import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import Validator from 'multicoin-address-validator';

const constants = require('dogecoin-bip84/src/constants');
const networks = require('bitcoinjs-lib/src/networks');

// Hack bitcoinjs-lib values to use with mainnet bip84 and bip44
networks.dogecoin = { ...constants.NETWORKS.mainnet };
networks.dogecoin.wif = networks.bitcoin.wif;

export function generateWallet(phrase) {
  // Generate bip32 priv, pub and address
  const root = bip32.fromSeed(bip39.mnemonicToSeedSync(phrase));
  const child = root.derivePath("m/44'/3'/0'/0/0");
  const priv = child.toWIF();
  const pub = root.publicKey.toString('hex'); // Store the root public key so we can identify all addresses generated from this root in the future
  const addr = bitcoin.payments.p2pkh({
    pubkey: child.publicKey,
    network: networks.dogecoin,
  }).address;
  return { addr, priv, pub };
}

export function fromWIF(wif) {
  const network = networks.dogecoin;
  // needed for BCY testnet because bip44 address uses bitcoin wif
  network.wif = networks.bitcoin.wif;
  return new bitcoin.ECPair.fromWIF(wif, network); // eslint-disable-line
}

export function validateAddress(data) {
  Validator.validate(data, 'doge', 'prod');
}
