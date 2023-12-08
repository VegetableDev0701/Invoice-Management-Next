// does the equivalent of pythons zip function
export function zip(...lists: string[][]) {
  const length = Math.min(...lists.map((arr) => arr.length));
  const result = Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = lists.map((arr) => arr[i]);
  }
  return result;
}
/**
 * Helper function to snapshot the data at the time
 * it is run. Used for logging objects to the console
 * where you want to see what they are at that point in the code.
 * Also used to create a deep copy.
 * @param data
 * @returns
 */
export function snapshotCopy(data: any) {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Check for duplicates.
 */
export function isDuplicated(value: string, list: string[]): boolean {
  return list.includes(value);
}

/**Helper function to string together classnames */
export function classNames(...classes: Array<string | undefined | false>) {
  return classes.filter((cn) => !!cn).join(' ');
}

export const isObjectEmpty = (object: object) => {
  return JSON.stringify(object) === '{}';
};

export function formatDateForInput(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00');

  // JavaScript months are 0-indexed, so add 1
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function saveToJSONForTesting(fileName: string, data: any) {
  try {
    if (!fileName) {
      throw new Error('Need a fileName');
    }

    // Convert the data to a JSON string
    const jsonData = data
      ? JSON.stringify(data, null, 2)
      : JSON.stringify({}, null, 2);

    // Create a Blob with the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Create an anchor element and set the download attribute
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;

    // Append the anchor to the document and trigger the download
    document.body.appendChild(a);
    a.click();

    // Clean up: remove the anchor from the document
    document.body.removeChild(a);
  } catch (error: any) {
    console.error(error);
  }
}

export function generateTitle(
  number: number | string,
  name: string | undefined,
  condition = (number: number | string) => Number(number) >= 0
) {
  return condition(number) ? `${number} - ${name}` : name || '';
}
