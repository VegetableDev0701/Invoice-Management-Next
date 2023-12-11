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
  companyDataActions,
} from '@/store/company-data-slice';
import { contractActions } from '@/store/contract-slice';
import { overlayActions } from '@/store/overlay-control-slice';
import { addVendorFormActions } from '@/store/add-vendor-slice';

import { usePageData } from '@/hooks/use-page-data';
import { useKeyPressActionOverlay } from '@/hooks/use-save-on-key-press';
import { useInvoiceSignedUrl } from '@/hooks/use-get-signed-url';
import useSetNotification from '@/hooks/use-set-notification';
import useHttp from '@/hooks/use-http';

import { FormData } from '@/lib/models/types';
import { FormState, FormStateV2, User } from '@/lib/models/formStateModels';
import { ContractData } from '@/lib/models/summaryDataModel';
import { Items, VendorData } from '@/lib/models/formDataModel';
import { snapshotCopy } from '@/lib/utility/utils';
import { InvoiceTableRow } from '@/lib/models/invoiceDataModels';
import { createSingleVendorSummary } from '@/lib/utility/createSummaryDataHelpers';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { nanoid } from '@/lib/config';
import { checkAllFormFields } from '@/lib/validation/formValidation';

import { XMarkIcon } from '@heroicons/react/24/outline';
import FullScreenLoader from '../Loaders/FullScreenLoader';
import TableDropdown from '@/components/Inputs/InputTableDropdown';
import CenteredPagination from '../Pagination/CenteredNumbersPagination';
import ProcessInvoiceForm from '@/components/Forms/OverlayForm/ProcessInvoiceForm';
import Button from '../Buttons/Button';
import MagnifyImageOnHover from '@/components/Forms/OverlayForm/MagnifyImageOnHover';
import SlideOverlayForm from './SlideOverlayForm';
import ContractSlideOverlayImage from './ContractSlideOverlayImage';

interface ExtendedItems extends Partial<Items> {
  sortBy: 'label' | 'id';
  forceToTopKey?: string;
}

interface Props {
  rows: InvoiceTableRow[] | null;
  projectId: string;
  contractData: ContractData | null;
  dropdown?: ExtendedItems;
  updateData?: boolean;
  onGetSnapShotFormState?: (data: FormStateV2) => void;
}

