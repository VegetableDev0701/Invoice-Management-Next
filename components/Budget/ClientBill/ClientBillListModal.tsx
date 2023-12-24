import React, { Fragment, useEffect, useMemo, useState } from 'react';
import ReactDom from 'react-dom';
import { Dialog, Transition } from '@headlessui/react';

import { useAppSelector as useSelector } from '@/store/hooks';

import CheckboxSubTable from '@/components/Tables/SubTables/CheckboxSortHeadingsTableSub';
import { ClientBillSummaryItem } from '@/lib/models/summaryDataModel';
import { formatDate } from '@/lib/utility/tableHelpers';
import { classNames } from '@/lib/utility/utils';

interface Props {
  projectId: string;
  openModal: boolean;
  onConfirm: (clientBillIds: string[]) => void;
  onCloseModal: () => void;
}

const tableHeadings = {
  billTitle: 'Billing Period',
  createdAt: 'Date',
  changeOrder: 'Change Orders',
  subTotal: 'Subtotal',
  insuranceLiability: 'Insurance Liability',
  boTax: 'BO Tax',
  salesTax: 'Sales Tax',
  profit: 'Profit',
  total: 'Total Due',
};

function Modal(props: Props) {
  const { projectId, openModal, onConfirm, onCloseModal } = props;

  const [selectedBills, setSelectedBills] = useState<ClientBillSummaryItem[]>(
    []
  );

  const clientBills = useSelector(
    (state) => state.projects[projectId]?.['client-bills-summary']
  );

  const clientBillRows: ClientBillSummaryItem[] | null = useMemo(() => {
    if (clientBills) {
      return Object.values(clientBills)
        .sort((a, b) =>
          new Date(a?.createdAt || 0) >= new Date(b?.createdAt || 0) ? 1 : -1
        )
        .map((value) => {
          const changeOrder = value?.changeOrders ? value.changeOrders : '0.00';
          const createdAt = value?.createdAt
            ? formatDate(value.createdAt)
            : '-';
          return { ...value, changeOrder, createdAt };
        });
    } else {
      return null;
    }
  }, [clientBills]);

  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(openModal);
  }, [openModal]);

  const handleSelectBills = (selected: ClientBillSummaryItem[]) => {
    setSelectedBills(selected);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative font-sans"
        onClose={() => {
          onCloseModal();
          setOpen(false);
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-10" />
        </Transition.Child>

        <div
          className="fixed z-20 inset-0 overflow-y-auto"
          onClick={() => {
            setOpen(false);
          }}
        >
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:p-6 w-[80%] max-w-[1200px] min-h-[500px] flex flex-col justify-between items-center h-full ">
                <Dialog.Title
                  as="div"
                  className="text-2xl font-semibold leading-6 text-gray-900 mb-5"
                >
                  Build B2A Report
                </Dialog.Title>
                <CheckboxSubTable
                  headings={tableHeadings}
                  rows={clientBillRows}
                  projectId={projectId}
                  selectedRowId={null}
                  onSelectItems={handleSelectBills}
                />

                <div className="mt-5 flex flex-col sm:flex-row gap-3 text-lg">
                  <button
                    type="button"
                    className={classNames(
                      'inline-flex w-full justify-center rounded-3xl border border-transparent bg-stak-dark-green px-8 py-2 text-semi font-semibold text-white shadow-sm hover:bg-stak-dark-green-hover hover:shadow-xl focus:outline-none disabled:opacity-75 disabled:pointer-events-none disabled:cursor-not-allowed'
                    )}
                    disabled={!selectedBills.length}
                    onClick={() => {
                      onConfirm(selectedBills.map((item) => item.uuid));
                    }}
                  >
                    Export
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-3xl border border-gray-300 bg-white px-4 py-2 text-base font-semibold text-stak-dark-gray shadow-sm hover:text-stak-light-gray hover:shadow-xl focus:outline-none"
                    onClick={() => {
                      onCloseModal();
                      setOpen(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function ClientBillListModal(props: Props) {
  const [portal, setPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const portalRoot = document.getElementById('portal');
    if (portalRoot) {
      setPortal(portalRoot);
    }
  }, []);

  if (!portal) return null;

  return (
    <>
      {portal &&
        ReactDom.createPortal(
          <Modal
            projectId={props.projectId}
            onCloseModal={props.onCloseModal}
            openModal={props.openModal}
            onConfirm={props.onConfirm}
          />,
          portal
        )}
    </>
  );
}
