import { usePageData } from '@/hooks/use-page-data';
import useCreateInvoiceRows from '@/hooks/use-create-invoice-table-data';

import { Items } from '@/lib/models/formDataModel';
import { ContractData, ProjectSummary } from '@/lib/models/summaryDataModel';
import { getProjectNamesForDropdown } from '@/lib/utility/tableHelpers';

import InvoicesTable from '../Tables/Invoices/InvoiceSortHeadingsTable';
import ProcessInvoiceSlideOverlay from '../UI/SlideOverlay/ProcessInvoiceSlideOverlay';
import {
  InvoiceData,
  InvoiceTableHeadings,
} from '@/lib/models/invoiceDataModels';

interface ExtendedItems extends Partial<Items> {
  sortBy: 'label' | 'id';
  forceToTopKey?: string;
}

interface Props {
  projectId: string;
  projects: Record<string, ProjectSummary | string>;
  contractData: ContractData | null;
}

const tableHeadings: InvoiceTableHeadings = {
  vendor_name: 'Vendor',
  project: 'Project',
  invoice_id: 'Invoice Number',
  total_amount: 'Total Due ($)',
  total_tax_amount: 'Total Tax ($)',
  date_received: 'Date Received',
  processed: 'Processed',
  approved: 'Approved',
};

const checkBoxButtons = [{ label: 'Delete', buttonPath: '#', disabled: false }];

export default function ProjectsInvoices(props: Props) {
  const { projectId, projects, contractData } = props;

  const { data: invoices, isLoading: pageLoading }: InvoiceData = usePageData(
    'data',
    'invoices'
  );

  const projectsDropdown = getProjectNamesForDropdown(
    projects.allProjects as ProjectSummary
  );

  const tableDropdownItems: ExtendedItems = {
    value: '',
    id: 'project-name',
    required: false,
    selectMenuOptions: projectsDropdown,
    sortBy: 'label',
    forceToTopKey: 'Unassigned',
  };

  const invoiceRows = useCreateInvoiceRows({
    pageLoading,
    invoices,
    projectId,
  });

  return (
    <>
      <ProcessInvoiceSlideOverlay
        rows={invoiceRows}
        projectId={projectId}
        contractData={contractData ? contractData : null}
      />
      <InvoicesTable
        isProjectPage={true}
        headings={tableHeadings}
        rows={invoiceRows}
        checkboxButtons={checkBoxButtons}
        dropdown={tableDropdownItems}
        projectId={projectId}
        preSortKey="vendor_name"
      />
    </>
  );
}
