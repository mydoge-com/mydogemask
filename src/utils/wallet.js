import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import {
  fromMnemonic as FromMnemonic,
  fromZPrv as FromZPrv,
} from 'dogecoin-bip84';
import Validator from 'multicoin-address-validator';

const constants = require('dogecoin-bip84/src/constants');
const networks = require('bitcoinjs-lib/src/networks');

// Override testnet values to use with BCY bip84 and bip44
constants.NETWORKS.testnet.wif = networks.testnet.wif = 0x49; // eslint-disable-line
constants.NETWORKS.testnet.pubKeyHash = networks.testnet.pubKeyHash = 0x1b; // eslint-disable-line
constants.NETWORKS.testnet.scriptHash = networks.testnet.scriptHash = 0x1f; // eslint-disable-line
// Hack bitcoinjs-lib values to use with mainnet bip84 and bip44
networks.dogecoin = { ...constants.NETWORKS.mainnet };
networks.dogecoin.wif = networks.bitcoin.wif;

export function generateWallet(phrase, bip84 = false) {
  let addr;
  let priv;
  let pub;

  if (!bip84) {
    // Generate bip32 priv, pub and address
    const root = bip32.fromSeed(bip39.mnemonicToSeedSync(phrase));
    const child = root.derivePath("m/44'/3'/0'/0/0");
    priv = child.toWIF();
    pub = root.publicKey.toString('hex'); // Store the root public key so we can identify all addresses generated from this root in the future
    const network =
      process.env.USE_TESTNET === 'true' ? networks.testnet : networks.dogecoin;
    addr = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network,
    }).address;
  } else {
    // Generate using BIP84
    const root = new FromMnemonic(
      phrase,
      '',
      process.env.USE_TESTNET === 'true'
    );
    const child = root.deriveAccount(0);
    const account = new FromZPrv(child);
    priv = account.getPrivateKey(0).toString('hex');
    pub = account.getPublicKey(0).toString('hex');
    addr = account.getAddress(0, false, 44);
  }
  return { addr, priv, pub };
}

export function fromWIF(wif, bip84 = false) {
  const network =
    process.env.USE_TESTNET === 'true' ? networks.testnet : networks.dogecoin;
  // Override WIF for bip84 mainnet
  if (bip84 && process.env.USE_TESTNET !== 'true') {
    network.wif = constants.NETWORKS.mainnet.wif;
  } else if (!bip84 && process.env.USE_TESTNET === 'true') {
    // needed for BCY testnet because bip44 address uses bitcoin wif
    network.wif = networks.bitcoin.wif;
  }

  return new bitcoin.ECPair.fromWIF(wif, network); // eslint-disable-line
}

export function validateAddress(data) {
  return process.env.USE_TESTNET === 'true'
    ? true
    : Validator.validate(data, 'doge', 'prod');
}
