import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { overlayActions } from '@/store/overlay-control-slice';
import { projectDataActions } from '@/store/projects-data-slice';
import { addChangeOrderFormActions } from '@/store/add-change-order';

import { usePageData } from '@/hooks/use-page-data';
import useHttp from '@/hooks/use-http';
import useSetNotification from '@/hooks/use-set-nofitication';
import { useAddCurrentDataToFormData } from '@/hooks/use-add-current-page-data';

import { FormState, User } from '@/lib/models/formStateModels';
import { createSingleChangeOrderSummary } from '@/lib/utility/createSummaryDataHelpers';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { checkAllFormFields } from '@/lib/validation/formValidation';
import { ChangeOrderData, LaborData } from '@/lib/models/formDataModel';
import { ChangeOrderSummary } from '@/lib/models/summaryDataModel';
import { nanoid } from '@/lib/config';

import FullScreenLoader from '../UI/Loaders/FullScreenLoader';
import SlideOverlayForm from '../UI/SlideOverlay/SlideOverlayForm';
import ChangeOrderTables from '../Tables/ChangeOrderDoubleTable';

interface Props {
  projectId: string;
  tableData: ChangeOrderSummary | null;
}

export default function ProjectsChangeOrders(props: Props) {
  const { projectId, tableData } = props;

  const { data: addChangeOrderFormData, isLoading: isLoading } = usePageData(
    'data',
    'forms',
    'change-order'
  );

  const currentFormData = useAddCurrentDataToFormData({
    projectId,
    formData: addChangeOrderFormData,
    includeAddress: true,
  });

  const {
    response,
    successJSON,
    isLoading: responsedLoading,
    sendRequest,
  } = useHttp({
    isClearData: false,
  });
  const [missingInputs, setMissingInputs] = useState<boolean>(false);

  const { user, isLoading: userLoading } = useUser();

  const dispatch = useDispatch();

  const addChangeOrderFormStateData = useSelector(
    (state) => state.addChangeOrderForm
  );
  const overlayContent = useSelector((state) => state.overlay['change-orders']);
  const changeOrderSummaryState = useSelector(
    (state) => state.projects[projectId]['change-orders-summary']
  );

  useSetNotification({
    response,
    successJSON,
    isOverlay: true,
    overlayStateKey: 'change-orders',
  });

  const submitFormHandler = async (
    e: React.FormEvent,
    formStateData?: FormState
  ) => {
    e.preventDefault();

    const allValid = checkAllFormFields(
      addChangeOrderFormData,
      addChangeOrderFormStateData
    );

    if (!allValid) {
      return;
    }
    if (overlayContent.isNameDuped) {
      return;
    }
    setMissingInputs(false);
    dispatch(
      overlayActions.setOverlayContent({
        data: { open: false },
        stateKey: 'change-orders',
      })
    );

    const changeOrderUUID = overlayContent?.currentId
      ? overlayContent.currentId
      : nanoid();

    // create the form data to push to the DB
    const dataToSubmit = createFormDataForSubmit({
      formData: addChangeOrderFormData,
      formStateData: formStateData as FormState,
      isAddProject: false,
      isAddVendor: false,
      isAddLabor: false,
    }) as ChangeOrderData;

    dataToSubmit.uuid = changeOrderUUID;

    (changeOrderSummaryState as ChangeOrderSummary)[changeOrderUUID];

    const changeOrderSummary = createSingleChangeOrderSummary({
      changeOrder: dataToSubmit as LaborData,
      changeOrderId: changeOrderUUID,
      content: (changeOrderSummaryState as ChangeOrderSummary)[changeOrderUUID]
        ?.content,
    });

    dispatch(
      projectDataActions.addFullData({
        newData: dataToSubmit,
        projectId: projectId,
        stateKey: 'change-orders',
      })
    );
    dispatch(
      projectDataActions.addSummaryTableRow({
        newData: changeOrderSummary,
        projectId: projectId,
        stateKey: 'change-orders-summary',
      })
    );

    if (!userLoading && user) {
      let headers = {};
      if (overlayContent.isSave) {
        headers = { 'Content-Type': 'application/json' };
      } else {
        headers = {
          changeOrderId: overlayContent.currentId,
          'Content-Type': 'application/json',
        };
      }

      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}/add-change-order`,
        method: `${overlayContent.isSave ? 'POST' : 'PATCH'}`,
        body: JSON.stringify({
          fullData: dataToSubmit,
          summaryData: changeOrderSummary,
        }),
        headers: headers,
      };

      await sendRequest({
        requestConfig,
        actions: addChangeOrderFormActions,
        pushPath: `/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}`,
      });

      // If the user updates the form then reopens it immediatly this makes sure
      // that they do not see stale data.
      if (response && response.ok) {
        dispatch(
          overlayActions.setCurrentOverlayData({
            data: {
              currentData: dataToSubmit,
              currentId: changeOrderUUID,
            },
            stateKey: 'change-orders',
          })
        );
      }
    }
  };

  return (
    <>
      {isLoading && <FullScreenLoader />}
      {!isLoading && (
        <SlideOverlayForm
          formData={currentFormData}
          formState={addChangeOrderFormData}
          actions={addChangeOrderFormActions}
          showError={missingInputs}
          overlayContent={overlayContent}
          form="addChangeOrder"
          overlayStateKey="change-orders"
          projectId={projectId}
          responseLoading={responsedLoading}
          onSubmit={(e) => submitFormHandler(e, addChangeOrderFormStateData)}
        />
      )}
      <ChangeOrderTables
        tableData={tableData}
        projectId={projectId}
        overlayContent={overlayContent}
      />
    </>
  );
}
