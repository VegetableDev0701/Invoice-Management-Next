import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useMemo, useState } from 'react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import {
  addVendorFormActions,
  deleteVendors,
  getVendorsAgave,
  syncVendors,
} from '@/store/add-vendor-slice';
import {
  getCurrentVendor,
  overlayActions,
} from '@/store/overlay-control-slice';
import { companyDataActions } from '@/store/company-data-slice';
import { uiActions } from '@/store/ui-slice';

import { usePageData } from '@/hooks/use-page-data';
import { useSetStatePath } from '@/hooks/use-setpath';
import useHttp from '@/hooks/use-http';
import { useUploadVendorNotification } from '@/hooks/use-set-notification';

import { FormState, User } from '@/lib/models/formStateModels';
import { hasAnyExpiredDates } from '@/lib/utility/tableHelpers';
import {
  VendorSummary,
  VendorSummaryItem,
} from '@/lib/models/summaryDataModel';
import { VendorData } from '@/lib/models/formDataModel';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { createSingleVendorSummary } from '@/lib/utility/createSummaryDataHelpers';
import { checkAllFormFields } from '@/lib/validation/formValidation';
import { nanoid } from '@/lib/config';

import Card from '@/components/UI/Card';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import SectionHeading from '@/components/UI/SectionHeadings/SectionHeading';
import CheckboxSortHeadingsTable from '@/components/Tables/MainTables/CheckboxSortHeadingsTableWithFilter';
import SlideOverlayForm from '@/components/UI/SlideOverlay/SlideOverlayForm';
import ModalConfirm from '@/components/UI/Modal/ModalConfirm';
import ModalErrorWrapper from '@/components/UI/Modal/ErrorModalWrapper';

const sectionTabs = [
  { name: 'All', keyName: 'all', current: true },
  {
    name: 'Expired License',
    keyName: 'expiredLicense',
    current: false,
  },
  { name: 'Not Synced to Quickbooks', keyName: 'isSync', current: false },
];

const tableHeadings = {
  vendorName: 'Vendor Name',
  workPhone: 'Phone',
  address: 'Address',
  city: 'City',
  insuranceExpirationDate: 'Insurance Expiration',
  agave_uuid: 'Status',
  // landiExpirationDate: 'L&I License Expiration',
  // workersCompExpirationDate: 'Workers Comp Expiration',
};

