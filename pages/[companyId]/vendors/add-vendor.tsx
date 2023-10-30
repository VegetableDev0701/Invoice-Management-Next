import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import { addVendorFormActions } from '@/store/add-vendor-slice';
import { companyDataActions } from '@/store/company-data-slice';

import { useSetStatePath } from '@/hooks/use-setpath';
import useHttp from '@/hooks/use-http';
import { usePageData } from '@/hooks/use-page-data';
import useLocationChange from '@/hooks/use-location-change';
import useSetNotification from '@/hooks/use-set-nofitication';

import { checkAllFormFields } from '@/lib/validation/formValidation';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { FormState, User } from '@/lib/models/formStateModels';
import { VendorData } from '@/lib/models/formDataModel';
import { createSingleVendorSummary } from '@/lib/utility/createSummaryDataHelpers';
import { Rows } from '@/lib/models/summaryDataModel';
import { nanoid } from '@/lib/config';

import FormComponent from '@/components/Forms/FormComponent';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import ModalConfirm from '@/components/UI/Modal/ModalConfirm';

const AddNewVendor = () => {
  useSetStatePath();
  useLocationChange(addVendorFormActions.resetFormValidation);

  const { data: addVendorFormData, isLoading: pageLoading } = usePageData(
    'data',
    'forms',
    'add-vendor'
  );
  const { isLoading, error, response, successJSON, sendRequest } = useHttp({
    isClearData: true,
  });
  const { user, isLoading: userLoading } = useUser();

  const addVendorFormStateData = useSelector((state) => state.addVendorForm);

  const [openModal, setOpenModal] = useState(false);
  const [missingInputs, setMissingInputs] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>(
    'Please confirm that you want to save this vendor to the database.'
  );

  const dispatch = useDispatch();

  useSetNotification({
    response,
    successJSON,
    isOverlay: false,
  });

  const openModalHandler = () => {
    const allValid = checkAllFormFields(
      addVendorFormData,
      addVendorFormStateData
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

    const vendorUUID = nanoid();

    // create the form data to push to the DB
    const dataToSubmit = createFormDataForSubmit({
      formData: addVendorFormData,
      formStateData: formStateData as FormState,
      isAddProject: false,
      isAddVendor: true,
      isAddLabor: false,
    }) as VendorData;

    dataToSubmit.uuid = vendorUUID;

    const summaryVendorData = createSingleVendorSummary(
      dataToSubmit as VendorData,
      vendorUUID
    );

    dispatch(
      companyDataActions.addToVendorsSummaryData({
        [vendorUUID]: summaryVendorData,
      })
    );

    dispatch(
      companyDataActions.addNewVendor({
        newVendor: dataToSubmit,
        vendorId: vendorUUID,
      })
    );

    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/vendors/add-vendor`,
        method: 'POST',
        body: JSON.stringify({
          fullData: dataToSubmit,
          summaryData: summaryVendorData,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      await sendRequest({
        requestConfig,
        actions: addVendorFormActions,
        pushPath: `/${(user as User).user_metadata.companyId}/vendors`,
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
              submitFormHandler(e, addVendorFormStateData)
            }
            isLoading={isLoading}
            message={modalMessage}
            error={error}
          />
          <FormComponent
            formData={addVendorFormData}
            formState={addVendorFormStateData}
            onOpenModal={openModalHandler}
            pageTitle="Add a New Vendor"
            showError={missingInputs}
            actions={addVendorFormActions}
            form="addVendor"
          />
        </>
      )}
    </>
  );
};

export default React.memo(AddNewVendor);
