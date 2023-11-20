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
import { updateInvoiceProjectObject } from '@/store/invoice-slice';
import { updateProjectDataInChangeOrdersThunk } from '@/store/add-change-order';

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

  // Use this data to see if we need to call the thunk to update
  // invoices currently associated with this project
  const projectSummary = useSelector(
    (state) => state.data.projectsSummary.allProjects[projectId]
  );
  const currentProjectName = projectSummary.projectName;
  const currentProjectAddress = projectSummary.address;
  const currentProjectCity = projectSummary.city;
  const currentProjectState = projectSummary.state;
  const currentProjectZip = projectSummary.zipCode;
  const currentProjectOwnerName = projectSummary.ownerName;

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

    // if the project name or street address has changed we need to update
    // that in the invoices `project` object
    if (
      summaryProjectData.projectName !== currentProjectName ||
      summaryProjectData.address !== currentProjectAddress
    ) {
      dispatch(
        updateInvoiceProjectObject({
          projectId,
          companyId: (user as User).user_metadata.companyId,
          newProjectName: summaryProjectData.projectName,
          newProjectAddress: summaryProjectData.address,
        })
      );
    }
    // if project name, street address, city, state, zip, or client first or last name changes
    // we need to update that in the change order
    if (
      summaryProjectData.projectName !== currentProjectName ||
      summaryProjectData.address !== currentProjectAddress ||
      summaryProjectData.city !== currentProjectCity ||
      summaryProjectData.state !== currentProjectState ||
      summaryProjectData.zipCode !== currentProjectZip ||
      summaryProjectData.ownerName !== currentProjectOwnerName
    ) {
      dispatch(
        updateProjectDataInChangeOrdersThunk({
          projectId,
          companyId: (user as User).user_metadata.companyId,
          newProjectName: summaryProjectData.projectName,
          newProjectAddress: summaryProjectData.address,
          newProjectCity: summaryProjectData.city,
          newProjectState: summaryProjectData.state,
          newProjectZip: summaryProjectData.zipCode,
          newProjectOwnerName: summaryProjectData.ownerName,
        })
      );
    }

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
