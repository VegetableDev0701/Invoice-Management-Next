import useCreateInvoiceRows from '@/hooks/use-create-invoice-table-data';

import { InvoiceTableHeadings, Invoices } from '@/lib/models/invoiceDataModels';
import { FormStateV2 } from '@/lib/models/formStateModels';

import InvoicesTable from '@/components/Tables/Invoices/InvoiceSortHeadingsTable';
import ProcessInvoiceSlideOverlay from '@/components/UI/SlideOverlay/ProcessInvoiceSlideOverlay';

interface Props {
  projectId: string;
  invoices: Invoices;
  isLoading: boolean;
  onGetSnapShotFormState: (data: FormStateV2) => void;
}

const tableHeadings: InvoiceTableHeadings = {
  vendor_name: 'Vendor',
  project: 'Project',
  invoice_id: 'Invoice Number',
  total_amount: 'Total Due ($)',
  total_tax_amount: 'Total Tax ($)',
  date_received: 'Date Received',
  status: 'Status',
};

const checkBoxButtons = [
  { label: 'Sync to Accounting Software', buttonPath: '#', disabled: false },
];

export default function ClientBillInvoices(props: Props) {
  const { projectId, invoices, onGetSnapShotFormState } = props;

  const invoiceRows = useCreateInvoiceRows({
    pageLoading: false,
    invoices,
    projectId,
  });

  const getSnapShotFormStateHandler = (data: FormStateV2) => {
    onGetSnapShotFormState(data);
  };

  return (
    <>
      <ProcessInvoiceSlideOverlay
        rows={invoiceRows}
        projectId={projectId}
        contractData={null}
        updateData={false}
        onGetSnapShotFormState={getSnapShotFormStateHandler}
      />
      <InvoicesTable
        isProjectPage={true}
        headings={tableHeadings}
        rows={invoiceRows}
        checkboxButtons={checkBoxButtons}
        projectId={projectId}
        preSortKey="vendor_name"
      />
    </>
  );
}
