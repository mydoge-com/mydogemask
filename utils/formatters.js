import sb from 'satoshi-bitcoin';

// Get user's decimal separator based on locale
function getLocaleDecimalSeparator() {
  const n = 1.1;
  return n.toLocaleString().substring(1, 2);
}

/**
 * Sanitize user input for DOGE amounts
 * Removes leading zeros, errant decimals, invalid characters
 * Understands commas as decimals depending on user locale
 * @param {string} value
 * @returns {string}
 */

export function sanitizeDogeInput(value = '') {
  const { decimalSeparator = '.' } = getLocaleDecimalSeparator();
  let counter = 0;
  const newValue = String(value).replace(
    new RegExp(`[^0-9\\${decimalSeparator}]|\\${decimalSeparator}`, 'g'), // removes any non 0-9/decimal characters
    ($0) => {
      if ($0 === decimalSeparator) {
        // dot found and counter is not incremented
        // that means we met first dot and we want to keep it
        if (!counter) {
          counter++;
          return decimalSeparator;
        }
      }
      return ''; // if we find anything else, let's erase it
    }
  );

  // Max decimal length
  const split = newValue.split(decimalSeparator);
  if (split[1]?.length > 8) {
    return `${split[0]}${decimalSeparator}${split[1].substring(0, 8)}`;
  }

  // Below logic removes trailing zeroes and errant decimals
  if (
    newValue.length > 1 &&
    newValue.substring(0, 1) === '0' &&
    newValue.substring(1, 2) !== decimalSeparator
  ) {
    return sanitizeDogeInput(newValue.substring(1));
  }

  if (
    newValue.substring(newValue.length - 1, newValue.length) ===
      decimalSeparator &&
    newValue.indexOf(decimalSeparator) !== newValue.length - 1
  ) {
    return newValue.substring(0, newValue.length - 1);
  }

  if (newValue.substring(0, 1) === decimalSeparator) {
    return `0${newValue}`;
  }

  return newValue;
}

export function sanitizeFiat(value, prevValue, isDeletion) {
  const { decimalSeparator = '.' } = getLocaleDecimalSeparator();
  let counter = 0;
  let newValue = String(value).replace(
    new RegExp(`[^0-9\\${decimalSeparator}]|\\${decimalSeparator}`, 'g'), // removes any non 0-9/decimal characters
    ($0) => {
      if ($0 === decimalSeparator) {
        // dot found and counter is not incremented
        // that means we met first dot and we want to keep it
        if (!counter) {
          counter++;
          return decimalSeparator;
        }
      }
      return ''; // if we find anything else, let's erase it
    }
  );
  if (!newValue) return `0${decimalSeparator}00`;
  // if we removed stuff and it's the same as before, don't do the math below
  if (newValue === prevValue) return prevValue;
  newValue = newValue.replace(`${decimalSeparator}`, '.');
  if (isDeletion) {
    return (parseFloat(newValue) / 10)
      .toFixed(2)
      .toString()
      .replace('.', `${decimalSeparator}`);
  }
  return (parseFloat(newValue) * 10)
    .toFixed(2)
    .toString()
    .replace('.', `${decimalSeparator}`);
}

/**
 * Format satoshi values for display (convert to whole doge, can specify max decimals)
 * Also uses the decimal separator that matches user's locale
 * @param {string} value
 * @param {integer} [maxDecimals]
 * @returns {string}
 */
export function formatSatoshisAsDoge(value, maxDecimals) {
  const newValue = sb.toBitcoin(value);
  return formatDoge(newValue, maxDecimals);
}

export function formatSatoshisAsFiat(value, usdValue) {
  const { decimalSeparator = '.' } = getLocaleDecimalSeparator(); // get user's decimal separator based on locale
  let newValue = sb.toBitcoin(value) * usdValue;
  newValue = newValue.toFixed(6).replace('.', decimalSeparator);
  return newValue;
}

export function formatDoge(value, maxDecimals, useGrouping) {
  let newValue = value;
  const opts = {};
  if (maxDecimals !== undefined) {
    opts.maximumFractionDigits = maxDecimals;
  }
  if (useGrouping !== undefined) {
    opts.useGrouping = useGrouping;
  }
  // show 4.20 instead of 4.2
  if (newValue === 4.2) {
    opts.minimumFractionDigits = 2;
  }
  newValue = newValue.toLocaleString(undefined, opts);
  return newValue;
}

// Should we show special 420 effect for this value?
// (Expects value to have been formatted via formatSatoshisAsDoge/sanitizeDogeInput)
export function is420(value = '', useDecimal = false) {
  const strValue = String(value); // just in case
  const { decimalSeparator = '.' } = useDecimal
    ? '.'
    : getLocaleDecimalSeparator(); // get user's decimal separator based on locale
  if (
    strValue === '420' ||
    strValue === `4${decimalSeparator}20` ||
    strValue.indexOf(`420${decimalSeparator}`) === 0 ||
    strValue === `0${decimalSeparator}420` ||
    strValue === `${decimalSeparator}420`
  ) {
    return true;
  } else {
    return false;
  }
}

// Should we show special 69 effect for this value?
// (Expects value to have been formatted via formatSatoshisAsDoge/sanitizeDogeInput)
export function is69(value = '', useDecimal = false) {
  const strValue = String(value); // just in case
  const { decimalSeparator = '.' } = useDecimal
    ? '.'
    : getLocaleDecimalSeparator(); // get user's decimal separator based on locale
  if (
    strValue === '69' ||
    strValue === `6${decimalSeparator}9` ||
    strValue === `0${decimalSeparator}69` ||
    strValue.indexOf(`69${decimalSeparator}`) === 0 ||
    strValue === `0${decimalSeparator}69` ||
    strValue === `${decimalSeparator}69`
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * Removes trailing zeros after decimal
 * Not currently using this function for anything, but may be useful at some point
 * @param {string} value
 * @returns {string}
 */
export function removeTrailingZeros(value = '0') {
  return String(value).replace(/(\.[0-9]*[1-9])0+$|\.0*$/, '$1');
}

// https://stackoverflow.com/questions/9553354/how-do-i-get-the-decimal-places-of-a-floating-point-number-in-javascript
export function precision(a) {
  // Avoid infinite loop
  if (Number.isNaN(a)) {
    return 0;
  }
  let e = 1;
  while (Math.round(a * e) / e !== a) e *= 10;
  return Math.log(e) / Math.LN10;
}

export function asFiat(value, digits = 2) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
