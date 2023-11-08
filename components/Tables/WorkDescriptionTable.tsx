import { Fragment, useCallback, useState } from 'react';

import {
  formatNameForID,
  formatNumber,
  formatPhoneNumber,
} from '@/lib/utility/formatter';
import { checkExpirationDate, formatDate } from '@/lib/utility/tableHelpers';
import { ChangeOrderContentItem } from '@/lib/models/changeOrderModel';
import { useCreateChangeOrderTable } from '@/lib/utility/changeOrderHelpers';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';
import { ChangeOrderSummary } from '@/lib/models/summaryDataModel';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface CheckBoxItems {
  label: string;
  buttonPath: string;
  disabled?: boolean;
}

interface Props {
  headings: Headings;
  isChangeOrderTable: boolean;
  tableData: ChangeOrderSummary | null;
  selectedRowId?: string | undefined | null;
  checkboxButtons?: CheckBoxItems[];
  showExpiration?: boolean;
  isRowLinked?: boolean;
}

type Headings = {
  [key: string]: string;
};

export default function WorkDescriptionTable(props: Props) {
  const {
    headings,
    selectedRowId,
    showExpiration,
    tableData,
    isChangeOrderTable,
  } = props;

  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleHeadingClick = useCallback(
    (heading: string) => {
      const entry = Object.entries(headings).find(
        ([_, value]) => value === heading
      );
      const key = entry ? (entry[0] as keyof ChangeOrderContentItem) : null;
      if (sortKey === key) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      }
      setActiveHeading(heading);
      setSortKey(key);
    },
    [sortOrder, sortKey, headings]
  );

  const changeOrderTable = useCreateChangeOrderTable({
    groupedRowCategories: ['Invoices', 'Labor and Fees'],
    clickedChangeOrderId: selectedRowId as string,
    sortKey,
    sortOrder,
    tableData,
  });
  const groupedRows: Record<string, any> | null = isChangeOrderTable
    ? changeOrderTable
    : null;

  const commonHeadingClasses =
    'sticky w-fit max-w-[17rem] top-0 z-10 border-b border-gray-300 bg-white bg-opacity-80 text-left text-sm uppercase font-bold backdrop-blur backdrop-filter text-stak-dark-green';
  const firstHeadingClasses = 'py-3.5 pl-4 pr-3 rounded-tl-lg sm:pl-6 lg:pl-8';
  const middleHeadingClasses = 'px-3 py-3.5';
  const lastHeadingClasses = 'py-3.5 pl-3 pr-3 rounded-tr-lg sm:pr-6 lg:pr-6';

  const commonColClasses =
    'border-b max-w-[10rem] overflow-x-scroll border-gray-200 whitespace-nowrap text-sm text-gray-500';
  const firstColClasses = 'py-2 pl-4 pr-3  sm:pl-6 lg:pl-8';
  const middleColClasses = 'py-1 px-3';
  const lastColClasses = 'py-2 pr-4 pl-3 sm:pr-6 lg:pr-6';

  return (
    <>
      <div className="px-4 grow sm:px-6 lg:px-8">
        <div className="mt-2 flow-root">
          <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full align-middle">
              <div className="relative">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      {Object.values(headings).map((heading, i) => {
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
                  {groupedRows && (
                    <tbody>
                      {Object.entries(groupedRows).map(
                        ([group, value]: [string, any]) => {
                          return (
                            <Fragment key={group}>
                              <tr className="border-t border-gray-200">
                                <th
                                  colSpan={Object.keys(headings).length}
                                  scope="colgroup"
                                  className="bg-gray-50 py-2 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                                >
                                  {group}
                                </th>
                              </tr>

                              {value.map((element: any, i: number) => {
                                return (
                                  <tr
                                    key={`${element.uuid as string}_${i}`}
                                    className="hover:bg-slate-100"
                                  >
                                    {Object.keys(headings).map(
                                      (headingsKey, j) => {
                                        {
                                          return (
                                            <td
                                              key={`${headingsKey}_${j}`}
                                              className={classNames(
                                                j === 0
                                                  ? firstColClasses
                                                  : j === value.length - 1
                                                  ? lastColClasses
                                                  : middleColClasses,
                                                commonColClasses,
                                                showExpiration &&
                                                  checkExpirationDate(
                                                    headingsKey,
                                                    element
                                                  )
                                                  ? 'text-red-500'
                                                  : ''
                                              )}
                                            >
                                              {headingsKey.endsWith('Amt')
                                                ? formatNumber(
                                                    element[
                                                      headingsKey
                                                    ] as string
                                                  )
                                                : headingsKey.endsWith('Phone')
                                                ? formatPhoneNumber(
                                                    element[
                                                      headingsKey
                                                    ] as string
                                                  )
                                                : headingsKey
                                                    .toLowerCase()
                                                    .includes('date')
                                                ? formatDate(
                                                    element[
                                                      headingsKey
                                                    ] as string
                                                  )
                                                : element[headingsKey]}
                                            </td>
                                          );
                                        }
                                      }
                                    )}
                                  </tr>
                                );
                              })}
                            </Fragment>
                          );
                        }
                      )}
                    </tbody>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
