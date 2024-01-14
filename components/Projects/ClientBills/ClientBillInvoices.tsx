import useCreateInvoiceRows from '@/hooks/use-create-invoice-table-data';
import { usePageData } from '@/hooks/use-page-data';
import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import {
  InvoiceItem,
  InvoiceTableHeadings,
  Invoices,
} from '@/lib/models/invoiceDataModels';
import { FormStateV2, User } from '@/lib/models/formStateModels';
import { singleClientBillInvoiceFormActions} from '@/store/single-client-bill-invoice-slice';
import { overlayActions } from '@/store/overlay-control-slice';
import InvoicesTable from '@/components/Tables/Invoices/InvoiceSortHeadingsTable';
import ProcessInvoiceSlideOverlay from '@/components/UI/SlideOverlay/ProcessInvoiceSlideOverlay';
import SlideOverlayForm from '@/components/UI/SlideOverlay/SlideOverlayForm';
import SectionHeading from '@/components/UI/SectionHeadings/SectionHeading';
import useUploadFilesHandler from '@/hooks/use-upload-files';
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
  const { data: ProjectInvoiceFormData } = usePageData(
    'data',
    'forms',
    'single-client-bill-invoice'
  );
  const { user } = useUser();

  const invoiceRows = useCreateInvoiceRows({
    pageLoading: false,
    invoices,
    projectId,
  });
  const singleClientBillInvoiceForm = useSelector(
    (state) => state.singleClientBillInvoiceForm
  );
  const overlayContent = useSelector(
    (state) => {
      return state.overlay['client-bill-single-invoice']}
  );
  const [missingInputs] = useState<boolean>(false);
  const [snapShotFormState, setSnapShotFormState] =
    useState<FormStateV2 | null>(null);

  const getSnapShotFormState = (data: FormStateV2) => {
    setSnapShotFormState(data);
  };

  const { handleFileChange } = useUploadFilesHandler({
    uploadFileType: 'invoice',
  });

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
          snapShotFormState: formState || (snapShotFormState as FormStateV2),
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

  const onSingleInvoice = () => {
    dispatch(singleClientBillInvoiceFormActions.clearFormState());
    dispatch(singleClientBillInvoiceFormActions.resetFormValidation());
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Single Invoice',
          open: true,
          isSave: true,
        },
        stateKey: 'client-bill-single-invoice',
      })
    );
    dispatch(
      overlayActions.setCurrentOverlayData({
        data: {
          currentData: null,
          currentId: null,
        },
        stateKey: 'client-bill-single-invoice',
      })
    );
  };

  const onSubmitSingleClientInvoice = async (e: React.FormEvent, formStateData: FormStateV2) => {
    console.log('Clicked');
  }

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
      <SlideOverlayForm
        formData={ProjectInvoiceFormData}
        formState={singleClientBillInvoiceForm}
        actions={singleClientBillInvoiceFormActions}
        showError={missingInputs}
        overlayContent={overlayContent}
        form="singleInvoice"
        overlayStateKey="client-bill-single-invoice"
        onSubmit={(e) =>
          onSubmitSingleClientInvoice(e, ProjectInvoiceFormData)
        }
      />
      <SectionHeading
        tabs={[{ name: 'Invoice Table', keyName: 'all', current: true }]}
        buttons={[
          {
            label: 'Single Invoice',
            disabled: false,
            onClick: onSingleInvoice,
          },
          {
            label: 'Add Invoices',
            disabled: false,
            inputClick: handleFileChange,
          },
        ]}
        // onActiveTab={() => {}}
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
