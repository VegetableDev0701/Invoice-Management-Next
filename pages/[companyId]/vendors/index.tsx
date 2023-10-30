import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useMemo, useState } from 'react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { addVendorFormActions, deleteVendors } from '@/store/add-vendor-slice';
import {
  getCurrentVendor,
  overlayActions,
} from '@/store/overlay-control-slice';
import { companyDataActions } from '@/store/company-data-slice';

import { usePageData } from '@/hooks/use-page-data';
import { useSetStatePath } from '@/hooks/use-setpath';
import useHttp from '@/hooks/use-http';
import useSetNotification from '@/hooks/use-set-nofitication';

import { FormState, User } from '@/lib/models/formStateModels';
import { SELECT_MENU_DIVISIONS } from '@/lib/globals';
import { hasAnyExpiredDates } from '@/lib/utility/tableHelpers';
import {
  VendorSummary,
  VendorSummaryItem,
} from '@/lib/models/summaryDataModel';
import { VendorData } from '@/lib/models/formDataModel';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { createSingleVendorSummary } from '@/lib/utility/createSummaryDataHelpers';
import { checkAllFormFields } from '@/lib/validation/formValidation';

import Card from '@/components/UI/Card';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import SectionHeading from '@/components/UI/SectionHeadings/SectionHeading';
import CheckboxSortHeadingsTable from '@/components/Tables/MainTables/CheckboxSortHeadingsTableWithFilter';
import SlideOverlayForm from '@/components/UI/SlideOverlay/SlideOverlayForm';
import ModalConfirm from '@/components/UI/Modal/ModalConfirm';

const tabs = [
  { name: 'All', keyName: 'all', current: true },
  {
    name: 'Expired License',
    keyName: 'expiredLicense',
    current: false,
  },
];

const tableHeadings = {
  vendorName: 'Vendor Name',
  workPhone: 'Phone',
  address: 'Address',
  city: 'City',
  insuranceExpirationDate: 'Insurance Expiration',
  landiExpirationDate: 'L&I License Expiration',
  workersCompExpirationDate: 'Workers Comp Expiration',
};

function Vendors() {
  useSetStatePath();
  const { user, isLoading: userLoading } = useUser();

  const dispatch = useDispatch();

  const {
    data: allVendorSummary,
    isLoading: pageLoading,
  }: { data: VendorSummary; isLoading: Boolean } = usePageData(
    'data',
    'vendorsSummary'
  );
  const { data: addVendorFormData, isLoading } = usePageData(
    'data',
    'forms',
    'add-vendor'
  );

  const [vendors, setVendors] = useState<VendorSummary | undefined | null>(
    null
  );
  const [activeTabKeyName, setActiveTabKeyName] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState('No Filter');
  const [missingInputs, setMissingInputs] = useState<boolean>(false);
  const [selected, setSelected] = useState<VendorSummaryItem[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>(
    'Please confirm that you want to delete vendor(s). This is permanent and cannot be recovered.'
  );
  const overlayContent = useSelector((state) => state.overlay.vendors);
  const addVendorFormStateData = useSelector((state) => state.addVendorForm);

  const { response, successJSON, sendRequest } = useHttp({ isClearData: true });

  useEffect(() => {
    if (!pageLoading) {
      setVendors(allVendorSummary);
    }
  }, [allVendorSummary]);

  const filteredData = useMemo(() => {
    if (!vendors?.allVendors) return null;
    let filteredData: VendorSummaryItem[];
    if (vendors) {
      const vendorsArray = Object.values(vendors.allVendors);
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
        const subFilteredData = Object.values(
          hasAnyExpiredDates(vendors, 'allVendors')
        );
        if (activeFilter !== 'No Filter') {
          filteredData = subFilteredData.filter(
            (row) => row.vendorType === activeFilter
          );
          return filteredData;
        } else {
          filteredData = subFilteredData;
          return filteredData;
        }
      }
    }
  }, [vendors, activeFilter, activeTabKeyName]);

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

  const buttonClickHandler = (label: string, selected: VendorSummaryItem[]) => {
    setSelected(selected);
    if (label === 'Delete') {
      setOpenModal(true);
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

  useSetNotification({
    response,
    successJSON,
    isOverlay: true,
    overlayStateKey: 'vendors',
  });

  const updateSubmitHandler = async (
    e: React.FormEvent,
    formStateData?: FormState
  ) => {
    e.preventDefault();

    if (!overlayContent?.currentId) return;

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

    const vendorUUID = overlayContent.currentId as string;

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

    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/vendors/add-vendor`,
        method: 'PATCH',
        body: JSON.stringify({
          fullData: dataToSubmit,
          summaryData: summaryVendorData,
        }),
        headers: {
          vendorId: overlayContent.currentId,
          'Content-Type': 'application/json',
        },
      };

      await sendRequest({
        requestConfig,
        actions: addVendorFormActions,
        pushPath: `/${(user as User).user_metadata.companyId}/vendors`,
      });
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
            onSubmit={(e) => updateSubmitHandler(e, addVendorFormStateData)}
          />
          <ModalConfirm
            onCloseModal={closeModalHandler}
            openModal={openModal}
            onConfirm={confirmModalHandler}
            message={modalMessage}
            title="Delete"
          />
          <div className="main-form-tiles">
            <SectionHeading
              tabs={tabs}
              buttons={[
                {
                  label: 'Add Vendor',
                  buttonPath: `/${
                    (user as User).user_metadata.companyId
                  }/vendors/add-vendor`,
                },
              ]}
              dropdownFilter={{
                label: 'Vendor Type',
                value: '',
                id: 'vendor-type',
                required: false,
                'data-testid': 'vendor-type-filter',
                selectMenuOptions: SELECT_MENU_DIVISIONS,
                sortBy: 'id',
              }}
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
                    rows={filteredData} // TODO fix this type issue
                    activeFilter={activeFilter}
                    checkboxButtons={[
                      { label: 'Draft Email', buttonPath: '#', disabled: true },
                      { label: 'Delete', buttonPath: '#', disabled: false },
                    ]}
                    filterKey="vendorType"
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

export default Vendors;
