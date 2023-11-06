import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import { addBudgetFormActions } from '@/store/add-budget-slice';
import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import { projectDataActions } from '@/store/projects-data-slice';

import { usePageData } from '@/hooks/use-page-data';
import useHttp from '@/hooks/use-http';
import useSetNotification from '@/hooks/use-set-nofitication';

import { createBudgetFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { CostCodesData } from '@/lib/models/budgetCostCodeModel';
import { formatNameForID } from '@/lib/utility/formatter';
import { FormState, User } from '@/lib/models/formStateModels';

import BudgetForm from '../Budget/ProjectBudget/BudgetForm';
import CostCodeSideLinks from '../Budget/CostCodes/CostCodeSideLinks';
import FullScreenLoader from '../UI/Loaders/FullScreenLoader';
import { addProjectFormActions } from '@/store/add-project-slice';
import useLocationChange from '@/hooks/use-location-change';

interface Props {
  updateBudget: boolean;
  projectId: string;
  onUpdateBudgetClick: () => void;
}

export default function ProjectBudget(props: Props) {
  const { updateBudget, projectId, onUpdateBudgetClick } = props;

  const { user, isLoading: userLoading } = useUser();

  const { response, successJSON, sendRequest } = useHttp({
    isClearData: false,
  });

  const [blankFormData, setBlankFormData] = useState<CostCodesData | null>(
    null
  );

  const dispatch = useDispatch();

  useLocationChange(addProjectFormActions.clearFormState);

  useSetNotification({
    response,
    successJSON,
    isOverlay: false,
  });

  const {
    data: currentProjectFormData,
  }: { data: CostCodesData; isLoading: boolean } = usePageData(
    'projects',
    projectId,
    'budget'
  );

  useEffect(() => {
    // if (currentProjectFormData) return;
    const getCostCodes = async () => {
      try {
        const response = await fetch(
          `/api/${(user as User).user_metadata.companyId}/get-cost-codes`,
          {
            method: 'GET',
          }
        );
        if (!response.ok) {
          throw new Error(
            `Something went wrong with fetching cost codes: ${response.status} - ${response.statusText}`
          );
        }
        const data = await response.json();
        setBlankFormData(JSON.parse(data));
      } catch (error) {
        console.error(error);
      }
    };
    getCostCodes();
  }, []);

  let formData: CostCodesData | null;
  if (currentProjectFormData) {
    formData = currentProjectFormData;
  } else if (blankFormData && !currentProjectFormData) {
    formData = blankFormData;
  } else {
    formData = null;
  }

  let anchorScrollElement: string = '';
  if (currentProjectFormData) {
    anchorScrollElement = formatNameForID(
      (currentProjectFormData as CostCodesData).divisions[0].name
    );
  } else if (blankFormData) {
    anchorScrollElement = formatNameForID(
      (blankFormData as CostCodesData).divisions[0].name
    );
  }

  const formState = useSelector((state) => state.addBudgetForm.budget);

  // HACK - This is just dummy state to force this componenet to rerender
  // at EVERY side link click. This fixed a bug where if the same
  // link was clicked twice it would not scroll in the FormCard component.
  const [state, setState] = useState(false);
  const [clickedLinkId, setClickedLinkId] = useState('');

  // every time the update budget button is clicked, run this side effect
  useEffect(() => {
    if (updateBudget) {
      updateSubmitHandler();
      onUpdateBudgetClick();
    }
    // dispatch(addProjectFormActions.resetFormValidation());
  }, [updateBudget]);

  const updateSubmitHandler = async () => {
    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}/update-budget`,
        method: 'PATCH',
        body: JSON.stringify(currentProjectFormData),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      await sendRequest({
        requestConfig,
        actions: addBudgetFormActions,
        pushPath: `/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}`,
      });
    }
    // if (blankFormData) {
    //   const dataToSubmit = createBudgetFormDataForSubmit({
    //     formData: blankFormData,
    //     formStateData: formState,
    //   });

    //   delete dataToSubmit['status'];
    //   dispatch(
    //     projectDataActions.addFullData({
    //       newData: dataToSubmit,
    //       projectId: projectId,
    //       stateKey: 'budget',
    //     })
    //   );
    //   if (!userLoading && user) {
    //     const requestConfig = {
    //       url: `/api/${
    //         (user as User).user_metadata.companyId
    //       }/projects/${projectId}/update-budget`,
    //       method: 'PATCH',
    //       body: JSON.stringify(dataToSubmit),
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //     };

    //     await sendRequest({
    //       requestConfig,
    //       actions: addBudgetFormActions,
    //       pushPath: `/${
    //         (user as User).user_metadata.companyId
    //       }/projects/${projectId}`,
    //     });
    //   }
    // }
  };

  const clickLinkHandler = (linkId: string) => {
    setState((prevState) => !prevState);
    setClickedLinkId(linkId);
  };

  return (
    <div className="flex gap-5 h-full max-w-full">
      {!formData && <FullScreenLoader />}
      {formData && (
        <CostCodeSideLinks
          divisions={formData.divisions}
          isBudgetForm={true}
          onclicklink={clickLinkHandler}
        />
      )}
      {!formData && <FullScreenLoader />}
      {formData && (
        <BudgetForm
          projectId={projectId}
          formData={formData}
          clickedLink={clickedLinkId}
          dummyForceRender={state}
          anchorScrollElement={anchorScrollElement}
          actions={addBudgetFormActions}
        />
      )}
    </div>
  );
}
