import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { invoiceActions } from '@/store/invoice-slice';
import { addProcessInvoiceFormActions } from '@/store/add-process-invoice';
import {
  addProcessedInvoiceData,
  approveInvoice,
} from '@/store/company-data-slice';
import { contractActions } from '@/store/contract-slice';

import { usePageData } from '@/hooks/use-page-data';
import { useKeyPressActionOverlay } from '@/hooks/use-save-on-key-press';

import { FormData } from '@/lib/models/types';
import { FormState, User } from '@/lib/models/formStateModels';
import { ContractData } from '@/lib/models/summaryDataModel';
import { Items } from '@/lib/models/formDataModel';
import { snapshotCopy } from '@/lib/utility/utils';
import { InvoiceTableRow } from '@/lib/models/invoiceDataModels';

import { XMarkIcon } from '@heroicons/react/24/outline';
import FullScreenLoader from '../Loaders/FullScreenLoader';
import TableDropdown from '@/components/Inputs/InputTableDropdown';
import CenteredPagination from '../Pagination/CenteredNumbersPagination';
import ProcessInvoiceForm from '@/components/Forms/OverlayForm/ProcessInvoiceForm';
import Button from '../Buttons/Button';
import MagnifyImageOnHover from '@/components/Forms/OverlayForm/MagnifyImageOnHover';
import ContractSlideOverlayImage from './ContractSlideOverlayImage';
import { useInvoiceSignedUrl } from '@/hooks/use-get-signed-url';

interface ExtendedItems extends Partial<Items> {
  sortBy: 'label' | 'id';
  forceToTopKey?: string;
}

interface Props {
  rows: InvoiceTableRow[] | null;
  projectId: string;
  contractData: ContractData | null;
  dropdown?: ExtendedItems;
}

