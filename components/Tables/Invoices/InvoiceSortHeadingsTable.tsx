import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import {
  autoAssignSelectedInvoices,
  deleteInvoices,
  invoiceActions,
} from '@/store/invoice-slice';
import {
  companyDataActions,
  patchInvoiceUpdates,
  removeInvoiceFromChangeOrderThunk,
  updateInvoices,
} from '@/store/company-data-slice';
import { overlayActions } from '@/store/overlay-control-slice';
import { addProcessInvoiceFormActions } from '@/store/add-process-invoice';

import {
  formatNameForID,
  formatNumber,
  formatPhoneNumber,
} from '@/lib/utility/formatter';
import { checkExpirationDate, sortTableData } from '@/lib/utility/tableHelpers';
import { Items } from '@/lib/models/formDataModel';
import { User } from '@/lib/models/formStateModels';
import {
  InvoiceTableHeadings,
  InvoiceTableRow,
} from '@/lib/models/invoiceDataModels';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';
import Button from '../../UI/Buttons/Button';
import TableDropdown from '../../Inputs/InputTableDropdown';
import ModalConfirm from '@/components/UI/Modal/ModalConfirm';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface CheckBoxItems {
  label: string;
  buttonPath: string;
  disabled?: boolean;
}

interface ExtendedItems extends Partial<Items> {
  sortBy: 'label' | 'id';
  forceToTopKey?: string;
}

interface Props<H> {
  headings: H;
  rows: InvoiceTableRow[] | null;
  projectId?: string;
  isProjectPage?: boolean;
  dropdown?: ExtendedItems;
  checkboxButtons?: CheckBoxItems[];
  preSortTo?: keyof H;
}

const InvoicesTable = <
  H extends Partial<InvoiceTableRow> & InvoiceTableHeadings
