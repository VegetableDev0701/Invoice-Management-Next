import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import { addProjectFormActions } from '@/store/add-project-slice';
import { companyDataActions } from '@/store/company-data-slice';

import { useSetStatePath } from '@/hooks/use-setpath';
import useHttp from '@/hooks/use-http';
import { usePageData } from '@/hooks/use-page-data';
import useLocationChange from '@/hooks/use-location-change';

import { checkAllFormFields } from '@/lib/validation/formValidation';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { FormStateV2, User } from '@/lib/models/formStateModels';
import { ProjectFormData } from '@/lib/models/formDataModel';
import { createSingleProjectSummary } from '@/lib/utility/createSummaryDataHelpers';

import FormComponent from '@/components/Forms/FormComponent';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import ModalConfirm from '@/components/UI/Modal/ModalConfirm';
import { nanoid } from '@/lib/config';
import { projectDataActions } from '@/store/projects-data-slice';
import useSetNotification from '@/hooks/use-set-nofitication';

const AddNewProject = () => {
  useSetStatePath();

  const { data: addProjectFormData, isLoading: pageLoading } = usePageData(
    'data',
    'forms',
    'add-project'
  );

  const { isLoading, error, response, successJSON, sendRequest } = useHttp({
    isClearData: true,
  });
  const { user, isLoading: userLoading } = useUser();

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [missingInputs, setMissingInputs] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>(
    'Please confirm that you want to save this project to the database.'
  );

  const dispatch = useDispatch();

  // dispatch(addProjectFormActions.clearFormState());

  const addProjectFormStateData = useSelector((state) => state.addProjectForm);

  const openModalHandler = () => {
    const allValid = checkAllFormFields(
      addProjectFormData,
      addProjectFormStateData
    );

    if (!allValid) {
      setMissingInputs(true);
      return;
    }
    setMissingInputs(false);
    setOpenModal(true);
  };

  const closeModalHandler = () => {
    setOpenModal(false);
  };

  useSetNotification({
    response,
    successJSON,
    isOverlay: false,
  });

  const submitFormHandler = async (
    e: React.FormEvent,
    formStateData?: FormStateV2
  ) => {
    e.preventDefault();

    const projectUUID = nanoid();

    // create the form data to push to the DB
    const dataToSubmit = createFormDataForSubmit({
      formData: addProjectFormData,
      formStateData: formStateData as FormStateV2,
      isAddProject: true,
      isAddVendor: false,
      isAddLabor: false,
    }) as ProjectFormData;

    dataToSubmit.uuid = projectUUID;

    const summaryProjectData = createSingleProjectSummary(
      dataToSubmit,
      projectUUID
    );

    dispatch(
      companyDataActions.addToProjectsSummaryData({
        [projectUUID]: summaryProjectData,
      })
    );

    dispatch(
      projectDataActions.addNewProject({
        data: dataToSubmit,
        projectId: projectUUID,
      })
    );

    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/projects/add-project`,
        method: 'POST',
        body: JSON.stringify({
          fullData: dataToSubmit,
          summaryData: summaryProjectData,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      await sendRequest({
        requestConfig,
        actions: addProjectFormActions,
        pushPath: `/${(user as User).user_metadata.companyId}/projects`,
      });
    }
  };

  return (
    <>
      {(userLoading || pageLoading) && <FullScreenLoader />}
      {!userLoading && !pageLoading && (
        <>
          <ModalConfirm
            onCloseModal={closeModalHandler}
            openModal={openModal}
            onConfirm={(e: React.FormEvent) =>
              submitFormHandler(e, addProjectFormStateData)
            }
            isLoading={isLoading}
            message={modalMessage}
            error={error}
          />
          <FormComponent
            formData={addProjectFormData}
            formState={addProjectFormStateData}
            onOpenModal={openModalHandler}
            pageTitle="Add a New Project"
            subTitle={''}
            showError={missingInputs}
            actions={addProjectFormActions}
            form="addProject"
          />
        </>
      )}
    </>
  );
};

export default React.memo(AddNewProject);

// HACK This fixed a bug where I was getting a 'cant read from null' error when
// grabbing the state base form data. I would get the error on the console, but the
// page would still load. adding this fixed it for some god knows reason.
export function getServerSideProps() {
  return { props: {} };
}
