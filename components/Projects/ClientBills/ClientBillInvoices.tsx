import { InvoiceTableHeadings, Invoices } from '@/lib/models/invoiceDataModels';

import InvoicesTable from '@/components/Tables/Invoices/InvoiceSortHeadingsTable';
import ClientBillInvoiceSlideOverlayImage from '@/components/UI/SlideOverlay/ClientBillInvoiceSlideOverlayImage';
import useCreateInvoiceRows from '@/hooks/use-create-invoice-table-data';

interface Props {
  projectId: string;
  invoices: Invoices;
  isLoading: boolean;
}

const tableHeadings: InvoiceTableHeadings = {
  vendor_name: 'Vendor',
  project: 'Project',
  invoice_id: 'Invoice Number',
  total_amount: 'Total Due ($)',
  total_tax_amount: 'Total Tax ($)',
  date_received: 'Date Received',
};

const checkBoxButtons = [
  { label: 'Sync to Accounting Software', buttonPath: '#', disabled: false },
];

export default function ClientBillInvoices(props: Props) {
  const { projectId, invoices } = props;

  const invoiceRows = useCreateInvoiceRows({
    pageLoading: false,
    invoices,
    projectId,
  });

  return (
    <>
      {invoiceRows && <ClientBillInvoiceSlideOverlayImage rows={invoiceRows} />}
      <InvoicesTable
        isProjectPage={true}
        headings={tableHeadings}
        rows={invoiceRows}
        checkboxButtons={checkBoxButtons}
        projectId={projectId}
      />
    </>
  );
}