function Vendors() {
  useSetStatePath();
  const { user, isLoading: userLoading } = useUser();

  const syncAllVendorsTaskId = 'sync_all_vendors';
  const addVendorTaskId = 'add_vendor';

  const dispatch = useDispatch();

  const {
    data: allVendorSummary,
    isLoading: pageLoading,
  }: { data: VendorSummary; isLoading: boolean } = usePageData(
    'data',
    'vendorsSummary',
    'allVendors'
  );

  const { data: addVendorFormData } = usePageData(
    'data',
    'forms',
    'add-vendor'
  );

  const [vendorSummary, setVendorSummary] = useState<
    VendorSummary | undefined | null
  >(null);
  const [activeTabKeyName, setActiveTabKeyName] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('No Filter');
  const [missingInputs, setMissingInputs] = useState<boolean>(false);
  const [selected, setSelected] = useState<VendorSummaryItem[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const modalMessage =
    'Please confirm that you want to delete vendor(s). This is permanent and cannot be recovered.';
  const overlayContent = useSelector((state) => state.overlay.vendors);
  const addVendorFormStateData = useSelector((state) => state.addVendorForm);

  const { response, successJSON, sendRequest } = useHttp({ isClearData: true });

  useEffect(() => {
    if (!pageLoading) {
      setVendorSummary(allVendorSummary);
    }
  }, [allVendorSummary]);

  const filteredData = useMemo(() => {
    if (!vendorSummary) return null;
    let filteredData: VendorSummaryItem[];

    const vendorsArray: VendorSummaryItem[] = Object.values(vendorSummary);
    if (activeTabKeyName === 'all') {
      if (activeFilter !== 'No Filter') {
        filteredData = vendorsArray.filter(
          (row) => row.vendorType === activeFilter
        );
        return filteredData;
      } else {
        filteredData = vendorsArray;
        return filteredData;
      }
    } else if (activeTabKeyName === 'expiredLicense') {
      const subFilteredData = Object.values(hasAnyExpiredDates(vendorSummary));
      if (activeFilter !== 'No Filter') {
        filteredData = subFilteredData.filter(
          (row) => row.vendorType === activeFilter
        );
        return filteredData;
      } else {
        filteredData = subFilteredData;
        return filteredData;
      }
    } else if (activeTabKeyName === 'isSync') {
      filteredData = vendorsArray.filter((row) => !row.agave_uuid);
      return filteredData;
    }
  }, [vendorSummary, activeFilter, activeTabKeyName]);

  const rowClickHandler = (uuid: string) => {
    dispatch(addVendorFormActions.clearFormState());
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Update Vendor',
          open: true,
          isSave: false,
          currentId: uuid,
        },
        stateKey: 'vendors',
      })
    );

    dispatch(getCurrentVendor({ vendorId: uuid }));
  };

  const addVendorHandler = () => {
    dispatch(addVendorFormActions.clearFormState());
    dispatch(addVendorFormActions.resetFormValidation());
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Add Vendor',
          open: true,
          isSave: true,
        },
        stateKey: 'vendors',
      })
    );
    dispatch(
      overlayActions.setCurrentOverlayData({
        data: {
          currentData: null,
          currentId: null,
        },
        stateKey: 'vendors',
      })
    );
  };

  const syncVendorsHandler = async () => {
    await dispatch(
      getVendorsAgave({
        companyId: (user as User).user_metadata.companyId,
        taskId: syncAllVendorsTaskId,
      })
    );
  };

  const buttonClickHandler = async (
    label: string,
    selected: VendorSummaryItem[]
  ) => {
    setSelected(selected);
    if (label === 'Delete') {
      setOpenModal(true);
      return;
    }
    if (label === 'Sync to QB') {
      // logic check if it already has an agave uuid, if so skip
      const vendorsToSync = selected.filter((vendor) => !vendor.agave_uuid);
      await dispatch(
        syncVendors({
          companyId: (user as User).user_metadata.companyId,
          vendors: vendorsToSync,
        })
      );

      // send this vendor(s) to the add vendor to qb via agave endpoint
      // make sure this works for one or many vendors
      return;
    }
  };

  const closeModalHandler = () => {
    setOpenModal(false);
  };

  const confirmModalHandler = () => {
    const vendorsToDelete = selected.map((vendor) => vendor.uuid as string);
    dispatch(companyDataActions.removeVendorsFromState(vendorsToDelete));
    dispatch(
      deleteVendors({
        companyId: (user as User).user_metadata.companyId as string,
        vendorsToDelete: vendorsToDelete,
      })
    );
  };

  useUploadVendorNotification({
    jsonResponse: successJSON as {
      message: string;
      agave_uuid?: string;
      uuid?: string;
    },
    response,
  });

  const submitFormHandler = async (
    e: React.FormEvent,
    formStateData?: FormState
  ) => {
    e.preventDefault();

    dispatch(
      uiActions.setTaskLoadingState({
        taskId: addVendorTaskId,
        isLoading: true,
      })
    );
    try {
      const allValid = checkAllFormFields(
        addVendorFormData,
        addVendorFormStateData
      );

      if (!allValid) {
        setMissingInputs(true);
        return;
      }
      if (overlayContent.isNameDuped) {
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
      const agave_uuid =
        (vendorSummary && vendorSummary[vendorUUID]?.agave_uuid) || null;

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
        vendorUUID,
        agave_uuid
      );

      dispatch(
        companyDataActions.addToVendorsSummaryData({
          [vendorUUID]: summaryVendorData,
        })
      );

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
    } catch (error: any) {
      console.error(error);
    } finally {
      dispatch(
        uiActions.setTaskLoadingState({
          taskId: addVendorTaskId,
          isLoading: false,
        })
      );
    }
  };

  return (
    <>
      {(userLoading || pageLoading) && <FullScreenLoader />}
      {!userLoading && !pageLoading && (
        <>
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
          <ModalConfirm
            onCloseModal={closeModalHandler}
            openModal={openModal}
            onConfirm={confirmModalHandler}
            message={modalMessage}
            title="Delete"
          />
          <ModalErrorWrapper />
          <div className="main-form-tiles">
            <SectionHeading
              tabs={sectionTabs}
              totalNum={vendorSummary ? Object.keys(vendorSummary).length : 0}
              buttons={[
                {
                  label: 'Sync All Vendors',
                  onClick: syncVendorsHandler,
                  className: 'px-8 py-1 text-xl font-normal bg-stak-dark-green',
                  taskId: syncAllVendorsTaskId,
                },
                {
                  label: 'Add Vendor',
                  onClick: addVendorHandler,
                  className: 'px-8 py-1 text-xl font-normal bg-stak-dark-green',
                  taskId: addVendorTaskId,
                },
              ]}
              // removed the drop down filter but keep the code around just in case we want it again
              // dropdownFilter={{
              //   label: 'Vendor Type',
              //   value: '',
              //   id: 'vendor-type',
              //   required: false,
              //   'data-testid': 'vendor-type-filter',
              //   selectMenuOptions: SELECT_MENU_DIVISIONS,
              //   sortBy: 'id',
              // }}
              onActiveTab={(activeTabKeyName) =>
                setActiveTabKeyName(activeTabKeyName)
              }
              onFilter={(activeFilter) => setActiveFilter(activeFilter)}
            />
            <div className="content-tiles">
              <Card className="h-full bg-stak-white w-full">
                <div
                  className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch overflow-y-scroll"
                  id="scroll-frame"
                >
                  <CheckboxSortHeadingsTable
                    headings={tableHeadings}
                    rows={filteredData}
                    activeFilter={activeFilter}
                    activeTabKeyName={activeTabKeyName}
                    checkboxButtons={[
                      { label: 'Draft Email', buttonPath: '#', disabled: true },
                      { label: 'Delete', buttonPath: '#', disabled: false },
                      { label: 'Sync to QB', buttonPath: '#', disabled: false },
                    ]}
                    filterKey="vendorType"
                    tableType="vendors"
                    preSortKey="vendorName"
                    selectedRowId={overlayContent.currentId}
                    onRowClick={rowClickHandler}
                    onButtonClick={buttonClickHandler}
                  />
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default React.memo(Vendors);
