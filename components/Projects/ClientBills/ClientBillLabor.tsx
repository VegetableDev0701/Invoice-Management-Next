import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { addLaborFormActions } from '@/store/add-labor-slice';
import overlaySlice, { overlayActions } from '@/store/overlay-control-slice';
import { projectDataActions } from '@/store/projects-data-slice';
import { addUpdatedChangeOrderContent } from '@/store/add-change-order';

import { usePageData } from '@/hooks/use-page-data';
import { useAddCurrentDataToFormData } from '@/hooks/use-add-current-page-data';

import {
  ChangeOrderSummary,
  LaborSummary,
} from '@/lib/models/summaryDataModel';
import { formatNumber } from '@/lib/utility/formatter';
import { FormStateV2, User } from '@/lib/models/formStateModels';
import { Labor, LaborData } from '@/lib/models/formDataModel';
import { checkAllFormFieldsLabor } from '@/lib/validation/formValidation';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { createSingleLaborSummary } from '@/lib/utility/createSummaryDataHelpers';
import { Invoices } from '@/lib/models/invoiceDataModels';
import { snapshotCopy } from '@/lib/utility/utils';
import { ChangeOrderContent } from '@/lib/models/changeOrderModel';
import { createChangeOrderContentFromLaborFees } from '@/lib/utility/changeOrderHelpers';
import { extractLineItems } from '@/lib/utility/invoiceHelpers';

import CheckboxSubTable from '@/components/Tables/SubTables/CheckboxSortHeadingsTableSub';
import SlideOverlayForm from '@/components/UI/SlideOverlay/SlideOverlayForm';

