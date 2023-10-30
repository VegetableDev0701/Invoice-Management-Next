import React, { useState } from 'react';

import { useAppSelector as useSelector } from '@/store/hooks';
import { useAppDispatch as useDispatch } from '@/store/hooks';
import { accountSettingsFormActions } from '@/store/account-settings-slice';
import { userActions } from '@/store/user-slice';

import { useSetStatePath } from '@/hooks/use-setpath';
import useHttp from '@/hooks/use-http';
import { usePageData } from '@/hooks/use-page-data';
import { useCurrentUser as useUser } from '@/hooks/use-user';
import useLocationChange from '@/hooks/use-location-change';

import { checkAllFormFields } from '@/lib/validation/formValidation';
import {
  createAuth0UserData,
  createFormDataForSubmit,
} from '@/lib/utility/submitFormHelpers';
import { FormState, User, UserMetadata } from '@/lib/models/formStateModels';

import FormComponent from '@/components/Forms/FormComponent';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import ModalConfirm from '@/components/UI/Modal/ModalConfirm';

const AccountSettings = () => {
  useSetStatePath();
  useLocationChange(accountSettingsFormActions.resetFormValidation);
  const dispatch = useDispatch();
  const { data: accountSettingsFormData, isLoading: pageLoading } = usePageData(
    'data',
    'forms',
    'account-settings'
  );

  const { user, isLoading: userLoading, isLoadingUserData } = useUser();

  const filledInForm = createFormDataForSubmit({
    formData: accountSettingsFormData,
    formStateData: (user as User).user_metadata.accountSettings,
    isAddProject: false,
    isAddVendor: false,
    isAddLabor: false,
  });

  const [openModal, setOpenModal] = useState(false);
  const [missingInputs, setMissingInputs] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>(
    'Please confirm that you want to update your account settings.'
  );

  const accountSettingsFormStateData = useSelector(
    (state) => state.accountSettingsForm
  );

  const { isLoading, error, response, successJSON, sendRequest } = useHttp({
    isClearData: true,
  });

  const openModalHandler = () => {
    const allValid = checkAllFormFields(
      accountSettingsFormData,
      accountSettingsFormStateData
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

  const submitFormHandler = async (
    e: React.FormEvent,
    formStateData?: FormState
  ) => {
    e.preventDefault();
    // create the form data to push to the DB
    const userData = createAuth0UserData(formStateData as FormState);
    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${(user as User).user_metadata.companyId}/${
          (user as User).user_metadata.userUUID
        }/update-user-metadata`,
        method: 'PATCH',
        body: userData,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      dispatch(
        userActions.setUserState({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            accountSettings: { ...userData.user_metadata.accountSettings },
          } as UserMetadata,
        })
      );

      sendRequest({
        requestConfig,
        actions: accountSettingsFormActions,
        pushPath: '/',
      });
    }
  };

  return (
    <>
      {(userLoading || pageLoading || isLoadingUserData) && (
        <FullScreenLoader />
      )}
      {!userLoading && !pageLoading && !isLoadingUserData && user && (
        <>
          <ModalConfirm
            onCloseModal={closeModalHandler}
            openModal={openModal}
            onConfirm={(e: React.FormEvent) =>
              submitFormHandler(e, accountSettingsFormStateData)
            }
            isLoading={isLoading}
            error={error}
            message={modalMessage}
          />
          <FormComponent
            formData={filledInForm}
            formState={accountSettingsFormStateData}
            onOpenModal={openModalHandler}
            pageTitle="Account Settings"
            subTitle={`${(user as User).user_metadata.name}, ${
              (user as User).user_metadata.companyName
            }`}
            showError={missingInputs}
            actions={accountSettingsFormActions}
            form="accountSettings"
          />
        </>
      )}
    </>
  );
};

export default React.memo(AccountSettings);

// HACK This fixed a bug where I was getting a 'cant read from null' error when
// grabbing the state base form data. I would get the error on the console, but the
// page would still load. adding this fixed it for some god knows reason.
export function getServerSideProps() {
  return {
    props: {},
  };
}
