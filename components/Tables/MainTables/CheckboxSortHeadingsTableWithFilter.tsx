import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { useAppSelector as useSelector } from '@/store/hooks';

import {
  formatNameForID,
  formatNumber,
  formatPhoneNumber,
} from '@/lib/utility/formatter';
import {
  checkExpirationDate,
  formatDate,
  sortTableData,
  yesNoBadge,
} from '@/lib/utility/tableHelpers';
import {
  ProjectSummaryItem,
  VendorSummaryItem,
} from '@/lib/models/summaryDataModel';
import { InvoiceTableRow } from '@/lib/models/invoiceDataModels';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';
import Button from '../../UI/Buttons/Button';
import EmptyTableNotification, { TableType } from '../EmptyTableNotification';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface CheckBoxItems {
  label: string;
  buttonPath: string;
  disabled?: boolean;
}

export type ExtendT = {
  uuid: string;
  [key: string]: string;
};

interface Props<
  T extends ExtendT | InvoiceTableRow | ProjectSummaryItem | VendorSummaryItem,
  H extends Partial<T>,
> {
  headings: H;
  rows: T[] | null | undefined;
  checkboxButtons?: CheckBoxItems[];
  activeFilter?: string;
  activeTabKeyName?: string;
  filterKey?: string;
  projectId?: string;
  selectedRowId?: string | undefined | null;
  baseUrl?: string;
  preSortKey?: keyof H;
  tableType?: TableType;
  onButtonClick?: (label: string, selected: T[]) => void;
  onRowClick?: (uuid: string) => void;
}

export default function CheckboxSortHeadingsTable<
  T extends ExtendT | InvoiceTableRow | ProjectSummaryItem | VendorSummaryItem,
  H extends Partial<T>,