>(
  props: Props<H>
) => {
  const {
    headings,
    rows,
    checkboxButtons,
    dropdown,
    isProjectPage,
    projectId,
    preSortTo,
  } = props;
  const { user } = useUser();

  const checkbox = useRef<HTMLInputElement | null>(null);
  const [activeHeading, setActiveHeading] = useState<keyof H | undefined>(
    undefined
  );
  const [sortKey, setSortKey] = useState<keyof H | undefined>(preSortTo);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [selected, setSelected] = useState<InvoiceTableRow[]>([]);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const modalMessage =
    'Please confirm that you want to delete these invoices from the database.';

  const dispatch = useDispatch();

  const selectedInvoiceId = useSelector(
    (state) => state.invoice.clickedInvoice?.doc_id
  );
  const allInvoices = useSelector((state) => state.data.invoices.allInvoices);

  useEffect(() => {
    // initialize the isRowClicked to false on first render
    dispatch(
      invoiceActions.setClickedInvoice({ invoice: null, isRowClicked: false })
    );
  }, []);

  useLayoutEffect(() => {
    if (rows) {
      const isIndeterminate =
        selected.length > 0 && selected.length < Object.values(rows).length;
      setChecked(selected.length === Object.values(rows).length);
      setIndeterminate(isIndeterminate);
      if (checkbox.current) {
        checkbox.current.indeterminate = isIndeterminate;
      }
    }
  }, [selected]);

  // TODO use the indexes of the selected elements to implement a bulk select
  // using the shift key
  // if (selected.length > 0) {
  //   console.log(rows.map((row) => row.doc_id)?.indexOf(selected[0]?.doc_id));
  // }

  function toggleAll() {
    if (rows) {
      setSelected(checked || indeterminate ? [] : Object.values(rows));
    }
    setChecked(!checked && !indeterminate);
    setIndeterminate(false);
  }

  const handleHeadingClick = useCallback(
    (heading: keyof H) => {
      // since we are looking for one heading within headings, we can force this via !
      const entry = Object.entries(headings).find(
        ([_, value]) => value === heading
      )!;
      const key = entry ? (entry[0] as keyof H) : undefined;
      if (sortKey === key) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      }
      setActiveHeading(heading);
      setSortKey(key);
    },
    [sortOrder, sortKey]
  );

  const closeModalHandler = () => {
    setOpenModal(false);
  };

  const confirmModalHandler = () => {
    const invoiceIdsToDelete = selected.map(
      (invoice) => invoice.doc_id as string
    );
    const invoiceChangeOrders: { [changeOrderId: string]: Set<string> } = {};

    invoiceIdsToDelete.forEach((invoiceId) => {
      const processedData = allInvoices[invoiceId]?.processedData;
      if (processedData && processedData.change_order) {
        const { uuid } = processedData.change_order;
        if (!invoiceChangeOrders[uuid]) {
          invoiceChangeOrders[uuid] = new Set([invoiceId]);
        } else {
          invoiceChangeOrders[uuid].add(invoiceId);
        }
      } else if (processedData && processedData.line_items) {
        Object.values(processedData.line_items).forEach((item) => {
          if (item.change_order) {
            const { uuid } = item.change_order;
            if (!invoiceChangeOrders[uuid]) {
              invoiceChangeOrders[uuid] = new Set([invoiceId]);
            } else {
              invoiceChangeOrders[uuid].add(invoiceId);
            }
          }
        });
      }
    });

    // remove any duplicates
    const deDupInvoiceChangeOrders = Object.fromEntries(
      Object.entries(invoiceChangeOrders).map(([changeOrderId, invoiceIds]) => {
        return [changeOrderId, [...invoiceIds]];
      })
    );

    if (projectId) {
      dispatch(
        removeInvoiceFromChangeOrderThunk({
          projectId,
          invoiceChangeOrders: deDupInvoiceChangeOrders,
          companyId: (user as User).user_metadata.companyId as string,
        })
      );
    }

    dispatch(companyDataActions.removeInvoicesFromState(invoiceIdsToDelete));
    dispatch(
      deleteInvoices({
        companyId: (user as User).user_metadata.companyId as string,
        invoicesToDelete: invoiceIdsToDelete,
      })
    );

    toggleAll();
  };
  const invoiceRowClickHandler = (invoice: InvoiceTableRow) => {
    if (!filteredSortedData) return;
    const invoiceRowNumber = filteredSortedData
      .map((invoice) => invoice.doc_id)
      .indexOf(invoice.doc_id);
    dispatch(
      invoiceActions.setClickedInvoice({
        invoice,
        isRowClicked: true,
        invoiceRowNumber,
      })
    );
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          currentId: invoice.doc_id,
          currentData: allInvoices[invoice.doc_id],
        },
        stateKey: 'process-invoices',
      })
    );
    if (isProjectPage) {
      dispatch(addProcessInvoiceFormActions.clearFormState());
    }
  };

  const checkBoxButtonClickHandler = (label: string) => {
    if (label === 'Auto Assign') {
      dispatch(autoAssignSelectedInvoices(selected));
      toggleAll();
    } else if (label === 'Delete') {
      setOpenModal(true);
    } else if (label === 'Update Invoices') {
      const invoicesToUpdate = selected.map((invoice) => invoice.doc_id);
      dispatch(updateInvoices(invoicesToUpdate)).then((result) => {
        if (result.payload) {
          dispatch(
            patchInvoiceUpdates({
              companyId: (user as User).user_metadata.companyId as string,
              invoicesToUpdate: invoicesToUpdate,
            })
          );
        }
      });
      toggleAll();
    }
  };
  const stopPropClickHandler: React.MouseEventHandler<
    HTMLButtonElement | HTMLDivElement
  > = (e) => {
    e.stopPropagation();
  };

  const filteredSortedData = useMemo(() => {
    if (!rows) return;
    if (sortKey === undefined) {
      return rows;
    }
    return sortTableData(
      rows,
      sortKey as keyof Partial<InvoiceTableRow>,
      sortOrder
    );
  }, [rows, sortKey, sortOrder]);

  const commonHeadingClasses =
    'sticky max-w-[17rem] top-0 z-10 border-b border-gray-300 bg-white bg-opacity-80 text-left text-sm uppercase font-bold backdrop-blur backdrop-filter text-stak-dark-green';
  const firstHeadingClasses = 'py-3.5 pl-4 pr-3 rounded-tl-lg sm:pl-6 lg:pl-8';
  const middleHeadingClasses = 'px-3 py-3.5';
  const lastHeadingClasses = 'py-3.5 pl-3 pr-3 rounded-tr-lg sm:pr-6 lg:pr-6';

  const commonColClasses =
    'py-1 border-b max-w-[17rem] border-gray-200 whitespace-nowrap text-sm text-gray-500';
  const firstColClasses = 'pl-4 pr-3 overflow-x-scroll sm:pl-6 lg:pl-8';
  const middleColClasses = 'px-3';
  const lastColClasses = 'pr-4 pl-3 sm:pr-6 lg:pr-6';

  return (
    <>
      <ModalConfirm
        onCloseModal={closeModalHandler}
        openModal={openModal}
        onConfirm={confirmModalHandler}
        message={modalMessage}
        title="Delete"
      />
      <div className="px-4 grow sm:px-6 lg:px-8">
        <div className="mt-2 flow-root">
          <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full align-middle">
              <div className="relative">
                {selected.length > 0 && (
                  <div className="sticky z-20 top-0">
                    <div className="top-0 z-20 absolute left-14 flex h-12 items-center space-x-3 bg-white sm:left-12">
                      {checkboxButtons &&
                        checkboxButtons.map((button, i) => {
                          return (
                            <Button
                              key={i}
                              buttonText={button.label}
                              onClick={() =>
                                checkBoxButtonClickHandler(button.label)
                              }
                              disabled={button.disabled}
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
                        className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-100 px-7 rounded-tl-lg overflow-hidden sm:w-12 sm:px-6"
                      >
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-stak-dark-green focus:ring-0 focus:ring-offset-0"
                          ref={checkbox}
                          checked={checked}
                          onChange={toggleAll}
                        />
                      </th>
                      {Object.values(headings).map((heading, i) => {
                        return (
                          <th
                            key={`${i}`}
                            scope="col"
                            id={formatNameForID(heading as string)}
                            className={classNames(
                              i === 0
                                ? firstHeadingClasses
                                : i === Object.values(headings).length - 1
                                ? lastHeadingClasses
                                : middleHeadingClasses,
                              commonHeadingClasses,
                              selected.length > 0 ? 'blur-[0.6px]' : ''
                            )}
                          >
                            <div
                              onClick={() => handleHeadingClick(heading)}
                              className="inline-flex hover:cursor-pointer"
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
                    {filteredSortedData &&
                      filteredSortedData.map((invoice) => {
                        return (
                          <tr
                            key={invoice['doc_id'] as string}
                            onClick={() => {
                              invoiceRowClickHandler(invoice);
                            }}
                            className={`hover:bg-slate-50 hover:cursor-pointer m-0 ${
                              selected.includes(invoice) ? 'bg-slate-50' : ''
                            } ${
                              invoice.doc_id === selectedInvoiceId
                                ? 'bg-slate-200 hover:bg-slate-300'
                                : ''
                            }`}
                          >
                            <td
                              onClick={stopPropClickHandler}
                              className="relative border-b border-gray-300 px-7 sm:w-12 sm:px-6"
                            >
                              {selected.includes(invoice) && (
                                <div
                                  onClick={stopPropClickHandler}
                                  className="absolute inset-y-0 left-0 w-0.5 bg-stak-dark-green"
                                />
                              )}
                              <input
                                type="checkbox"
                                className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-stak-dark-green focus:ring-0 focus:ring-offset-0"
                                value={invoice.doc_id}
                                checked={selected.includes(invoice)}
                                onClick={stopPropClickHandler}
                                onChange={(e) =>
                                  setSelected(
                                    e.target.checked
                                      ? [...selected, invoice]
                                      : selected.filter((el) => el !== invoice)
                                  )
                                }
                              />
                            </td>
                            {Object.keys(headings).map((headingsKey, j) => {
                              return (
                                <td
                                  key={`${headingsKey}_${j}`}
                                  className={classNames(
                                    j === 0
                                      ? firstColClasses
                                      : rows && j === rows.length - 1
                                      ? lastColClasses
                                      : middleColClasses,
                                    commonColClasses,
                                    checkExpirationDate(
                                      headingsKey as string,
                                      invoice
                                    )
                                      ? 'text-red-500'
                                      : ''
                                  )}
                                >
                                  {headingsKey === 'project' &&
                                    dropdown &&
                                    !isProjectPage && (
                                      <div
                                        onClick={stopPropClickHandler}
                                        className="min-w-[8rem]"
                                      >
                                        <TableDropdown
                                          input={dropdown}
                                          invoiceId={invoice.doc_id}
                                          sortBy={dropdown.sortBy}
                                        />
                                      </div>
                                    )}
                                  {isProjectPage &&
                                    headingsKey === 'project' &&
                                    invoice[headingsKey]}
                                  {headingsKey !== 'project' && (
                                    <div className="block h-full w-full">
                                      {headingsKey.endsWith('Amt')
                                        ? formatNumber(
                                            invoice[
                                              headingsKey as keyof Partial<InvoiceTableRow>
                                            ] as string
                                          )
                                        : headingsKey.endsWith('Phone')
                                        ? formatPhoneNumber(
                                            invoice[
                                              headingsKey as keyof Partial<InvoiceTableRow>
                                            ] as string
                                          )
                                        : (invoice[
                                            headingsKey as keyof Partial<InvoiceTableRow>
                                          ] as string)}
                                    </div>
                                  )}
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
      </div>
    </>
  );
};

export default InvoicesTable;
