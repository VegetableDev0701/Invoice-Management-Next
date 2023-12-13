import { FadeLoader } from 'react-spinners';
import { SelectMenuOptions } from '../models/formDataModel';
import { InvoiceTableRow } from '../models/invoiceDataModels';
import {
  ChangeOrderSummary,
  ProjectSummary,
  ProjectSummaryItem,
  VendorSummary,
  VendorSummaryItem,
} from '../models/summaryDataModel';

/**
 * Runs a quick check if the expriation date has passed.
 * @param heading
 * @param element
 * @returns
 */
export const checkExpirationDate = (heading: string, element: any) => {
  if (heading.endsWith('Date')) {
    const expirationDate = new Date(
      element[heading as keyof InvoiceTableRow] as string
    );
    const currentDate = new Date();
    return expirationDate < currentDate;
  }
  return false;
};

/**
 * Sorts an array of objects based on a key.
 * @param array An array of objects
 * @param keyName The key name of the object to sort by
 * @returns Sorted array of objects
 */
interface HasKey {
  [key: string]: any;
}

export function sortArrayByObjKey<T extends HasKey>(
  array: T[],
  keyName: keyof T,
  forceToTopName: string
) {
  return array.sort((a, b) => {
    if (a[keyName] === forceToTopName) {
      return -1;
    }
    if (b[keyName] === forceToTopName) {
      return 1;
    }
    return String(a[keyName]).localeCompare(String(b[keyName]));
  });
}

export function sortArrayById<T extends HasKey>(array: T[]) {
  return array.sort((a, b) => {
    return a.id - b.id;
  });
}

export function hasAnyExpiredDates(object: VendorSummary) {
  const currentDate = new Date();
  const expiredObjects: Record<string, VendorSummaryItem> = {};

  Object.entries(object).forEach(
    ([key, element]: [string, VendorSummaryItem]) => {
      const hasExpired = Object.entries(element).some(
        ([key, value]: [string, string | boolean]) => {
          if (key.endsWith('ExpirationDate')) {
            if (value) {
              const date = new Date(value as string);
              return date < currentDate;
            } else {
              return false;
            }
          }
          return false;
        }
      );

      if (hasExpired) {
        expiredObjects[key] = element;
      }
    }
  );

  return expiredObjects;
}

export function getActiveProjects(
  object: ProjectSummary,
  keyName: string,
  getActive: boolean
) {
  const filteredProjects: Record<string, ProjectSummaryItem> = {};

  Object.entries(object[keyName]).forEach(([key, element]) => {
    const hasInactive = Object.entries(element).find(([key, value]) => {
      if (key === 'isActive') {
        return value;
      }
    });

    if (getActive) {
      if (hasInactive) {
        filteredProjects[key] = element;
      }
    } else {
      if (!hasInactive) {
        filteredProjects[key] = element;
      }
    }
  });

  return filteredProjects;
}

export function convertUtcToLocalTime(
  utcTime: string,
  targetTimezone: string,
  dateOnly = true
) {
  const date = new Date(utcTime);
  let options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  if (!dateOnly) {
    options = {
      ...options,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
  }
  let formattedDate = new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: targetTimezone,
  }).format(date);
  const dateStrParts = formattedDate.split('/');
  formattedDate = `${dateStrParts[2]}-${dateStrParts[0]}-${dateStrParts[1]}`;
  return formattedDate.replaceAll('/', '-');
}

/**
 * Format a string date to %m-%d-%Y format
 */
export function formatDate(date: string | undefined) {
  if (!date) {
    return;
  }
  const dateObj = new Date(date);
  return `${('0' + (dateObj.getMonth() + 1)).slice(-2)}-${(
    '0' + dateObj.getDate()
  ).slice(-2)}-${dateObj.getFullYear()}`;
}

/**
 * Helper function to make all the first letters capatilzed
 * @param words String
 * @returns
 */