>(props: Props<T, H>) {
  const {
    headings,
    rows,
    activeFilter,
    activeTabKeyName,
    checkboxButtons,
    filterKey,
    baseUrl,
    selectedRowId,
    preSortKey,
    tableType,
    onButtonClick,
    onRowClick,
  } = props;

  const checkbox = useRef<HTMLInputElement | null>(null);

  const tasksInProgress = useSelector((state) => state.ui.tasksInProgress);

  const [activeHeading, setActiveHeading] = useState<keyof H | null>(null);
  const [sortKey, setSortKey] = useState<keyof H | null | undefined>(
    preSortKey
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [selected, setSelected] = useState<T[]>([]);

  const [lastIndex, setLastIndex] = useState(-1);
  useLayoutEffect(() => {
    if (!rows) return;
    const isIndeterminate =
      selected.length > 0 && selected.length < rows.length;
    setChecked(selected.length === rows.length);
    setIndeterminate(isIndeterminate);
    if (checkbox.current) {
      checkbox.current.indeterminate = isIndeterminate;
    }
  }, [selected]);
  function toggleAll() {
    if (!rows) return;
    setSelected(checked || indeterminate ? [] : rows);
    setChecked(!checked && !indeterminate);
    setIndeterminate(false);
  }

  const handleHeadingClick = useCallback(
    (heading: keyof H) => {
      const entry = Object.entries(headings).find(
        ([_, value]) => value === heading
      );
      const key = entry ? (entry[0] as keyof H) : null;
      if (sortKey === key) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      }
      setActiveHeading(heading);
      setSortKey(key);
    },
    [sortOrder, sortKey]
  );

  const stopPropClickHandler: React.MouseEventHandler<
    HTMLButtonElement | HTMLDivElement
  > = (e) => {
    e.stopPropagation();
  };

  const filteredSortedData: T[] | null = useMemo(() => {
    if (!rows) return null;
    let filteredData = rows;
    if (filterKey && activeFilter !== 'No Filter') {
      filteredData = rows.filter(
        (row) => (row as ExtendT)[filterKey] === activeFilter
      );
    }
    if (!sortKey) {
      return filteredData;
    }
    return sortTableData(filteredData, sortKey, sortOrder);
  }, [rows, activeFilter, sortKey, sortOrder]);

  const commonHeadingClasses =
    'sticky max-w-[20rem] top-0 z-10 border-b border-gray-300 bg-white bg-opacity-80 text-left text-sm uppercase font-bold backdrop-blur backdrop-filter text-stak-dark-green';
  const firstHeadingClasses = 'py-3.5 pl-4 pr-3 rounded-tl-lg sm:pl-6 lg:pl-8';
  const middleHeadingClasses = 'px-3 py-3.5';
  const lastHeadingClasses = `py-3.5 pl-3 pr-3 rounded-tr-lg sm:pr-6 lg:pr-6 ${
    tableType === 'vendors' ? 'text-left w-1' : ''
  }`;

  const commonColClasses = `${
    tableType === 'projects' ? 'py-4' : 'py-1'
  } border-b max-w-[17rem] border-gray-200 whitespace-nowrap text-sm text-gray-600`;
  const firstColClasses = 'pl-4 pr-3 sm:pl-6 lg:pl-8';
  const middleColClasses = 'py-1 px-3';
  const lastColClasses = `pr-4 pl-3 sm:pr-6 lg:pr-6 ${
    tableType === 'vendors' ? 'text-left w-1 pr-10' : ''
  }`;

  let tableTypeInstance: TableType = undefined;
  if (tableType === 'vendors') {
    tableTypeInstance =
      activeTabKeyName === 'all'
        ? 'vendors'
        : activeTabKeyName === 'expiredLicense'
        ? 'expiredLicenseVendors'
        : 'isSyncedQB';
  } else if (tableType === 'projects') {
    tableTypeInstance =
      activeTabKeyName === 'active' ? 'projects' : 'completedProjects';
  }

  return (
    <div className="relative px-4 grow sm:px-6 lg:px-8">
      {((activeFilter === 'No Filter' &&
        filteredSortedData &&
        filteredSortedData.length === 0) ||
        !filteredSortedData) && (
        <EmptyTableNotification tableType={tableTypeInstance} />
      )}
      <div className="mt-2 flow-root">
        <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full align-middle">
            <div className="relative">
              {selected.length > 0 && (
                <div className="sticky top-0 z-20">
                  <div className="z-20 absolute left-14 top-0 flex h-12 items-center space-x-3 bg-white sm:left-12">
                    {checkboxButtons &&
                      checkboxButtons.map((button, i) => {
                        return (
                          <Button
                            key={i}
                            buttonText={button.label}
                            disabled={button.disabled}
                            onClick={() => {
                              onButtonClick &&
                                onButtonClick(button.label, selected);
                              toggleAll();
                            }}
                            className="inline-flex items-center px-2 py-1 text-sm font-semibold disabled:cursor-not-allowed"
                          />
                        );
                      })}
                  </div>
                </div>
              )}
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-100 px-7 rounded-tl-lg overflow-hidden sm:w-12 sm:px-6 "
                    >
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-stak-dark-green focus:ring-0 focus:ring-offset-0"
                        ref={checkbox}
                        checked={checked}
                        onChange={toggleAll}
                      />
                    </th>
                    {Object.values(headings).map((heading: any, i) => {
                      return (
                        <th
                          key={`${i}`}
                          scope="col"
                          id={formatNameForID(heading)}
                          className={classNames(
                            i === 0
                              ? firstHeadingClasses
                              : i === Object.values(headings).length - 1
                              ? lastHeadingClasses
                              : middleHeadingClasses,
                            commonHeadingClasses
                          )}
                        >
                          <div
                            onClick={() => handleHeadingClick(heading)}
                            className="group inline-flex hover:cursor-pointer"
                          >
                            {heading}
                            <span
                              className={classNames(
                                activeHeading === heading ? '' : 'invisible',
                                'ml-2 flex-none rounded bg-gray-100 text-gray-400 group-hover:visible group-focus:visible'
                              )}
                            >
                              {sortOrder === 'desc' ? (
                                <ChevronDownIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <ChevronUpIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                {filteredSortedData && (
                  <tbody>
                    {filteredSortedData.map((element: T, index) => {
                      return (
                        <tr
                          key={`${element.uuid as string}_${index}`}
                          className={`hover:bg-slate-50 hover:cursor-pointer ${
                            selected.includes(element)
                              ? 'bg-slate-50'
                              : undefined
                          } ${
                            element.uuid === selectedRowId
                              ? 'bg-slate-200 hover:bg-slate-300'
                              : ''
                          }`}
                          onClick={() => {
                            onRowClick && onRowClick(element.uuid as string);
                          }}
                        >
                          <td
                            onClick={stopPropClickHandler}
                            className="relative border-b border-gray-300 px-7 sm:w-12 sm:px-6"
                          >
                            {selected.includes(element) && (
                              <div className="absolute inset-y-0 left-0 w-0.5 bg-stak-dark-green" />
                            )}
                            <input
                              type="checkbox"
                              className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-stak-dark-green focus:ring-0 focus:ring-offset-0"
                              value={element.uuid as string}
                              checked={selected.includes(element)}
                              onClick={(e) => {
                                if (e.shiftKey) {
                                  const minIndex =
                                    Math.min(lastIndex, index) + 1;
                                  const maxIndex = Math.max(lastIndex, index);
                                  const tmpAry = filteredSortedData.slice(
                                    minIndex,
                                    maxIndex
                                  );
                                  const allSelectFlag: boolean = tmpAry.every(
                                    (el) => {
                                      return (
                                        selected.findIndex(
                                          (ele) => el == ele
                                        ) == -1
                                      );
                                    }
                                  );
                                  let temp: T[] = [];
                                  for (
                                    let idx = 0;
                                    idx < tmpAry.length;
                                    idx++
                                  ) {
                                    const el = tmpAry[idx];
                                    if (allSelectFlag) {
                                      const isChecked = selected.findIndex(
                                        (ele) => ele == el
                                      );
                                      if (isChecked === -1) {
                                        temp.push(el);
                                      }
                                    }
                                  }
                                  const isMaxSel =
                                    selected.findIndex(
                                      (ele) =>
                                        ele == filteredSortedData[lastIndex]
                                    ) == -1;
                                  const isMinSel =
                                    selected.findIndex(
                                      (ele) => ele == filteredSortedData[index]
                                    ) == -1;
                                  if (allSelectFlag) {
                                    if (isMaxSel)
                                      temp.push(filteredSortedData[lastIndex]);
                                    if (isMinSel)
                                      temp.push(filteredSortedData[index]);
                                    setSelected([...selected, ...temp]);
                                  } else {
                                    temp = selected.filter((el) => {
                                      return (
                                        tmpAry.findIndex((ele) => el == ele) ==
                                        -1
                                      );
                                    });
                                    temp = temp.filter(
                                      (el) =>
                                        el != filteredSortedData[lastIndex]
                                    );
                                    temp = temp.filter(
                                      (el) => el != filteredSortedData[index]
                                    );
                                    setSelected([...temp]);
                                  }
                                } else {
                                  const isChecked = selected.findIndex(
                                    (el) => el == element
                                  );
                                  setSelected(
                                    isChecked
                                      ? [...selected, element]
                                      : selected.filter((el) => el !== element)
                                  );
                                }
                                setLastIndex(index);
                              }}
                            />
                          </td>
                          {Object.keys(headings).map((headingsKey, j) => {
                            return (
                              <td
                                key={`${headingsKey}_${j}`}
                                className={classNames(
                                  j === 0
                                    ? firstColClasses
                                    : j === Object.keys(headings).length - 1
                                    ? lastColClasses
                                    : middleColClasses,
                                  commonColClasses,
                                  checkExpirationDate(headingsKey, element)
                                    ? 'text-red-500'
                                    : ''
                                )}
                              >
                                {baseUrl && (
                                  <Link
                                    href={`${baseUrl}/${element.uuid}`}
                                    className="block h-full w-full"
                                  >
                                    <>
                                      {headingsKey.endsWith('Amt')
                                        ? formatNumber(
                                            (element as ExtendT)[
                                              headingsKey
                                            ] as string
                                          )
                                        : headingsKey.endsWith('Phone')
                                        ? formatPhoneNumber(
                                            (element as ExtendT)[
                                              headingsKey
                                            ] as string
                                          )
                                        : headingsKey
                                            .toLowerCase()
                                            .includes('date')
                                        ? formatDate(
                                            (element as ExtendT)[
                                              headingsKey
                                            ] as string
                                          )
                                        : (element as ExtendT)[headingsKey]}
                                    </>
                                  </Link>
                                )}
                                {!baseUrl && (
                                  <>
                                    {headingsKey.endsWith('Amt')
                                      ? formatNumber(
                                          (element as ExtendT)[
                                            headingsKey
                                          ] as string
                                        )
                                      : headingsKey.endsWith('Phone')
                                      ? formatPhoneNumber(
                                          (element as ExtendT)[
                                            headingsKey
                                          ] as string
                                        )
                                      : headingsKey
                                          .toLowerCase()
                                          .includes('date')
                                      ? formatDate(
                                          (element as ExtendT)[
                                            headingsKey
                                          ] as string
                                        )
                                      : headingsKey.includes('agave_uuid')
                                      ? yesNoBadge({
                                          value: (element as ExtendT)[
                                            headingsKey
                                          ],
                                          positiveText: 'Vendor Synced',
                                          negativeText: 'Vendor Not Synced',
                                          isLoading:
                                            tasksInProgress?.[element.uuid],
                                        })
                                      : (element as ExtendT)[headingsKey]}
                                  </>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