export default function ProcessInvoiceSlideOverlay(props: Props) {
  const { dropdown, rows, projectId, contractData } = props;
  const [open, setOpen] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  const [key, setKey] = useState(0);
  const [snapShotCurrentFormState, setSnapShotCurrentFormState] =
    useState<FormState | null>(null);
  const [childHasRendered, setChildHasRendered] = useState(false);

  const processInvoiceFormState = useSelector(
    (state) => state.addProcessInvoiceForm
  );
  const [latestFormState, setLatestFormState] = useState(
    processInvoiceFormState
  );

  const processedRef = useRef(false);

  const invoiceObj = useSelector((state) => state.invoice);

  const dispatch = useDispatch();

  const { user } = useUser();

  const {
    data: processInvoiceFormData,
  }: { data: FormData; isLoading: boolean } = usePageData(
    'data',
    'forms',
    'process-invoice'
  );

  const closeAndSaveFormRef = useRef<HTMLButtonElement>(null);
  useKeyPressActionOverlay({
    formOverlayOpen: open,
    ref: closeAndSaveFormRef,
    keyName: 'Enter',
  });

  const currentRow = useMemo(() => {
    // can't click an invoice that doesn't exist so -> !
    return (
      rows &&
      rows.find((row) => row.doc_id === invoiceObj?.clickedInvoice?.doc_id)!
    );
  }, [invoiceObj.clickedInvoice]);

  //////
  ///
  // We need to capture a snapshot of the processInvoiceFormState when the user clicks
  // the invoice table row. But this formState does not get populated immediatly in
  // the ProcessInvoiceForm, child component. In that componenet it runs through a loop filling in the input
  // values, and only AFTER this is complete, we want to take that snapshot. Becuase of async
  // characteristics of javascript, this is harder than it seems.
  // First, constantly update the formState in the first useEffect, updating, latestFormState
  // Second, Take the snapshot ONLY when childHasRendered is true, and triggers that second effect.
  // Third, We need to reset childHasRendered each time the user clicks a row.
  // childHasRendered is a callback function that is passed as a prop to the ProcessInvoiceForm componenet,
  // and called in a useEffect with [], empty, dependendencies.
  useEffect(() => {
    setLatestFormState(processInvoiceFormState);
  }, [processInvoiceFormState]);

  useEffect(() => {
    if (childHasRendered && !processedRef.current) {
      setSnapShotCurrentFormState(snapshotCopy(latestFormState));
      processedRef.current = true;
    } else if (!childHasRendered) {
      setSnapShotCurrentFormState(null);
      processedRef.current = false; // Reset the ref to allow capturing the snapshot again.
    }
    return () => {
      processedRef.current = false;
    };
  }, [childHasRendered]);

  useEffect(() => {
    setChildHasRendered(false);
  }, [invoiceObj.isRowClicked]);
  ///
  //////

  useEffect(() => {
    if (!invoiceObj.clickedInvoice) return;
    // check if current invoice vendor matches any contracts
    if (contractData) {
      const matchedVendorContract = Object.values(contractData).find(
        (contract) => {
          return contract.summaryData?.vendor
            ? contract.summaryData.vendor
                .toLowerCase()
                .slice(0, 5)
                .includes(
                  (invoiceObj.clickedInvoice as InvoiceTableRow).vendor_name
                    .toLowerCase()
                    .slice(0, 5)
                )
            : null;
        }
      );

      if (matchedVendorContract) {
        // if we find a contract matched to the vendor, set that in the contract state
        // and then dispatch the `isRowClicked` which will opent he slide overlay from
        // when the user clicks the edit button found in the Input component (Inputs folder)
        dispatch(
          contractActions.setClickedContract({
            contract: matchedVendorContract,
            isRowClicked: false,
          })
        );
      }
    }
  }, [invoiceObj.clickedInvoice?.doc_id]);

  useEffect(() => {
    setKey((prevKey) => prevKey + 1);
  }, [invoiceObj.clickedInvoice?.doc_id]);

  useEffect(() => {
    setOpen(invoiceObj.isRowClicked);
  }, [invoiceObj.isRowClicked]);

  useInvoiceSignedUrl(invoiceObj);

  const handleChildRenderComplete = () => {
    setChildHasRendered(true);
  };

  const approveInvoiceHandler = ({ isApproved }: { isApproved: boolean }) => {
    if (invoiceObj.clickedInvoice) {
      dispatch(
        approveInvoice({
          companyId: (user as User).user_metadata.companyId,
          invoiceId: invoiceObj.clickedInvoice.doc_id,
          isApproved: isApproved,
        })
      );
    }
  };

  const closeOverlay = () => {
    setOpen(false);
    if (processInvoiceFormState?.isUpdated.value) {
      dispatch(
        addProcessedInvoiceData({
          companyId: (user as User).user_metadata.companyId,
          invoiceId: (invoiceObj.clickedInvoice as InvoiceTableRow).doc_id,
          projectName: (invoiceObj.clickedInvoice as InvoiceTableRow)
            .project as string,
          snapShotFormState: snapShotCurrentFormState as FormState,
        })
      );
    }
    dispatch(
      invoiceActions.setClickedInvoice({
        invoice: null,
        isRowClicked: false,
      })
    );
    dispatch(
      contractActions.setClickedContract({
        contract: null,
        isRowClicked: false,
      })
    );
  };

  return (
    <>
      <ContractSlideOverlayImage
        rows={contractData && Object.values(contractData).map((row) => row)}
        projectId={projectId}
        isOnProcessInvoices={true}
      />
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={closeOverlay}>
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
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-[88rem] flex flex-col h-full">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-2xl px-4 sm:px-6">
                      <div className="flex items-center">
                        <div className="w-6/12">
                          <Dialog.Title className="text-base font-sans font-semibold leading-6 text-gray-500">
                            <p>{`${invoiceObj.clickedInvoice?.vendor_name}`}</p>
                            <div className="flex items-end gap-4">
                              Project123123:{' '}
                              {dropdown && (
                                <span className="min-w-[14rem]">
                                  <TableDropdown
                                    input={dropdown}
                                    invoiceId={
                                      (
                                        invoiceObj.clickedInvoice as InvoiceTableRow
                                      ).doc_id
                                    }
                                    sortBy={dropdown.sortBy}
                                  />
                                </span>
                              )}
                              {!dropdown &&
                                `${
                                  invoiceObj.clickedInvoice?.project
                                    ? invoiceObj.clickedInvoice.project
                                    : 'Unknown'
                                }`}
                            </div>
                          </Dialog.Title>
                        </div>
                        <div className="flex justify-between w-6/12 pr-4 pl-2">
                          <Button
                            buttonText={`${
                              invoiceObj.clickedInvoice?.approved === 'Yes'
                                ? 'Remove Approval'
                                : 'Approve Invoice'
                            }`}
                            className="px-4 py-1"
                            disabled={
                              (user as User).user_metadata.accountSettings[
                                'permissions-as'
                              ].value === 'Administrator' ||
                              (user as User).user_metadata.accountSettings[
                                'permissions-as'
                              ].value === 'Approver'
                                ? false
                                : true
                            }
                            onClick={() =>
                              approveInvoiceHandler({
                                isApproved:
                                  invoiceObj.clickedInvoice?.approved === 'Yes'
                                    ? false
                                    : true,
                              })
                            }
                          />
                          {invoiceObj.clickedInvoice?.approved === 'Yes' && (
                            <span className="font-sans text-stak-dark-green text-2xl font-semibold flex items-center">
                              Invoice Approved
                            </span>
                          )}
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md bg-white text-gray-400 hover:text-gray-800 focus:outline-none focus:ring-0 focus:ring-offset-0"
                              ref={closeAndSaveFormRef}
                              onClick={closeOverlay}
                            >
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon
                                className="h-6 w-6"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="relative flex-1 overflow-auto mt-6 px-4 sm:px-6 flex">
                        {invoiceObj.isLoading && (
                          <FullScreenLoader className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        )}
                        <div className="w-[50%] overflow-y-scroll">
                          {!invoiceObj.isLoading && currentRow && (
                            <MagnifyImageOnHover
                              src={
                                invoiceObj.signedUrls[
                                  (invoiceObj.clickedInvoice as InvoiceTableRow)
                                    .doc_id
                                ]?.signedUrls?.[pageIdx]
                              }
                              alt={
                                invoiceObj.clickedInvoice?.vendor_name
                                  ? invoiceObj.clickedInvoice.vendor_name
                                  : 'Unknown'
                              }
                              pageIdx={pageIdx}
                              className="object-fill w-full h-full"
                            />
                          )}
                        </div>
                        <div className="w-[50%] px-4">
                          <ProcessInvoiceForm
                            key={key}
                            formData={processInvoiceFormData}
                            formState={processInvoiceFormState}
                            currentData={
                              currentRow
                                ? {
                                    ...(invoiceObj.clickedInvoice as InvoiceTableRow),
                                    approver: currentRow.approver,
                                  }
                                : invoiceObj.clickedInvoice
                            }
                            showError={false}
                            actions={addProcessInvoiceFormActions}
                            form="addProcessInvoice"
                            projectId={projectId}
                            onRenderComplete={handleChildRenderComplete}
                          />
                        </div>
                      </div>
                      {invoiceObj.clickedInvoice && (
                        <CenteredPagination
                          onChangePage={setPageIdx}
                          pageArray={invoiceObj.clickedInvoice.gcs_img_uri}
                          rows={rows}
                          currentRow={invoiceObj.invoiceRowNumber}
                          open={open}
                          snapShotFormState={
                            snapShotCurrentFormState as FormState
                          }
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
    </>
  );
}
