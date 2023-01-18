import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import * as Validator from 'multicoin-address-validator';
import sb from 'satoshi-bitcoin';

// Dogecoin mainnet
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
  } else if (!Number(dogeAmount)) {
    return 'Invalid Doge amount';
  } else if (Number(dogeAmount) > sb.toBitcoin(addressBalance)) {
    return 'Insufficient balance';
  }
  return undefined;
};
