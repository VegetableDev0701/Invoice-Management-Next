import { Fragment, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { editContractFormActions } from '@/store/edit-contract';
import { overlayActions } from '@/store/overlay-control-slice';
import { projectDataActions } from '@/store/projects-data-slice';
import { companyDataActions } from '@/store/company-data-slice';
import { contractActions } from '@/store/contract-slice';
import { addVendorFormActions } from '@/store/add-vendor-slice';

import { useKeyPressActionOverlay } from '@/hooks/use-save-on-key-press';
import { usePageData } from '@/hooks/use-page-data';
import useSetNotification from '@/hooks/use-set-notification';
import useHttp from '@/hooks/use-http';
import { useContractSignedUrl } from '@/hooks/use-get-signed-url';

import { FormState, FormStateV2, User } from '@/lib/models/formStateModels';
import {
  ContractData,
  ContractEntry,
  ContractTableRow,
  VendorSummary,
  VendorSummaryItem,
} from '@/lib/models/summaryDataModel';
import { FormData } from '@/lib/models/types';
import { VendorData } from '@/lib/models/formDataModel';
import { checkAllFormFields } from '@/lib/validation/formValidation';
import { formatNumber } from '@/lib/utility/formatter';
import { createSingleVendorSummary } from '@/lib/utility/createSummaryDataHelpers';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { isObjectEmpty } from '@/lib/utility/utils';
import { nanoid } from '@/lib/config';

import SlideOverlayForm from './SlideOverlayForm';
import { XMarkIcon } from '@heroicons/react/24/outline';
import FullScreenLoader from '../Loaders/FullScreenLoader';
import MagnifyImageOnHover from '@/components/Forms/OverlayForm/MagnifyImageOnHover';
import CenteredPagination from '../Pagination/CenteredNumbersPagination';
import FormOverlay from '@/components/Forms/OverlayForm/FormOverlay';
import { useCreateVendorSelectMenu } from '@/hooks/use-utils';

interface Props {
  projectId: string;
  rows: ContractTableRow[] | null;
  tableData: ContractData | null;
}

export default function ContractSlideOverlay(props: Props) {
  const { tableData, projectId, rows } = props;
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  const [currentData, setCurrentData] = useState<FormData | null>(null);
  const { data: editContractFormData }: { data: FormData } = usePageData(
    'data',
    'forms',
    'edit-contract'
  );
  const { data: addVendorFormData } = usePageData(
    'data',
    'forms',
    'add-vendor'
  );
  const addVendorOverlay = useSelector((state) => state.overlay.vendors);

  const addVendorFormStateData = useSelector((state) => state.addVendorForm);
  const vendorsOverlayContent = useSelector((state) => state.overlay.vendors);
  const vendorSummary = useSelector(
    (state) => state.data.vendorsSummary.allVendors
  );
  const vendorDropDownData =
    (vendorSummary &&
      !isObjectEmpty(vendorSummary) &&
      useCreateVendorSelectMenu({
        vendorSummary: vendorSummary as VendorSummary,
      })) ||
    [];
  const { user, isLoading: userLoading } = useUser();

  const { response, successJSON, sendRequest } = useHttp({
    isClearData: false,
  });

  const editContractFormStateData = useSelector(
    (state) => state.editContractForm
  );

  const contractObj = useSelector((state) => state.contract);
  const overlayContent = useSelector((state) => state.overlay.contracts);

  const [missingInputs, setMissingInputs] = useState<boolean>(false);
  const [key, setKey] = useState(0);

  const closeFormRef = useRef<HTMLButtonElement>(null);

  useKeyPressActionOverlay({
    formOverlayOpen: open,
    ref: closeFormRef,
    keyName: 'Enter',
  });

  const currentRow =
    rows &&
    rows.find((row) => row.uuid === contractObj?.clickedContract?.uuid)!;

  useEffect(() => {
    setCurrentData(
      overlayContent?.currentData
        ? (overlayContent.currentData as FormData)
        : editContractFormData
    );
  }, [overlayContent.currentData]);

  // because we auto sort to the vendor name, need to update the "clicked" row number when we change the vendor name
  // This is a bug introduced when we add a new vendor from this overlay, thus changing the vendor name,
  // but not updating the new row index number in the resorted list in state.
  useEffect(() => {
    if (currentRow && rows && tableData) {
      dispatch(
        contractActions.setClicked({
          contract: tableData[currentRow.uuid],
          isRowClicked: true,
          rowNumber: rows
            .map((contract) => contract.uuid)
            .indexOf(currentRow.uuid),
        })
      );
    }
  }, [currentRow]);

  const submitContractFormHandler = async (formStateData?: FormStateV2) => {
    const allValid = checkAllFormFields(
      editContractFormData,
      editContractFormStateData
    );

    if (!allValid) {
      setMissingInputs(true);
      return;
    }

    setMissingInputs(false);
    dispatch(
      overlayActions.setOverlayContent({
        data: { open: false },
        stateKey: 'contracts',
      })
    );

    if (!tableData || !overlayContent.currentId || !formStateData) return;

    const matchedVendorSummary: VendorSummaryItem =
      !isObjectEmpty(vendorSummary) &&
      Object.values(vendorSummary).find((vendor) => {
        if (formStateData?.['vendor-name']?.value) {
          return vendor.vendorName === formStateData?.['vendor-name']?.value;
        }
      });

    const dataToSubmit: ContractEntry = {
      ...tableData[overlayContent.currentId],
      summaryData: {
        ...tableData[overlayContent.currentId].summaryData,
        contractAmt: formatNumber(
          Number(
            (formStateData['contract-amount'].value as string).replaceAll(
              ',',
              ''
            )
          ).toFixed(2)
        ),
        date: String(formStateData['contract-date'].value),
        vendor: {
          ...tableData[overlayContent.currentId].summaryData.vendor,
          name: matchedVendorSummary.vendorName,
          uuid: matchedVendorSummary.uuid,
          agave_uuid: matchedVendorSummary.agave_uuid,
        },
      },
    };

    dispatch(
      projectDataActions.addFullData({
        newData: dataToSubmit,
        projectId: projectId,
        stateKey: 'contracts',
      })
    );

    if (!userLoading && user) {
      let headers = {};
      headers = {
        contractId: overlayContent.currentId,
        'Content-Type': 'application/json',
      };

      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}/edit-contract`,
        method: 'POST',
        body: JSON.stringify(dataToSubmit),
        headers: headers,
      };

      await sendRequest({
        requestConfig,
        actions: editContractFormActions,
        pushPath: `/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}`,
      });
    }
  };

  const submitVendorFormHandler = async (
    e: React.FormEvent,
    formStateData?: FormState
  ) => {
    e.preventDefault();
    e.stopPropagation();

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

    const vendorUUID = vendorsOverlayContent?.currentId ?? nanoid();
    const agave_uuid =
      (vendorSummary &&
        !isObjectEmpty(vendorSummary) &&
        (vendorSummary as VendorSummary)[vendorUUID]?.agave_uuid) ||
      null;

    // create the form data to push to the DB
    const dataToSubmit = createFormDataForSubmit({
      formData: addVendorFormData,
      formStateData: formStateData as FormStateV2,
      isAddProject: false,
      isAddVendor: true,
      isAddLabor: false,
    }) as VendorData;

    dataToSubmit.uuid = vendorUUID;

    const summaryVendorData = createSingleVendorSummary(
      dataToSubmit as VendorData,
      vendorUUID,
      agave_uuid
    );

    dispatch(
      companyDataActions.addToVendorsSummaryData({
        [vendorUUID]: summaryVendorData,
      })
    );

    if (contractObj.clickedContract) {
      dispatch(
        projectDataActions.updateContractVendorOnAdd({
          contractId: contractObj.clickedContract.uuid,
          projectId,
          vendor: {
            name: summaryVendorData.vendorName,
            uuid: summaryVendorData.uuid,
            agave_uuid: summaryVendorData.agave_uuid,
            vendor_match_conf_score: null,
          },
        })
      );
      setCurrentData(
        createFormDataForSubmit({
          formData: editContractFormData,
          formStateData: {
            ...formStateData,
            'vendor-name': { value: summaryVendorData.vendorName },
          },
          isAddProject: false,
          isAddVendor: true,
          isAddLabor: false,
        })
      );

      // force the child componenet that renders the form to re-render
      setKey((prevState) => prevState + 1);
    }

    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/vendors/add-vendor?vendorId=${vendorsOverlayContent.currentId}`,
        method: `${vendorsOverlayContent.isSave ? 'POST' : 'PATCH'}`,
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

  useEffect(() => {
    setOpen(!!overlayContent.open);
  }, [overlayContent.open]);

  useSetNotification({
    response,
    successJSON,
    isOverlay: true,
    overlayStateKey: 'contracts',
  });

  useContractSignedUrl(contractObj, projectId);

  const closeOverlay = () => {
    if (addVendorOverlay.open) {
      overlayActions.setOverlayContent({
        data: { open: false },
        stateKey: 'vendors',
      });
      return;
    }
    setOpen(false);
    dispatch(
      contractActions.setClicked({
        contract: null,
        isRowClicked: false,
      })
    );
    dispatch(
      overlayActions.setOverlayContent({
        data: { open: false },
        stateKey: 'contracts',
      })
    );
    if (editContractFormStateData.isUpdated.value) {
      submitContractFormHandler(editContractFormStateData);
    }
  };

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
            overlayContent={vendorsOverlayContent}
            form="addVendor"
            overlayStateKey="vendors"
            onProcessInvoiceForm={true}
            onSubmit={(e) => submitVendorFormHandler(e, addVendorFormStateData)}
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
                      <div className="flex justify-between items-center">
                        <div className="w-6/12">
                          <Dialog.Title className="text-base font-sans font-semibold leading-6 text-stak-dark-gray">
                            <p>{`${
                              contractObj.clickedContract &&
                              contractObj.clickedContract.summaryData.vendor
                                .name
                            }`}</p>
                            <div className="flex items-end gap-4">
                              Project:{' '}
                              {contractObj.clickedContract &&
                                contractObj.clickedContract.summaryData
                                  .projectName}
                            </div>
                          </Dialog.Title>
                        </div>
                        <div className="flex ml-3 h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-800 focus:outline-none focus:ring-0 focus:ring-offset-0"
                            ref={closeFormRef}
                            onClick={(e) => {
                              e.stopPropagation();
                              closeOverlay();
                            }}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="relative flex-1 overflow-auto mt-6 px-4 sm:px-6 flex">
                        {contractObj.isLoading && (
                          <FullScreenLoader className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        )}
                        <div className="w-[50%] overflow-y-scroll">
                          {!contractObj.isLoading && currentRow && (
                            <MagnifyImageOnHover
                              src={
                                contractObj.signedUrls[
                                  (contractObj.clickedContract as ContractEntry)
                                    .uuid
                                ]?.signedUrls?.[pageIdx]
                              }
                              alt={
                                contractObj.clickedContract?.summaryData?.vendor
                                  ?.name
                                  ? contractObj.clickedContract.summaryData
                                      .vendor.name
                                  : 'Unknown'
                              }
                              pageIdx={pageIdx}
                              className="object-fill w-full h-full"
                            />
                          )}
                        </div>
                        <div className="w-[50%] px-4">
                          <FormOverlay
                            key={key}
                            formData={currentData as FormData}
                            formState={editContractFormStateData}
                            actions={editContractFormActions}
                            showError={missingInputs}
                            projectId={projectId}
                            form={'editContract'}
                            vendorDropDownData={vendorDropDownData}
                          />
                        </div>
                      </div>
                      {contractObj.clickedContract && (
                        <CenteredPagination
                          onChangePage={setPageIdx}
                          pageArray={contractObj.clickedContract.gcs_img_uri}
                          open={open}
                          currentRowIdx={contractObj.rowNumber}
                          rows={null}
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
