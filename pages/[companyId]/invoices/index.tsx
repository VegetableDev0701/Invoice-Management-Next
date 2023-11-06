import React from 'react';
import { useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import { usePageData } from '@/hooks/use-page-data';
import { useSetStatePath } from '@/hooks/use-setpath';
import useCreateInvoiceRows from '@/hooks/use-create-invoice-table-data';
import useUploadFilesHandler from '@/hooks/use-upload-files';

import { ProjectSummary } from '@/lib/models/summaryDataModel';
import {
  filterData,
  getProjectNamesForDropdown,
} from '@/lib/utility/tableHelpers';
import { Items, SelectMenuOptions } from '@/lib/models/formDataModel';
import {
  InvoiceData,
  InvoiceTableHeadings,
} from '@/lib/models/invoiceDataModels';

import InvoicesTable from '@/components/Tables/Invoices/InvoiceSortHeadingsTable';
import Card from '@/components/UI/Card';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import SectionHeading from '@/components/UI/SectionHeadings/SectionHeading';
import InvoiceSlideOverlayImage from '@/components/UI/SlideOverlay/InvoiceSlideOverlayImage';
import ModalDuplicateFilesError from '@/components/UI/Modal/ModalErrorDuplicateFiles';

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
  useSetStatePath();
  const { user, isLoading: userLoading } = useUser();

  const { data: invoices, isLoading: pageLoading }: InvoiceData = usePageData(
    'data',
    'invoices'
  );

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

  return (
    <>
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
              totalInvoices={invoiceRows.length}
              buttons={[
                {
                  label: 'Add Invoices',
                  disabled: false,
                  inputClick: handleFileChange,
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
