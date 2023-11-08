import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { addProjectFormActions } from '@/store/add-project-slice';

import useHttp from '@/hooks/use-http';
import useSetNotification from '@/hooks/use-set-nofitication';

import { companyDataActions } from '@/store/company-data-slice';
import { projectDataActions } from '@/store/projects-data-slice';

import { MainCategories, ProjectFormData } from '@/lib/models/formDataModel';
import { formatNameForID } from '@/lib/utility/formatter';
import { FormState, User } from '@/lib/models/formStateModels';
import { checkAllFormFields } from '@/lib/validation/formValidation';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { createSingleProjectSummary } from '@/lib/utility/createSummaryDataHelpers';

import Form from '../Forms/InputFormLayout/Form';
import SideLinksCard from '../UI/FormLayout/SideLinksCard';

interface Props {
  projectId: string;
  updateProject: boolean;
  onUpdateProjectClick: () => void;
}

export default function ProjectDetails(props: Props) {
  const { projectId, updateProject, onUpdateProjectClick } = props;
  const [state, setState] = useState(false);
  const [clickedLinkId, setClickedLinkId] = useState('');
  const [missingInputs, setMissingInputs] = useState<boolean>(false);

  const dispatch = useDispatch();
  const { user, isLoading: userLoading } = useUser();

  const formState = useSelector((state) => state.addProjectForm);

  const formData = useSelector(
    (state) => state.projects[projectId]['project-details']
  );
  let sideLinks: string[] = [];
  let anchorScrollElement = '';
  if (formData) {
    sideLinks = formData.mainCategories.map(
      (category: MainCategories) => category.name
    );
    anchorScrollElement = formatNameForID(formData.mainCategories[0].name);
  }
  const { response, successJSON, sendRequest } = useHttp({
    isClearData: false,
  });

  useSetNotification({
    response,
    successJSON,
    isOverlay: false,
  });

  useEffect(() => {
    if (updateProject) {
      updateSubmitHandler(formState);
      onUpdateProjectClick();
    }
  }, [updateProject]);

  const updateSubmitHandler = async (formState: FormState) => {
    const allValid = formData && checkAllFormFields(formData, formState);

    if (!allValid) {
      setMissingInputs(true);
      return;
    }
    setMissingInputs(false);

    const dataToSubmit = createFormDataForSubmit({
      formData,
      formStateData: formState as FormState,
      isAddProject: true,
      isAddVendor: false,
      isAddLabor: false,
    }) as ProjectFormData;

    // Since we are just updating the project, use the projectId of this page
    dataToSubmit.uuid = projectId;

    const summaryProjectData = createSingleProjectSummary(
      dataToSubmit,
      projectId
    );

    dispatch(
      companyDataActions.addToProjectsSummaryData({
        [projectId]: summaryProjectData,
      })
    );

    dispatch(
      projectDataActions.addNewProject({
        data: dataToSubmit,
        projectId: projectId,
      })
    );

    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}/update-project`,
        method: 'PATCH',
        body: JSON.stringify({
          fullData: dataToSubmit,
          summaryData: summaryProjectData,
        }),
        headers: {
          projectid: projectId,
          'Content-Type': 'application/json',
        },
      };

      await sendRequest({
        requestConfig,
        actions: addProjectFormActions,
        pushPath: `/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}`,
      });
    }
  };

  const clickLinkHandler = (linkId: string) => {
    setState((prevState) => !prevState);
    setClickedLinkId(linkId);
  };

  return (
    <div className="flex gap-5 h-full max-w-full">
      <SideLinksCard sideLinks={sideLinks} onclicklink={clickLinkHandler} />
      <Form
        formData={formData as ProjectFormData}
        formState={formState}
        clickedLink={clickedLinkId}
        dummyForceRender={state}
        showError={missingInputs}
        anchorScrollElement={anchorScrollElement}
        actions={addProjectFormActions}
        form={'addProject'}
        extraClasses="flex-1"
      />
    </div>
  );
}
