import BigNumber from 'bignumber.js';
export const drcToDec = (val) => {
  if(!val) return '' 
  return new BigNumber(val).dividedBy(new BigNumber(10).pow(8)).toFormat()
}

export const formatNumberDecimal = (num, decimals) => {
  if (isNaN(num)) {
    throw new Error('Invalid number.');
  }

  if (isNaN(decimals) || decimals < 0) {
    throw new Error('Invalid number of decimals.');
  }

  const factor = Math.pow(10, decimals);
  return Math.floor(num * factor) / factor;
}

export const priceFormat = (number) => {
  const num = +number < 0.000001 ? Number(number).toFixed(10) : Number(number).toFixed(8)
  const value =  +num < 0.001 && +num > 0 
    ?  num.replace(num.split('.')[1],num.split('.')[1].replace(/0+/g, (match) => match.length > 3 ? `0{${match.length}}` : match)) 
    : Number(num).toFixed(8);
  return value;
}

export function satoshisToAmount(val) {
  const num = new BigNumber(val);
  return num.dividedBy(100000000).toFixed(8);
}

export const amountToBn = (val) => {
  if(!val) return ''
  return new BigNumber(val).times(new BigNumber(10).pow(8)).integerValue().toString()
}

export const formatAccountAddress = (address) => {
  const result = address.substr(0, 4) + '...' + address.substr(-4)
  return result
}

export const amountToDec = (val) => {
  if(!val) return '' 
  return new BigNumber(val).dividedBy(new BigNumber(10).pow(8))
}

export function shortAddress(address, len = 10) {
  if (!address) return '';
  if (address.length <= len * 2) return address;
  return address.slice(0, len) + '...' + address.slice(address.length - len);
}

export const copyToClipboard = (textToCopy) => {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(textToCopy.toString());
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy.toString();
    textArea.style.position = 'absolute';
    textArea.style.opacity = '0';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((res, rej) => {
      document.execCommand('copy') ? res() : rej();
      textArea.remove();
    });
  }
};