import { Fragment, useCallback, useState } from 'react';

import { formatNameForID, formatNumber } from '@/lib/utility/formatter';
import { ChangeOrderContentItem } from '@/lib/models/changeOrderModel';
import { useCreateClientBillWorkDescription } from '@/lib/utility/clientBillHelpers';
import {
  ChangeOrderSummary,
  ClientBillSummaryItem,
} from '@/lib/models/summaryDataModel';
import {
  BillWorkDescriptionV2,
  SubTotalsV2,
} from '@/lib/models/clientBillModel';
import { classNames } from '@/lib/utility/utils';
import { CurrentActualsChangeOrdersV2 } from '@/lib/models/budgetCostCodeModel';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';

interface Props {
  headings: Headings;
  clientBillSummary: ClientBillSummaryItem;
  subTotals: SubTotalsV2 | null;
  tableData: BillWorkDescriptionV2 | null;
  changeOrderSummary: ChangeOrderSummary;
  currentActualsChangeOrders: CurrentActualsChangeOrdersV2;
  showExpiration?: boolean;
}

type Headings = {
  [key: string]: string;
};

export default function ClientBillWorkDescriptionTable(props: Props) {
  const {
    headings,
    tableData,
    subTotals,
    clientBillSummary,
    changeOrderSummary,
    currentActualsChangeOrders,
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
    [sortOrder, sortKey]
  );
  const groupedRows: Record<string, any> | null =
    useCreateClientBillWorkDescription({
      tableData,
      subTotals,
      clientBillSummary,
      changeOrderSummary,
      currentActualsChangeOrders,
    });

  const areThereChangeOrders =
    groupedRows &&
    groupedRows?.changeOrders &&
    Object.keys(groupedRows.changeOrders).length > 1 // the object will always have a subtotal key but no others if there are no change orders
      ? true
      : false;

  const commonHeadingClasses =
    'sticky w-fit max-w-[17rem] top-0 z-10 border-b border-gray-300 bg-white bg-opacity-80 text-left text-sm uppercase font-bold backdrop-blur backdrop-filter text-stak-dark-green';
  const firstHeadingClasses = 'py-3.5 pl-4 pr-3 rounded-tl-lg sm:pl-6 lg:pl-8';
  const middleHeadingClasses = 'px-3 py-3.5';
  const lastHeadingClasses = 'py-3.5 pl-3 pr-3 rounded-tr-lg sm:pr-6 lg:pr-6';

  const commonColClasses =
    'border-b max-w-[10rem] border-gray-200 whitespace-nowrap text-sm text-gray-600';
  const firstColClasses = 'py-1 pl-4 pr-3  sm:pl-6 lg:pl-8';
  const middleColClasses = 'py-1 px-3';
  const lastColClasses = 'py-1 pr-4 pl-3 sm:pr-6 lg:pr-6';

  const subTotalColor = (element: any) => {
    if (element.description?.toLowerCase() === 'subtotal') {
      return 'bg-stak-orange/30 font-semibold h-10 text-lg';
    }
    if (element.description?.toLowerCase().includes('subtotal')) {
      return 'bg-orange-100 font-semibold h-12';
    }
    if (element.description?.toLowerCase() === 'sales tax') {
      return 'bg-stak-orange/30 font-semibold h-10';
    }
    if (element.description?.toLowerCase() === 'total') {
      return 'bg-blue-500/30 font-semibold h-10';
    }
    return '';
  };

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

                  {/* TABLE ROWS */}

                  {groupedRows && (
                    <tbody>
                      {/* Budgeted */}

                      {Object.entries(groupedRows.budgeted).map(
                        ([group, value]: [string, any], i) => {
                          return (
                            <Fragment key={group}>
                              {group !== 'Subtotal' && (
                                <tr className="border-t border-gray-200">
                                  <th
                                    colSpan={Object.keys(headings).length}
                                    scope="colgroup"
                                    className="bg-gray-50 py-2 pl-4 pr-3 text-left text-md font-semibold text-gray-900 sm:pl-3"
                                  >
                                    {group}
                                  </th>
                                </tr>
                              )}

                              {value.map((element: any, j: number) => {
                                return (
                                  <tr
                                    key={`${i}_${j}`}
                                    className={classNames(
                                      'hover:bg-slate-100',
                                      subTotalColor(element)
                                    )}
                                  >
                                    {Object.keys(headings).map(
                                      (headingsKey, j) => {
                                        {
                                          return (
                                            <td
                                              key={`${headingsKey}_${i}_${j}`}
                                              className={classNames(
                                                j === 0
                                                  ? firstColClasses
                                                  : j === value.length - 1
                                                  ? lastColClasses
                                                  : middleColClasses,
                                                commonColClasses
                                              )}
                                            >
                                              {headingsKey.endsWith('Amt') &&
                                              headingsKey !== 'rateAmt'
                                                ? formatNumber(
                                                    element[headingsKey]
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
                      {/* CHANGE ORDERS */}
                      {areThereChangeOrders && (
                        <tr className="border-t border-gray-200">
                          <th
                            colSpan={Object.keys(headings).length}
                            scope="colgroup"
                            className="bg-gray-50 py-2 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                          >
                            Change Orders
                          </th>
                        </tr>
                      )}
                      {areThereChangeOrders &&
                        Object.values(groupedRows.changeOrders).map(
                          (changeOrderValue: any, i) => {
                            return (
                              <Fragment key={i}>
                                {changeOrderValue.map(
                                  (element: any, j: number) => {
                                    return (
                                      <tr
                                        key={`${j}_${i}`}
                                        className={classNames(
                                          'hover:bg-slate-100',
                                          subTotalColor(element)
                                        )}
                                      >
                                        {Object.keys(headings).map(
                                          (headingsKey, j) => {
                                            {
                                              return (
                                                <td
                                                  key={`${i}_${j}_${headingsKey}_${i}_${j}`}
                                                  className={classNames(
                                                    j === 0
                                                      ? firstColClasses
                                                      : j ===
                                                        changeOrderValue.length -
                                                          1
                                                      ? lastColClasses
                                                      : middleColClasses,
                                                    commonColClasses
                                                  )}
                                                >
                                                  {headingsKey.endsWith(
                                                    'Amt'
                                                  ) && headingsKey !== 'rateAmt'
                                                    ? formatNumber(
                                                        element[headingsKey]
                                                      )
                                                    : element[headingsKey]}
                                                </td>
                                              );
                                            }
                                          }
                                        )}
                                      </tr>
                                    );
                                  }
                                )}
                              </Fragment>
                            );
                          }
                        )}
                      {Object.values(groupedRows.total).map((value: any, i) => {
                        return (
                          <Fragment key={`${i}${i}`}>
                            {value.map((element: any, j: number) => {
                              return (
                                <tr
                                  key={`${i}_${j}`}
                                  className={classNames(
                                    'hover:bg-slate-100 font-semibold',
                                    subTotalColor(element)
                                  )}
                                >
                                  {Object.keys(headings).map(
                                    (headingsKey, j) => {
                                      {
                                        return (
                                          <td
                                            key={`${headingsKey}_${i}_${j}`}
                                            className={classNames(
                                              j === 0
                                                ? firstColClasses
                                                : j === value.length - 1
                                                ? lastColClasses
                                                : middleColClasses,
                                              commonColClasses
                                            )}
                                          >
                                            {headingsKey.endsWith('Amt') &&
                                            headingsKey !== 'rateAmt'
                                              ? formatNumber(
                                                  element[headingsKey]
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
                      })}
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
