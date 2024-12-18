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
export function sanitizeDogeInput(value = '', decimals = 8) {
  const { decimalSeparator = '.' } = getLocaleDecimalSeparator(); // Retrieve locale-specific decimal separator
  let decimalCount = 0; // Tracks the number of decimal separators

  // Remove invalid characters and conditionally allow the decimal separator
  const sanitizedValue = String(value).replace(
    new RegExp(`[^0-9\\${decimalSeparator}]|\\${decimalSeparator}`, 'g'),
    (char) => {
      if (char === decimalSeparator) {
        if (decimals === 0) {
          return ''; // Disallow decimal separator when decimals are not allowed
        }
        if (decimalCount === 0) {
          decimalCount++;
          return decimalSeparator; // Keep the first decimal separator
        }
        return ''; // Remove subsequent decimal separators
      }
      return char; // Keep valid numeric characters
    }
  );

  // Split the sanitized value into integer and fractional parts
  const [integerPart, fractionalPart] = sanitizedValue.split(decimalSeparator);

  // Truncate fractional part to the specified number of decimal places
  const truncatedFractionalPart =
    fractionalPart?.length > decimals
      ? fractionalPart.substring(0, decimals)
      : fractionalPart;

  // Handle the integer part
  let result = integerPart || ''; // Default to an empty string if no integer part

  // Append the decimal separator and fractional part if present
  if (truncatedFractionalPart !== undefined) {
    result += `${decimalSeparator}${truncatedFractionalPart}`;
  }

  // Ensure `0` is added only when the input starts with the decimal separator
  if (result.startsWith(decimalSeparator)) {
    result = `0${result}`;
  }

  // Remove leading zeros in the integer part, unless it's just a single '0'
  if (
    result.length > 1 &&
    result.startsWith('0') &&
    result[1] !== decimalSeparator
  ) {
    result = result.substring(1);
  }

  return result;
}

/**
 * Sanitize user input for fiat amounts
 * Removes leading zeros, errant decimals, invalid characters
 * Understands commas as decimals depending on user locale
 * @param {string} value - The input value to sanitize
 * @returns {string}
 */
export function sanitizeFiat(value = '', decimals = 2) {
  const { decimalSeparator = '.' } = getLocaleDecimalSeparator(); // Retrieve locale-specific decimal separator
  let decimalCount = 0; // Tracks the number of decimal separators

  // Remove invalid characters and conditionally allow the decimal separator
  const sanitizedValue = String(value).replace(
    new RegExp(`[^0-9\\${decimalSeparator}]|\\${decimalSeparator}`, 'g'),
    (char) => {
      if (char === decimalSeparator) {
        if (decimals === 0) {
          return ''; // Disallow decimal separator when decimals are not allowed
        }
        if (decimalCount === 0) {
          decimalCount++;
          return decimalSeparator; // Keep the first decimal separator
        }
        return ''; // Remove subsequent decimal separators
      }
      return char; // Keep valid numeric characters
    }
  );

  // Split the sanitized value into integer and fractional parts
  const [integerPart, fractionalPart] = sanitizedValue.split(decimalSeparator);

  // Truncate fractional part to the specified number of decimal places
  const truncatedFractionalPart =
    fractionalPart?.length > decimals
      ? fractionalPart.substring(0, decimals)
      : fractionalPart;

  // Handle the integer part
  let result = integerPart || ''; // Default to an empty string if no integer part

  // Append the decimal separator and fractional part if present
  if (truncatedFractionalPart !== undefined) {
    result += `${decimalSeparator}${truncatedFractionalPart}`;
  }

  // Ensure `0` is added only when the input starts with the decimal separator
  if (result.startsWith(decimalSeparator)) {
    result = `0${result}`;
  }

  // Remove leading zeros in the integer part, unless it's just a single '0'
  if (
    result.length > 1 &&
    result.startsWith('0') &&
    result[1] !== decimalSeparator
  ) {
    result = result.substring(1);
  }

  return result;
}

/**
 * Format satoshi values for display (convert to whole doge, can specify max decimals)
 * Also uses the decimal separator that matches user's locale
 * @param {string} value
 * @param {integer} [maxDecimals]
 * @returns {string}
 */
export function formatSatoshisAsDoge(value, maxDecimals) {
  if (value >= 1) {
    const newValue = sb.toBitcoin(Math.floor(value));
    return formatDoge(newValue, maxDecimals);
  } else {
    return formatDoge(value / 1e8, 10);
  }
}

export function formatSatoshisAsFiat(value, usdValue) {
  const { decimalSeparator = '.' } = getLocaleDecimalSeparator(); // get user's decimal separator based on locale
  let newValue = sb.toBitcoin(value) * usdValue;
  newValue = newValue.toFixed(6).replace('.', decimalSeparator);
  return newValue;
}

export const formatCompactNumber = (num, decimals = 1) => {
  const suffixes = ['', 'k', 'm', 'billion', 'trillion'];
  const absNum = Math.abs(num);

  if (absNum < 1000) return num.toFixed(decimals);

  const exp = Math.min(Math.floor(Math.log10(absNum) / 3), suffixes.length - 1);
  const shortened = num / 1000 ** exp;

  return `${shortened.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })} ${suffixes[exp]}`;
};

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