export default function ProcessInvoiceSlideOverlay(props: Props) {
  const {
    dropdown,
    rows,
    projectId,
    contractData,
    onGetSnapShotFormState,
    updateData = true,
  } = props;

  const { user, isLoading: userLoading } = useUser();

  const [open, setOpen] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  const [key, setKey] = useState(0);
  const [snapShotCurrentFormState, setSnapShotCurrentFormState] =
    useState<FormStateV2 | null>(null);
  const [childHasRendered, setChildHasRendered] = useState(false);
  const [missingInputs, setMissingInputs] = useState<boolean>(false);
  const [renderRows, setRenderRows] = useState<boolean>(false);

  const processInvoiceFormState = useSelector(
    (state) => state.addProcessInvoiceForm
  );
  const [latestFormState, setLatestFormState] = useState(
    processInvoiceFormState
  );

  const processedRef = useRef(false);

  const invoiceObj = useSelector((state) => state.invoice);
  const contractObj = useSelector((state) => state.contract);
  const addVendorOverlay = useSelector((state) => state.overlay.vendors);

  const dispatch = useDispatch();

  const { response, successJSON, sendRequest } = useHttp({
    isClearData: true,
  });

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
    keyName: 'Esc',
  });

  const currentRow = useMemo(() => {
    // can't click an invoice that doesn't exist so -> !
    return (
      rows &&
      rows.find((row) => row.doc_id === invoiceObj?.clickedInvoice?.doc_id)!
    );
  }, [invoiceObj.clickedInvoice, renderRows]);

  //////
  ///
  // We need to capture a snapshot of the processInvoiceFormState when the user clicks
  // the invoice table row. But this formState does not get populated immediately in
  // the ProcessInvoiceForm, child component. In that component it runs through a loop filling in the input
  // values, and only AFTER this is complete, we want to take that snapshot. Because of async
  // characteristics of javascript, this is harder than it seems.
  // First, constantly update the formState in the first useEffect, updating, latestFormState
  // Second, Take the snapshot ONLY when childHasRendered is true, and triggers that second effect.
  // Third, We need to reset childHasRendered each time the user clicks a row.
  // childHasRendered is a callback function that is passed as a prop to the ProcessInvoiceForm component,
  // and called in a useEffect with [], empty, dependencies.
  useEffect(() => {
    setLatestFormState(processInvoiceFormState);
  }, [processInvoiceFormState]);

  useEffect(() => {
    if (childHasRendered && !processedRef.current) {
      setSnapShotCurrentFormState(snapshotCopy(latestFormState));
      if (onGetSnapShotFormState) {
        onGetSnapShotFormState(snapshotCopy(latestFormState));
      }
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
          return contract.summaryData?.uuid
            ? contract.summaryData.uuid ===
                (invoiceObj.clickedInvoice as InvoiceTableRow).vendor_uuid
            : null;
        }
      );

      if (matchedVendorContract) {
        // if we find a contract matched to the vendor, set that in the contract state
        // and then dispatch the `isRowClicked` which will open the slide overlay from
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
        companyDataActions.approveInvoiceState({
          invoiceId: invoiceObj.clickedInvoice.doc_id,
          isApproved,
        })
      );
      dispatch(invoiceActions.updateInvoiceApproval(isApproved));
      dispatch(
        approveInvoice({
          companyId: (user as User).user_metadata.companyId,
          invoiceId: invoiceObj.clickedInvoice.doc_id,
          isApproved: isApproved,
        })
      );
    }
    // manually remove focus on the approve button so that when pressing
    // enter to move to the next invoice it doesn't automatically approve or
    // remove approval from that invoice
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const closeOverlay = () => {
    // check if the contract slide overlay is activated over the process invoice one
    if (contractObj.isRowClicked) {
      contractActions.setClickedContract({
        isRowClicked: false,
      });
      return;
    }
    if (addVendorOverlay.open) {
      overlayActions.setOverlayContent({
        data: { open: false },
        stateKey: 'vendors',
      });
      return;
    } else {
      setOpen(false);
      if (processInvoiceFormState?.isUpdated.value && updateData) {
        dispatch(
          addProcessedInvoiceData({
            companyId: (user as User).user_metadata.companyId,
            invoiceId: (invoiceObj.clickedInvoice as InvoiceTableRow).doc_id,
            projectName: (invoiceObj.clickedInvoice as InvoiceTableRow)
              .project as string,
            snapShotFormState: snapShotCurrentFormState as FormStateV2,
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
        invoiceActions.getInvoiceSnapshot({
          formState: snapshotCopy(processInvoiceFormState) as FormStateV2,
          doc_id: (invoiceObj.clickedInvoice as InvoiceTableRow)?.doc_id,
        })
      );
      dispatch(
        contractActions.setClickedContract({
          contract: null,
          isRowClicked: false,
        })
      );
    }
  };

  const { data: addVendorFormData } = usePageData(
    'data',
    'forms',
    'add-vendor'
  );
  const addVendorFormStateData = useSelector((state) => state.addVendorForm);
  const overlayContent = useSelector((state) => state.overlay.vendors);

  const submitFormHandler = async (
    e: React.FormEvent,
    formStateData?: FormState
  ) => {
    e.preventDefault();

    const allValid = checkAllFormFields(
      addVendorFormData,
      addVendorFormStateData
    );

    if (!allValid) {
      setMissingInputs(true);
      return;
    }
    setMissingInputs(false);

    dispatch(
      overlayActions.setOverlayContent({
        data: { open: false },
        stateKey: 'vendors',
      })
    );

    const vendorUUID = overlayContent?.currentId ?? nanoid();

    // create the form data to push to the DB
    const dataToSubmit = createFormDataForSubmit({
      formData: addVendorFormData,
      formStateData: formStateData as FormState,
      isAddProject: false,
      isAddVendor: true,
      isAddLabor: false,
    }) as VendorData;

    dataToSubmit.uuid = vendorUUID;

    const summaryVendorData = createSingleVendorSummary(
      dataToSubmit as VendorData,
      vendorUUID
    );

    dispatch(
      companyDataActions.addToVendorsSummaryData({
        [vendorUUID]: summaryVendorData,
      })
    );

    dispatch(
      companyDataActions.addNewVendor({
        newVendor: dataToSubmit,
        vendorId: vendorUUID,
      })
    );

    // when adding a new vendor from the process invoice step
    // this vendor should get attached to that invoice
    if (invoiceObj.clickedInvoice) {
      dispatch(
        companyDataActions.updateProcessedVendor({
          invoiceId: invoiceObj.clickedInvoice.doc_id,
          vendor: {
            name: summaryVendorData.vendorName,
            uuid: summaryVendorData.uuid,
          },
        })
      );
      // force the current row and process invoice form component to render with new data
      setRenderRows((prevState) => !prevState);
      setKey((prevState) => prevState + 1);
    }

    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/vendors/add-vendor?vendorId=${overlayContent.currentId}`,
        method: `${overlayContent.isSave ? 'POST' : 'PATCH'}`,
        body: JSON.stringify({
          fullData: dataToSubmit,
          summaryData: summaryVendorData,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      await sendRequest({
        requestConfig,
        actions: addVendorFormActions,
      });
    }
  };

  useSetNotification({
    response,
    successJSON,
    isOverlay: true,
    overlayStateKey: 'vendors',
  });

  return (
    // Have to nest all headless UI components within a single Dialog in order to have focus work for the top most overlay
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeOverlay}>
          <SlideOverlayForm
            formData={addVendorFormData}
            formState={addVendorFormStateData}
            actions={addVendorFormActions}
            showError={missingInputs}
            overlayContent={overlayContent}
            form="addVendor"
            overlayStateKey="vendors"
            onSubmit={(e) => submitFormHandler(e, addVendorFormStateData)}
          />
          <ContractSlideOverlayImage
            rows={contractData && Object.values(contractData).map((row) => row)}
            projectId={projectId}
            isOnProcessInvoices={true}
          />
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
                          <Dialog.Title className="text-base font-sans font-semibold leading-6 text-stak-dark-gray">
                            <p>{`${invoiceObj.clickedInvoice?.vendor_name}`}</p>
                            <div className="flex items-end gap-4">
                              Project:{' '}
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
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              approveInvoiceHandler({
                                isApproved:
                                  invoiceObj.clickedInvoice?.approved === 'Yes'
                                    ? false
                                    : true,
                              });
                            }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                closeOverlay();
                              }}
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
                                    vendor_name: currentRow.vendor_name,
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
                            snapShotCurrentFormState as FormStateV2
                          }
                          updateData={updateData}
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
