import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { invoiceActions } from '@/store/invoice-slice';

import { useKeyPressActionOverlay } from '@/hooks/use-save-on-key-press';
import { useInvoiceSignedUrl } from '@/hooks/use-get-signed-url';

import { InvoiceTableRow } from '@/lib/models/invoiceDataModels';

import { XMarkIcon } from '@heroicons/react/24/outline';
import FullScreenLoader from '../Loaders/FullScreenLoader';
import CenteredPagination from '../Pagination/CenteredNumbersPagination';
import MagnifyImageOnHover from '@/components/Forms/OverlayForm/MagnifyImageOnHover';

interface Props {
  rows: InvoiceTableRow[];
}

export default function ClientBillInvoiceSlideOverlayImage(props: Props) {
  const { rows } = props;

  const [open, setOpen] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);

  const invoiceObj = useSelector((state) => state.invoice);
  const dispatch = useDispatch();

  const closeFormRef = useRef<HTMLButtonElement>(null);
  useKeyPressActionOverlay({
    formOverlayOpen: open,
    ref: closeFormRef,
    keyName: 'Enter',
  });

  const currentRow = useMemo(() => {
    return rows.find((row) => row.doc_id === invoiceObj.clickedInvoice?.doc_id);
  }, [invoiceObj.clickedInvoice]);

  useEffect(() => {
    setOpen(invoiceObj.isRowClicked);
  }, [invoiceObj.isRowClicked]);

  useInvoiceSignedUrl(invoiceObj);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-30"
        onClose={() => {
          setOpen(false);
          dispatch(
            invoiceActions.setClickedInvoice({
              invoice: null,
              isRowClicked: false,
            })
          );
        }}
      >
        <div className="fixed inset-0" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300 sm:duration-[400ms]"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300 sm:duration-[250ms]"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-2xl">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-base font-sans font-semibold leading-6 text-gray-500">
                          <p>{`${invoiceObj.clickedInvoice?.vendor_name}`}</p>
                          <div className="flex items-end gap-4">
                            {`Project: ${
                              invoiceObj.clickedInvoice?.project
                                ? invoiceObj.clickedInvoice.project
                                : 'Unknown'
                            }`}
                          </div>
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-800 focus:outline-none focus:ring-0 focus:ring-offset-0"
                            ref={closeFormRef}
                            onClick={() => {
                              setOpen(false);
                              dispatch(
                                invoiceActions.setClickedInvoice({
                                  invoice: null,
                                  isRowClicked: false,
                                })
                              );
                            }}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex-1 flex overflow-auto mt-6 px-4 sm:px-6 ">
                      {invoiceObj.isLoading && (
                        <FullScreenLoader className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      )}
                      {!invoiceObj.isLoading && currentRow && (
                        <MagnifyImageOnHover
                          src={
                            invoiceObj.signedUrls[
                              (invoiceObj.clickedInvoice as InvoiceTableRow)
                                .doc_id
                            ]?.signedUrls?.[pageIdx]
                          }
                          alt={
                            (invoiceObj.clickedInvoice as InvoiceTableRow)
                              .vendor_name
                          }
                          pageIdx={pageIdx}
                        />
                      )}
                    </div>
                    {invoiceObj.clickedInvoice && (
                      <CenteredPagination
                        onChangePage={setPageIdx}
                        pageArray={invoiceObj.clickedInvoice.gcs_img_uri}
                        rows={rows}
                        currentRowIdx={invoiceObj.invoiceRowNumber}
                        open={open}
                      />
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
