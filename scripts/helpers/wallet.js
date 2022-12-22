import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import * as _networks from 'bitcoinjs-lib/src/networks';
import * as constants from 'dogecoin-bip84/src/constants';
import * as Validator from 'multicoin-address-validator';

const networks = { ..._networks };
// Hack bitcoinjs-lib values to use the dogecoin values from bip84
networks.dogecoin = { ...constants.NETWORKS.mainnet };
networks.dogecoin.wif = networks.bitcoin.wif;

export function generatePhrase() {
  return bip39.generateMnemonic(128);
}

export function generateRoot(phrase) {
  return bip32.fromSeed(bip39.mnemonicToSeedSync(phrase));
}

export function generateChild(root, idx) {
  return root.derivePath(`m/44'/3'/0'/0/${idx}`);
}

export function generateAddress(child) {
  return bitcoin.payments.p2pkh({
    pubkey: child.publicKey,
    network: networks.dogecoin,
  }).address;
}

export function fromWIF(wif) {
  return new bitcoin.ECPair.fromWIF(wif, networks.dogecoin); // eslint-disable-line
}

export function validateAddress(data) {
  return Validator.validate(data, 'doge', 'prod');
}
