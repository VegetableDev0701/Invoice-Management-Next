// does the equivalent of pythons zip function
export function zip(...lists: string[][]) {
  let length = Math.min(...lists.map((arr) => arr.length));
  let result = Array(length);
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