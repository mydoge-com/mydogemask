import { Mnemonic } from './jsbip39';

const NUM_WORDS = 12;

const mnemonic = new Mnemonic('english');

function hasStrongRandom() {
  return 'crypto' in window && window.crypto !== null;
}

export function generateRandomPhrase() {
  if (!hasStrongRandom()) {
    throw new Error('This browser does not support strong randomness');
  }
  // get the amount of entropy to use
  const strength = (NUM_WORDS / 3) * 32;
  const buffer = new Uint8Array(strength / 8);
  // create secure entropy
  const data = crypto.getRandomValues(buffer);
  const words = mnemonic.toMnemonic(data);
  return words;
}
