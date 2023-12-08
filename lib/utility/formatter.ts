/**
 * Formats the input number
 * @param {number|string} num - The number to be formatted
 * @param {boolean} [toCurrency=true] - Indicates whether the number should be formatted as currency
 * @return {string} - The formatted number as a string
 */
// (?<!\.) <- will not work in safari
export const formatNumber = (
  num: string | number,
  toCurrency = true,
  total = false
): string => {
  if (toCurrency && !total) {
    // keep for reference later on
    // const usaNumberFormat = new Intl.NumberFormat('en-US', {
    //   style: 'decimal',
    //   maximumFractionDigits: 2,
    // });
    return (
      num
        .toString()
        .replace(/[^\d.-]/g, '')
        // .replace(/^(-)?|[^\d.]/g, '$1')
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        .replace(/\.\d{2}(\d+)/g, '$2')
    );
  } else if (toCurrency && total) {
    return Number(num.toString().replace(/[$\s,]/g, '')).toLocaleString(
      'en-US',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  } else {
    return num
      .toString()
      .replace(/[$\s,]/g, '')
      .replace(/\.(\d{2})(\d+)/g, '$1');
  }
};

/**
 * Formats a name to be used as an ID
 * @param {string} name - The name to format
 * @return {string} - The formatted name with all lowercase letters, spaces replaced with underscores, and ampersands replaced with "and"
 */
export const formatNameForID = (name: string): string => {
  return name.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and');
};

/**
 * Formats a friendly name from an id name
 * @param {string} string - The name to format
 * @return {string} - The formatted friendly string.
 */
export const formatFriendly = (string: string): string => {
  return string
    .replaceAll('-', ' ')
    .split(' ')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a phone number string with parentheses and hyphens.
 *
 * @param {string} string - The phone number to format.
 * @returns {string} The formatted phone number with parentheses and hyphens.
 */
export const formatPhoneNumber = (
  string: string | undefined
): string | undefined => {
  if (!string) return undefined;
  // Format the phone number input with parentheses and hyphens
  let formattedValue = string
    .replace(/\D/g, '') // Remove all non-digits
    .substring(0, 10); // Limit input to 10 digits

  if (formattedValue.length > 3) {
    formattedValue =
      '(' + formattedValue.substring(0, 3) + ') ' + formattedValue.substring(3);
  }

  if (formattedValue.length > 9) {
    formattedValue =
      formattedValue.substring(0, 9) + '-' + formattedValue.substring(9);
  }

  return formattedValue;
};
