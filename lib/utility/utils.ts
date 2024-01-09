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

export function formatDateForInput(dateStr: string, dateTime = false) {
  let date = new Date(dateTime ? dateStr : dateStr + ' ');
  if (isNaN(date.getTime())) {
    date = new Date(dateStr);
  }
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

function _findMode<T extends { toString(): string }>(arr: T[]): T {
  const frequencyMap: Record<string, number> = {};
  let maxFreq = 0;
  const modes: T[] = [];

  for (const item of arr) {
    const key = item.toString();
    frequencyMap[key] = (frequencyMap[key] || 0) + 1;
    if (frequencyMap[key] > maxFreq) {
      maxFreq = frequencyMap[key];
    }
  }

  for (const key in frequencyMap) {
    if (frequencyMap[key] === maxFreq) {
      // Assuming the `toString` mapping is reversible and accurate for the type T
      modes.push(arr.find((i) => i.toString() === key) as T);
    }
  }

  return modes[0];
}

export function generateBillingDate({
  // billingPeriod,
  billingDay,
  currentBillMonth,
  currentBillYear,
}: {
  // billingPeriod: string;
  billingDay: string;
  currentBillMonth: string;
  currentBillYear: string;
}) {
  const billingDayInt = parseInt(billingDay);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const maxDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const currentBillDay =
    billingDayInt > maxDaysInMonth ? maxDaysInMonth : billingDayInt;

  return `${currentBillYear}-${currentBillMonth}-${currentBillDay}`;
}

export function getMonthNumber(monthName: string) {
  const months: Record<string, number> = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  return months[monthName];
}
