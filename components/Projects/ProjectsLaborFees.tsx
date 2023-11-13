import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { addLaborFormActions } from '@/store/add-labor-slice';
import {
  getCurrentProjectData,
  overlayActions,
} from '@/store/overlay-control-slice';
import {
  deleteProjectData,
  projectDataActions,
  removeLaborFromChangeOrderThunk,
} from '@/store/projects-data-slice';
import { addUpdatedChangeOrderContent } from '@/store/add-change-order';

import { usePageData } from '@/hooks/use-page-data';
import useHttp from '@/hooks/use-http';
import useSetNotification from '@/hooks/use-set-nofitication';
import { useAddCurrentDataToFormData } from '@/hooks/use-add-current-page-data';

import { FormState, User } from '@/lib/models/formStateModels';
import { createSingleLaborSummary } from '@/lib/utility/createSummaryDataHelpers';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { checkAllFormFieldsLabor } from '@/lib/validation/formValidation';
import { LaborData } from '@/lib/models/formDataModel';
import {
  ChangeOrderSummary,
  LaborSummary,
  Rows,
} from '@/lib/models/summaryDataModel';
import { formatNumber } from '@/lib/utility/formatter';
import { nanoid } from '@/lib/config';
import { createChangeOrderContentFromLaborFees } from '@/lib/utility/changeOrderHelpers';
import { extractLineItems } from '@/lib/utility/invoiceHelpers';
import { snapshotCopy } from '@/lib/utility/utils';
import { ChangeOrderContent } from '@/lib/models/changeOrderModel';

import FullScreenLoader from '../UI/Loaders/FullScreenLoader';
import SlideOverlayForm from '../UI/SlideOverlay/SlideOverlayForm';
import CheckboxSubTable from '../Tables/SubTables/CheckboxSortHeadingsTableSub';

interface Props {
  projectId: string;
  tableData: LaborSummary | null;
}

const tableHeadings = {
  name: 'Employee Name',
  workDescription: 'Work Description',
  costCode: 'Cost Code',
  hours: 'Hours / Qty.',
  rate: 'Rate ($)',
  totalAmt: 'Total ($)',
};

const checkBoxButtons = [{ label: 'Delete', buttonPath: '#', disabled: false }];

export default function ProjectsLaborFees(props: Props) {
  const { projectId, tableData } = props;

  const { data: addLaborFormData, isLoading: isLoading } = usePageData(
    'data',
    'forms',
    'add-labor'
  );

  const currentFormData = useAddCurrentDataToFormData({
    projectId,
    formData: addLaborFormData,
  });

  const { response, successJSON, sendRequest } = useHttp({
    isClearData: false,
  });
  const [missingInputs, setMissingInputs] = useState<boolean>(false);
  const [dummyUpdate, setDummyUpdate] = useState<number>(0);
  const [snapShotCurrentFormState, setSnapShotCurrentFormState] =
    useState<FormState | null>(null);

  const { user, isLoading: userLoading } = useUser();

  const dispatch = useDispatch();

  const addLaborFormStateData = useSelector((state) => state.addLaborForm);
  const overlayContent = useSelector((state) => state.overlay.labor);
  const changeOrdersSummary = useSelector(
    (state) => state.projects[projectId]['change-orders-summary']
  );

  useEffect(() => {
    setSnapShotCurrentFormState(snapshotCopy(addLaborFormStateData));
  }, [dummyUpdate]);

  const numLineItems: number = +(addLaborFormStateData.numCostCodes.value as
    | string
    | number);
  // filter out the line items from the rest of the processed invoice state
  const lineItems = extractLineItems({
    formState: addLaborFormStateData,
    numLineItems,
  });

  // Normalize labor data for table
  const laborRows: Rows[] | null = useMemo(() => {
    if (tableData) {
      return Object.entries(tableData).map(([key, row]) => {
        const lineItems = Object.values(row.line_items);
        const workDescription = lineItems
          .map((item) => item.work_description)
          .join(' / ');
        const costCode = lineItems.map((item) => item.cost_code).join(' / ');
        const hours = lineItems.map((item) => item.number_of_hours).join(' / ');
        return {
          name: row['name'],
          workDescription,
          costCode,
          hours,
          rate: row['rate'],
          totalAmt: formatNumber(row['totalAmt'] as string),
          uuid: row['uuid'],
          rowId: key,
        };
      });
    } else {
      return null;
    }
  }, [tableData]);

  const confirmModalHandler = (selected: Rows[]) => {
    const laborIds = selected.map((labor) => labor.uuid as string);

    // TODO
    // build a function to create the data necessary to dispatch the changes to the
    // front end and backend
    dispatch(
      removeLaborFromChangeOrderThunk({
        projectId,
        laborIds,
        companyId: (user as User).user_metadata.companyId,
      })
    );

    dispatch(
      projectDataActions.removeSelectedRow({
        projectId: projectId,
        ids: laborIds,
        stateKeyFull: 'labor',
        stateKeySummary: 'labor-summary',
      })
    );

    dispatch(
      deleteProjectData({
        companyId: (user as User).user_metadata.companyId as string,
        sendData: laborIds,
        projectId: projectId,
        dataType: 'labor',
      })
    );
  };

  const rowClickHandler = (uuid: string, projectId: string) => {
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
      getCurrentProjectData({
        id: uuid,
        projectId: projectId,
        stateKey: 'labor',
      })
    );
  };

  useSetNotification({
    response,
    successJSON,
    isOverlay: true,
    overlayStateKey: 'labor',
  });

  const submitFormHandler = async (
    e: React.FormEvent,
    formStateData?: FormState
  ) => {
    e.preventDefault();
    // Grab all of the cost codes then slice only the currently open inputs
    const numberOfWorkItems = Object.keys(formStateData as FormState)
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

    const laborUUID = overlayContent?.currentId ?? nanoid();

    // create the form data to push to the DB
    const dataToSubmit = createFormDataForSubmit({
      formData: addLaborFormData,
      formStateData: formStateData as FormState,
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

    // check if any piece of the labor is a change order
    const laborFeesChangeOrders = Object.values(
      laborFeeSummary.line_items
    ).some((item) => item.change_order);
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

    dispatch(
      projectDataActions.addFullData({
        newData: dataToSubmit,
        projectId: projectId,
        stateKey: 'labor',
      })
    );
    dispatch(
      projectDataActions.addSummaryTableRow({
        newData: laborFeeSummary,
        projectId: projectId,
        stateKey: 'labor-summary',
      })
    );

    if (!userLoading && user) {
      let headers = {};
      if (overlayContent.isSave) {
        headers = { 'Content-Type': 'application/json' };
      } else {
        headers = {
          laborId: overlayContent.currentId,
          'Content-Type': 'application/json',
        };
      }

      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}/add-labor`,
        method: `${overlayContent.isSave ? 'POST' : 'PATCH'}`,
        body: JSON.stringify({
          fullData: dataToSubmit,
          summaryData: laborFeeSummary,
        }),
        headers: headers,
      };

      await sendRequest({
        requestConfig,
        actions: addLaborFormActions,
        pushPath: `/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}`,
      });
    }
  };

  return (
    <>
      {isLoading && <FullScreenLoader />}
      {!isLoading && (
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
      )}
      <CheckboxSubTable
        headings={tableHeadings}
        rows={laborRows}
        checkboxButtons={checkBoxButtons}
        projectId={projectId}
        selectedRowId={overlayContent.currentId}
        onConfirmModal={confirmModalHandler}
        onRowClick={rowClickHandler}
      />
    </>
  );
}