interface Props {
  projectId: string;
  tableData: LaborSummary | null;
  labor: Labor;
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

const tableHeadings = {
  name: 'Employee Name',
  workDescription: 'Work Description',
  costCode: 'Cost Code',
  hours: 'Hours',
  rate: 'Rate ($)',
  totalAmt: 'Total ($)',
};

export default function ClientBillLabor(props: Props) {
  const { projectId, tableData, labor, handleUpdateClientBill } = props;

  const [snapShotCurrentFormState, setSnapShotCurrentFormState] =
    useState<FormStateV2 | null>(null);
  const [dummyUpdate, setDummyUpdate] = useState<number>(0);
  const [missingInputs, setMissingInputs] = useState<boolean>(false);

  const dispatch = useDispatch();

  const { user } = useUser();

  const addLaborFormStateData = useSelector((state) => state.addLaborForm);
  const overlayContent = useSelector((state) => state.overlay.labor);
  const changeOrdersSummary = useSelector(
    (state) => state.projects[projectId]['change-orders-summary']
  );
  const { data: addLaborFormData } = usePageData('data', 'forms', 'add-labor');

  const numLineItems: number = +(addLaborFormStateData.numCostCodes.value as
    | string
    | number);
  // filter out the line items from the rest of the processed invoice state
  const lineItems = extractLineItems({
    formState: addLaborFormStateData,
    numLineItems,
  });

  useEffect(() => {
    setSnapShotCurrentFormState(snapshotCopy(addLaborFormStateData));
  }, [dummyUpdate]);

  // Normalize labor data for table
  const laborRows = useMemo(() => {
    if (tableData) {
      return Object.entries(tableData).flatMap(([key, row]) => {
        return Object.entries(row.line_items).map(([item_key, item]) => {
          return {
            name: row['name'],
            workDescription: item['work_description'],
            costCode: item['cost_code'],
            hours: item['number_of_hours'],
            rate: row['rate'],
            totalAmt: formatNumber(item['amount']),
            uuid: row['uuid'],
            rowId: key + '_' + item_key,
          };
        });
      });
    } else {
      return null;
    }
  }, [tableData]);

  const currentFormData = useAddCurrentDataToFormData({
    projectId,
    formData: addLaborFormData,
  });

  const rowClickHandler = (uuid: string) => {
    dispatch(addLaborFormActions.clearFormState());
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Update Labor',
          open: true,
          isSave: false,
          currentId: uuid,
        },
        stateKey: 'labor',
      })
    );
    dispatch(
      overlaySlice.actions.setCurrentOverlayData({
        data: {
          currentData: labor[uuid],
          currentId: uuid,
        },
        stateKey: 'labor',
      })
    );
  };

  // useSetNotification({
  //   response,
  //   successJSON,
  //   isOverlay: true,
  //   overlayStateKey: 'labor',
  // });

  const submitFormHandler = async (
    e: React.FormEvent,
    formStateData?: FormStateV2
  ) => {
    e.preventDefault();
    // Grab all of the cost codes then slice only the currently open inputs
    const numberOfWorkItems = Object.keys(formStateData as FormStateV2)
      .filter((key) => key.includes('work-description'))
      .map((key) => key.split('-')[0])
      .slice(0, addLaborFormStateData.numCostCodes.value as number);
    const allValid = checkAllFormFieldsLabor(
      addLaborFormData,
      addLaborFormStateData,
      numberOfWorkItems
    );

    if (!allValid) {
      setMissingInputs(true);
      return;
    }
    setMissingInputs(false);
    dispatch(
      overlayActions.setOverlayContent({
        data: { open: false },
        stateKey: 'labor',
      })
    );

    const laborUUID = overlayContent.currentId as string;

    // create the form data to push to the DB
    const dataToSubmit = createFormDataForSubmit({
      formData: addLaborFormData,
      formStateData: formStateData as FormStateV2,
      isAddProject: false,
      isAddVendor: false,
      isAddLabor: true,
    }) as LaborData;

    dataToSubmit.uuid = laborUUID;

    const laborFeeSummary = createSingleLaborSummary({
      labor: dataToSubmit as LaborData,
      laborId: laborUUID,
      formState: addLaborFormStateData,
      numLineItems: addLaborFormStateData.numCostCodes.value as number,
      changeOrdersSummary: changeOrdersSummary as ChangeOrderSummary,
    });

    // TODO
    // // check if any piece of the labor is a change order
    const laborFeesChangeOrders = Object.values(
      laborFeeSummary.line_items
    ).some((item) => item);
    let changeOrderContent: {
      [changeOrderId: string]: ChangeOrderContent;
    } = {};
    if (laborFeesChangeOrders) {
      changeOrderContent = createChangeOrderContentFromLaborFees({
        laborFeeSummary,
        changeOrdersSummary: changeOrdersSummary as ChangeOrderSummary,
      });
    }
    // add the currentState from the useeffect here for comparison if changing
    // between two change orders
    dispatch(
      projectDataActions.addChangeOrderContent({
        content: changeOrderContent,
        projectId,
        formState: addLaborFormStateData,
        snapShotFormState: snapShotCurrentFormState,
        lineItems,
        itemId: laborFeeSummary.uuid as string,
      })
    );
    setDummyUpdate((prevValue) => prevValue + 1);

    dispatch(
      addUpdatedChangeOrderContent({
        companyId: (user as User).user_metadata.companyId as string,
        projectId,
      })
    );

    const updatedLabor = snapshotCopy(labor) as Labor;
    updatedLabor[laborUUID] = dataToSubmit;

    const updatedLaborSummary = snapshotCopy(tableData) as LaborSummary;
    updatedLaborSummary[laborUUID] = laborFeeSummary;

    handleUpdateClientBill({
      updatedLabor,
      updatedLaborSummary,
    });
  };

  return (
    <>
      <SlideOverlayForm
        formData={currentFormData}
        formState={addLaborFormStateData}
        actions={addLaborFormActions}
        showError={missingInputs}
        overlayContent={overlayContent}
        form="addLabor"
        overlayStateKey="labor"
        projectId={projectId}
        onSubmit={(e) => submitFormHandler(e, addLaborFormStateData)}
      />
      <CheckboxSubTable
        headings={tableHeadings}
        rows={laborRows}
        projectId={projectId}
        selectedRowId={overlayContent.currentId}
        onRowClick={rowClickHandler}
        tableType="laborFee"
        preSortKey="costCode"
      />
    </>
  );
}