export function titleCase(words: string) {
  // Words to skip
  const skipWords = ['and', 'or'];

  // Words to stay all capitalized
  const allCapsWords = ['LLC'];

  if (!words || typeof words !== 'string') {
    return '';
  }

  return words
    .toLowerCase()
    .split(' ')
    .map(function (word) {
      // If the word is in the skip list, return as is
      if (skipWords.includes(word)) return word;

      // If the word is in the all caps list, return as all caps
      if (allCapsWords.includes(word)) return word.toUpperCase();

      // Otherwise, capitalize the first letter of the word
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Grabs a list of active projects used to populate project list.
 * @param projects Object with all the project summary data
 */
export function getProjectNamesForDropdown(
  projects: ProjectSummary
): SelectMenuOptions[] {
  let count = 0;
  const projectSelectMenu: SelectMenuOptions[] = projects
    ? Object.values(projects)
        .filter((project) => project.isActive)
        .map((project) => {
          count++;
          return {
            id: count,
            label: project.projectName as string,
            project_uuid: project.uuid as string,
          };
        })
    : [];
  return [{ id: 0, label: 'Unassign' }, ...projectSelectMenu];
}

export function filterData<T>(
  data: T[],
  activeFilter: string,
  noFilterKey: string,
  filterColumn: keyof T
) {
  if (activeFilter !== noFilterKey) {
    return [...data].filter((row) => row[filterColumn] === activeFilter);
  } else {
    return data;
  }
}

export const getChangeOrderNameFromId = (
  changeOrderSummary: ChangeOrderSummary | undefined,
  changeOrderId: string | undefined | null
) => {
  if (changeOrderSummary && changeOrderId) {
    return changeOrderSummary[changeOrderId].name;
  } else {
    return null;
  }
};

export const getAllChangeOrderNames = ({
  changeOrdersSummary,
}: {
  changeOrdersSummary: ChangeOrderSummary;
}): SelectMenuOptions[] => {
  let count = 0;
  const changeOrdersSelectMenuOptions: SelectMenuOptions[] = Object.values(
    changeOrdersSummary
  ).map((changeOrder) => {
    count++;
    return {
      id: count,
      label: changeOrder.name as string,
    };
  });
  return [{ id: 0, label: 'None' }, ...changeOrdersSelectMenuOptions];
};

export const getAllVendorNames = ({
  vendorSummary,
}: {
  vendorSummary: VendorSummary;
}) => {
  let count = 0;
  const vendorSelectMenuOptions: SelectMenuOptions[] = vendorSummary
    ? Object.values(vendorSummary).map((vendor) => {
        count++;
        return {
          id: count,
          label: vendor.vendorName,
          uuid: vendor.uuid,
        };
      })
    : [];
  return vendorSelectMenuOptions;
};

export const sortTableData = <T, H extends Partial<T>>(
  data: T[],
  sortKey: keyof H,
  sortOrder: 'asc' | 'desc'
) => {
  return data.sort((a, b) => {
    const aValue = a[sortKey as keyof T];
    const bValue = b[sortKey as keyof T];
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      if (
        sortKey.toString().endsWith('Amt') ||
        sortKey.toString().endsWith('amount')
      ) {
        const numA = +aValue.replaceAll(',', '');
        const numB = +bValue.replaceAll(',', '');
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }
      if (sortKey.toString().toLowerCase().includes('date')) {
        const dateA = new Date(aValue).valueOf();
        const dateB = new Date(bValue).valueOf();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return sortOrder === 'asc'
      ? String(a[sortKey as keyof T]).localeCompare(
          String(b[sortKey as keyof T])
        )
      : String(b[sortKey as keyof T]).localeCompare(
          String(a[sortKey as keyof T])
        );
  });
};

export const yesNoBadge = ({
  value,
  positiveText,
  negativeText,
  isLoading,
}: {
  value: string | null | undefined;
  positiveText: string;
  negativeText: string;
  isLoading?: boolean;
}) => {
  if (
    typeof value === 'string' &&
    (value.toLowerCase() === 'yes' || value.toLowerCase() !== 'no')
  ) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
        {positiveText}
      </span>
    );
  } else if (
    !value ||
    (typeof value === 'string' && value.toLowerCase() === 'no')
  ) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
        {!isLoading && negativeText}
        {isLoading && (
          <FadeLoader
            color="#000"
            cssOverride={{
              scale: '0.26',
              width: '60px',
              height: '15px',
              top: '-1px',
              left: '8px',
            }}
          />
        )}
      </span>
    );
  }
};
