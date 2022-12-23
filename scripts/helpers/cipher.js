// Helper functions for hashing, encryption and decryption

import * as CryptoJS from 'crypto-js';

const JSONFormatter = {
  stringify(cipherParams) {
    // create json object with ciphertext
    const jsonObj = {
      ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64),
    };
    // optionally add iv or salt
    if (cipherParams.iv) {
      jsonObj.iv = cipherParams.iv.toString();
    }
    if (cipherParams.salt) {
      jsonObj.s = cipherParams.salt.toString();
    }
    // stringify json object
    return JSON.stringify(jsonObj);
  },
  parse(jsonStr) {
    // parse json string
    const jsonObj = JSON.parse(jsonStr);
    // extract ciphertext from json object, and create cipher params object
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct),
    });
    // optionally extract iv or salt
    if (jsonObj.iv) {
      cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
    }
    if (jsonObj.s) {
      cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
    }

    return cipherParams;
  },
};

export const encrypt = ({ data, password }) => {
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), password, {
    format: JSONFormatter,
  });
  return encrypted.toString();
};

export const decrypt = ({ data, password }) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(data, password, {
      format: JSONFormatter,
    });
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    return null;
  }
};

export const hash = (password) => {
  return CryptoJS.SHA256(password).toString();
};
