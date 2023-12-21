import useCreateInvoiceRows from '@/hooks/use-create-invoice-table-data';

import { useAppDispatch as useDispatch } from '@/store/hooks';
import {
  InvoiceItem,
  InvoiceTableHeadings,
  Invoices,
} from '@/lib/models/invoiceDataModels';
import { FormStateV2, User } from '@/lib/models/formStateModels';

import InvoicesTable from '@/components/Tables/Invoices/InvoiceSortHeadingsTable';
import ProcessInvoiceSlideOverlay from '@/components/UI/SlideOverlay/ProcessInvoiceSlideOverlay';
import { Labor } from '@/lib/models/formDataModel';
import { LaborSummary } from '@/lib/models/summaryDataModel';
import { snapshotCopy } from '@/lib/utility/utils';
import { useState } from 'react';
import { updateInvoiceData } from '@/store/invoice-slice';
import { useUser } from '@auth0/nextjs-auth0/client';

interface Props {
  projectId: string;
  invoices: Invoices;
  isLoading: boolean;
  handleUpdateClientBill: ({
    updatedInvoices,
    updatedLabor,
    updatedLaborSummary,
  }: {
    updatedInvoices?: Invoices;
    updatedLabor?: Labor;
    updatedLaborSummary?: LaborSummary;
  }) => void;
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
  const { projectId, invoices, handleUpdateClientBill } = props;
  const dispatch = useDispatch();

  const { user } = useUser();

  const invoiceRows = useCreateInvoiceRows({
    pageLoading: false,
    invoices,
    projectId,
  });

  const [snapShotFormState, setSnapShotFormState] =
    useState<FormStateV2 | null>(null);

  const getSnapShotFormState = (data: FormStateV2) => {
    setSnapShotFormState(data);
  };

  const handleUpdateData = ({
    formState,
    doc_id,
  }: {
    formState: FormStateV2;
    doc_id: string;
  }) => {
    if (invoices && invoices[doc_id]) {
      const snapShotInvoice = snapshotCopy(invoices[doc_id]) as InvoiceItem;

      dispatch(
        updateInvoiceData({
          invoiceId: doc_id,
          companyId: (user as User).user_metadata.companyId,
          projectName: formState['project-name'].value as string,
          snapShotInvoice,
          snapShotFormState: snapShotFormState as FormStateV2,
        })
      ).then((result) => {
        if (result.payload) {
          const updatedInvoices = {
            ...invoices,
          };

          updatedInvoices[doc_id] = result.payload as InvoiceItem;

          handleUpdateClientBill({
            updatedInvoices,
          });
        }
      });
    }
  };

  return (
    <>
      <ProcessInvoiceSlideOverlay
        rows={invoiceRows}
        projectId={projectId}
        contractData={null}
        updateData={false}
        onGetSnapShotFormState={getSnapShotFormState}
        onUpdateData={handleUpdateData}
        isClientBill={true}
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
