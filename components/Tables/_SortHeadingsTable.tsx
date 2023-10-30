import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  formatNameForID,
  formatNumber,
  formatPhoneNumber,
} from '@/lib/utility/formatter';
import { formatDate, sortTableData } from '@/lib/utility/tableHelpers';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface Props {
  headings: Headings;
  rows: Rows[];
  activeFilter?: string;
}

type Headings = {
  [key: string]: string;
};

type Rows = {
  [key: string]: string | number | undefined;
};

const commonHeadingClasses =
  'sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 text-left text-sm uppercase font-bold text-stak-dark-green backdrop-blur backdrop-filter';
const firstHeadingClasses = 'py-3.5 pl-4 pr-3 rounded-tl-lg sm:pl-6 lg:pl-8';
const middleHeadingClasses = 'px-3 py-3.5';
const lastHeadingClasses = 'py-3.5 pl-3 pr-3 rounded-tr-lg sm:pr-6 lg:pr-6';

const commonColClasses =
  'border-b border-gray-200 whitespace-nowrap text-sm text-gray-500';
const firstColClasses = 'py-4 pl-4 pr-3 sm:pl-6 lg:pl-8';
const middleColClasses = 'px-3 py-4';
const lastColClasses = 'py-4 pr-4 pl-3 sm:pr-6 lg:pr-6';

export default function SortHeadingsTable(props: Props) {
  const { headings, rows, activeFilter } = props;

  const router = useRouter();

  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleHeadingClick = useCallback(
    (heading: string) => {
      const entry = Object.entries(headings).find(
        ([_, value]) => value === heading
      );
      const key = entry ? entry[0] : null;
      if (sortKey === key) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      }
      setActiveHeading(heading);
      setSortKey(key);
    },
    [sortOrder, sortKey]
  );

  const filteredSortedData = useMemo(() => {
    let filteredData = rows;
    if (activeFilter !== 'No Filter') {
      filteredData = rows.filter((row) => row.projectSuper === activeFilter);
    }
    if (sortKey === null) {
      return filteredData;
    }
    return sortTableData(filteredData, sortKey, sortOrder);
  }, [rows, activeFilter, sortKey, sortOrder]);

  return (
    <div className="px-4 grow sm:px-6 lg:px-8">
      <div className="mt-2 flow-root">
        <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full align-middle">
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
              <tbody>
                {filteredSortedData.map((element) => {
                  return (
                    <tr
                      key={element.uuid as string}
                      className="hover:bg-slate-50 hover:cursor-pointer"
                    >
                      {Object.keys(headings).map((headingsKey, j) => {
                        return (
                          <td
                            key={`${headingsKey}_${j}`}
                            className={classNames(
                              j === 0
                                ? firstColClasses
                                : j === rows.length - 1
                                ? lastColClasses
                                : middleColClasses,
                              commonColClasses
                            )}
                          >
                            <Link
                              href={`${router.asPath}/${element.uuid}`}
                              className="block h-full w-full"
                            >
                              {headingsKey.endsWith('Amt')
                                ? formatNumber(element[headingsKey] as string)
                                : headingsKey.endsWith('Phone')
                                ? formatPhoneNumber(
                                    element[headingsKey] as string
                                  )
                                : headingsKey.toLowerCase().includes('date')
                                ? formatDate(element[headingsKey] as string)
                                : element[headingsKey]}
                            </Link>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
