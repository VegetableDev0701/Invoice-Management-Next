import React from 'react';
import { useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { FormStateV2 } from '@/lib/models/formStateModels';
import { usePageData } from '@/hooks/use-page-data';
import { useSetStatePath } from '@/hooks/use-setpath';
import useCreateInvoiceRows from '@/hooks/use-create-invoice-table-data';
import useUploadFilesHandler from '@/hooks/use-upload-files';
import { overlayActions } from '@/store/overlay-control-slice';
import { singleInvoiceFormActions } from '@/store/process-invoice-slice';
import { ProjectSummary } from '@/lib/models/summaryDataModel';
import useHttp from '@/hooks/use-http';
import {
  filterData,
  getProjectNamesForDropdown,
} from '@/lib/utility/tableHelpers';
import { Items, SelectMenuOptions } from '@/lib/models/formDataModel';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import {
  InvoiceData,
  InvoiceItem,
  InvoiceTableHeadings,
} from '@/lib/models/invoiceDataModels';

import InvoicesTable from '@/components/Tables/Invoices/InvoiceSortHeadingsTable';
import Card from '@/components/UI/Card';
import SlideOverlayForm from '@/components/UI/SlideOverlay/SlideOverlayForm';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import SectionHeading from '@/components/UI/SectionHeadings/SectionHeading';
import InvoiceSlideOverlayImage from '@/components/UI/SlideOverlay/InvoiceSlideOverlayImage';
import ModalDuplicateFilesError from '@/components/UI/Modal/ModalErrorDuplicateFiles';
import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import { User } from '@/lib/models/formStateModels';
import { checkAllFormFields } from '@/lib/validation/formValidation';
import { nanoid } from '@/lib/config';
import { companyDataActions } from '@/store/company-data-slice';
import {
  defaultInvoiceItem,
  defaultProcessedInvoiceData,
} from '@/lib/models/initDataModels';
const tabs = [
  { name: 'All Unassigned Invoices', keyName: 'all', current: true },
];

const tableHeadings: InvoiceTableHeadings = {
  vendor_name: 'Vendor',
  project: 'Project',
  predicted_project: 'Predicted Project',
  total_amount: 'Total Due ($)',
  invoice_id: 'Invoice Number',
  date_received: 'Date Received',
  processed: 'Processed',
  approved: 'Approved',
  status: 'Status',
};

const checkBoxButtons = [
  { label: 'Auto Assign', buttonPath: '#' },
  { label: 'Update Invoices', buttonPath: '#', disabled: false },
  { label: 'Delete', buttonPath: '#', disabled: false },
];

interface ExtendedItems extends Partial<Items> {
  sortBy: 'label' | 'id';
  forceToTopKey?: string;
}

function Invoices() {
  const dispatch = useDispatch();
  useSetStatePath();
  const { data: singleInvoiceFormData } = usePageData(
    'data',
    'forms',
    'process-invoice'
  );
  // const { isLoading: userLoading } = useUser();
  const [missingInputs, setMissingInputs] = useState<boolean>(false);
  const { user, isLoading: userLoading } = useUser();
  const singleInvoiceFormStateData = useSelector(
    (state) => state.singleInvoiceForm
  );
  const overlayContent = useSelector(
    (state) => state.overlay['process-invoices']
  );
  const { data: invoices, isLoading: pageLoading }: InvoiceData = usePageData(
    'data',
    'invoices'
  );
  const { sendRequest } = useHttp({ isClearData: true });
  const {
    data: projects,
    isLoading: projectsLoading,
  }: {
    data: { status: string; allProjects: ProjectSummary };
    isLoading: boolean;
  } = usePageData('data', 'projectsSummary');

  const { openModal, duplicateFiles, handleFileChange, closeModalHandler } =
    useUploadFilesHandler({ uploadFileType: 'invoice' });

  const [activeTabKeyName, setActiveTabKeyName] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('No Filter');

  let projectsDropdown: SelectMenuOptions[] = [];
  if (!projectsLoading) {
    projectsDropdown = getProjectNamesForDropdown(projects.allProjects);
  }

  const invoiceRows = useCreateInvoiceRows({ pageLoading, invoices });

  const handleSingleInvoice = () => {
    dispatch(singleInvoiceFormActions.clearFormState());
    dispatch(singleInvoiceFormActions.resetFormValidation());
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Single Invoice',
          open: true,
          isSave: true,
        },
        stateKey: 'process-invoices',
      })
    );
    dispatch(
      overlayActions.setCurrentOverlayData({
        data: {
          currentData: null,
          currentId: null,
        },
        stateKey: 'process-invoices',
      })
    );
  };

  // legacy code when there were tabs and filters to take into consideration. keep for now in case I bring back that capability
  const filteredData = useMemo(() => {
    if (invoiceRows) {
      if (activeTabKeyName === 'all') {
        return filterData(invoiceRows, activeFilter, 'No Filter', 'project');
      } else if (activeTabKeyName === 'unassigned') {
        const subFilteredData = invoiceRows.filter(
          (row) => row['project'] === '' || row['project'] === 'Unassigned'
        );
        return filterData(
          subFilteredData,
          activeFilter,
          'No Filter',
          'project'
        );
      } else if (activeTabKeyName === 'assigned') {
        const subFilteredData = invoiceRows.filter(
          (row) => row['project'] !== '' && row['project'] !== 'Unassigned'
        );
        return filterData(
          subFilteredData,
          activeFilter,
          'No Filter',
          'project'
        );
      }
    } else {
      return [];
    }
  }, [invoiceRows, activeFilter, activeTabKeyName]);

  const tableDropdownItems: ExtendedItems = {
    value: '',
    id: 'project-name',
    required: false,
    selectMenuOptions: projectsDropdown,
    sortBy: 'label',
    forceToTopKey: 'Unassigned',
  };

  const submitFormHandler = async (
    e: React.FormEvent,
    formStateData: FormStateV2
  ) => {
    e.preventDefault();
    const allValid = checkAllFormFields(
      singleInvoiceFormData,
      singleInvoiceFormStateData
    );
    if (!allValid) {
      setMissingInputs(true);
      // return
    }
    setMissingInputs(false);
    dispatch(
      overlayActions.setOverlayContent({
        data: { open: false },
        stateKey: 'process-invoices',
      })
    );

    const invoiceUUID = overlayContent?.currentId ?? nanoid();

    const dataToSubmit = createFormDataForSubmit({
      formData: singleInvoiceFormData,
      formStateData: formStateData,
      isAddProject: false,
      isAddVendor: false,
      isAddLabor: false,
    }) as any;

    dataToSubmit.invoice_id = invoiceUUID;

    const sendingInvoiceData: InvoiceItem = {
      ...defaultInvoiceItem,
      processedData: {
        ...defaultProcessedInvoiceData,
        ...dataToSubmit,
      },
    };

    dispatch(
      companyDataActions.addSingleInvoiceData({
        invoice: sendingInvoiceData,
        uuid: invoiceUUID,
      })
    );

    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/invoices/add-single-invoice`,
        method: 'POST',
        body: JSON.stringify({
          ...sendingInvoiceData,
          // fullData: {}
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
      await sendRequest({
        requestConfig,
        actions: singleInvoiceFormActions,
      });
    }
  };

  return (
    <>
      <SlideOverlayForm
        formData={singleInvoiceFormData}
        formState={singleInvoiceFormStateData}
        actions={singleInvoiceFormActions}
        showError={missingInputs}
        overlayContent={overlayContent}
        form="singleInvoice"
        overlayStateKey="process-invoices"
        onSubmit={(e) => submitFormHandler(e, singleInvoiceFormStateData)}
      />
      <ModalDuplicateFilesError
        onCloseModal={closeModalHandler}
        openModal={openModal}
        data={duplicateFiles}
      />
      {(userLoading || pageLoading || !invoiceRows || projectsLoading) && (
        <FullScreenLoader />
      )}
      {!userLoading &&
        !pageLoading &&
        !projectsLoading &&
        invoiceRows &&
        filteredData && (
          <div className="main-form-tiles">
            <InvoiceSlideOverlayImage
              rows={filteredData}
              dropdown={{
                value: '',
                id: 'project-name',
                selectMenuOptions: projectsDropdown,
                sortBy: 'label',
                forceToTopKey: 'Unassigned',
              }}
            />
            <SectionHeading
              tabs={tabs}
              totalNum={invoiceRows.length}
              buttons={[
                {
                  label: 'Add Invoices',
                  disabled: false,
                  inputClick: handleFileChange,
                },
                {
                  label: 'Single Invoices',
                  disabled: false,
                  onClick: handleSingleInvoice,
                },
              ]}
              onActiveTab={setActiveTabKeyName}
              onFilter={setActiveFilter}
            />
            <div className="content-tiles">
              <Card className="h-full bg-stak-white w-full">
                <div
                  className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch overflow-y-scroll"
                  id="scroll-frame"
                >
                  <InvoicesTable
                    headings={tableHeadings}
                    rows={filteredData}
                    checkboxButtons={checkBoxButtons}
                    dropdown={tableDropdownItems}
                    preSortKey="vendor_name"
                  />
                </div>
              </Card>
            </div>
          </div>
        )}
    </>
  );
}

export default React.memo(Invoices);
