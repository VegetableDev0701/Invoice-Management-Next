import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector as useSelector } from '@/store/hooks';
import { onboardUserActions } from '@/store/onboard-user-slice';
import { userActions } from '@/store/user-slice';

import useHttp from '@/hooks/use-http';

import {
  InputElementWithAddressItems,
  isInputElementWithAddressElements,
} from '@/lib/models/formDataModel';
import { FormState, User } from '@/lib/models/formStateModels';
import { FormData } from '@/lib/models/types';
import { getFormIcon } from '@/lib/utility/formHelpers';
import { formatNameForID } from '@/lib/utility/formatter';
import { createAuth0UserData } from '@/lib/utility/submitFormHelpers';
import { checkAllFormFields } from '@/lib/validation/formValidation';

import { Input } from '@/components/Inputs/Input';
import InputAddressAutocomplete from '@/components/Inputs/InputAddressAutocomplete';
import Button from '@/components/UI/Buttons/Button';
import Card from '@/components/UI/Card';
import ModalConfirm from '@/components/UI/Modal/ModalConfirm';
import { NewUserData } from './OnBoardNewUser';

interface Props {
  user: User;
  userData: NewUserData;
  formData: FormData;
  onboardHandler: () => void;
}

export default function OnBoardForm({
  user,
  userData,
  formData,
  onboardHandler,
}: Props) {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [missingInputs, setMissingInputs] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>(
    'Confirm the information you entered is correct, and welcome to Stak! You must log out and then back out for these changes to take effect.'
  );

  const dispatch = useAppDispatch();

  const accountSettingsFormStateData = useSelector(
    (state) => state.addNewUserForm
  );

  const { isLoading, error, response, successJSON, sendRequest } = useHttp({
    isClearData: true,
  });
  useEffect(() => {
    if (response && response.status === 200) {
      onboardHandler();
    }
  }, [response && response.status]);

  const openModalHandler = () => {
    const allValid = checkAllFormFields(formData, accountSettingsFormStateData);
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
    userData: NewUserData,
    formStateData: FormState
  ) => {
    e.preventDefault();
    // create the form data to push to the DB
    const newUserData = createAuth0UserData(formStateData, userData);

    const requestConfig = {
      url: '/api/update-user-metadata',
      method: 'POST',
      body: { userData: newUserData, newCompany: userData.new_company },
      headers: {
        'Content-Type': 'application/json',
      },
    };

    dispatch(
      userActions.setUserState({
        ...user,
        ...newUserData,
      })
    );

    sendRequest({
      requestConfig,
      actions: onboardUserActions,
      pushPath: '/',
    });
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <ModalConfirm
        onCloseModal={closeModalHandler}
        openModal={openModal}
        onConfirm={(e: React.FormEvent) =>
          submitFormHandler(e, userData, accountSettingsFormStateData)
        }
        isLoading={isLoading}
        error={error}
        message={modalMessage}
        buttonText="Save and Logout"
        logout={true}
      />
      <Card className="flex flex-col items-center justify-center w-[50%] h-[90%] py-5 bg-stak-white">
        <div
          className="flex flex-1 h-full self-stretch overflow-y-scroll mb-4"
          id="scroll-frame"
        >
          <form id="form-id" className="flex flex-1 flex-col gap-4 ">
            {formData.mainCategories.map((category, i) => {
              if (category.name === 'Recurring Fees') {
                return;
              }
              return (
                <div
                  key={formatNameForID(category.name)}
                  className="flex flex-col self-stretch px-5 py-0"
                  id={formatNameForID(category.name)}
                >
                  <span className="font-sans text-2xl font-semibold">
                    {category.name}
                  </span>
                  {category.inputElements.map((el, j) => {
                    if (isInputElementWithAddressElements(el)) {
                      return (
                        <InputAddressAutocomplete
                          key={j}
                          classes="flex-1 px-10 py-2"
                          actions={onboardUserActions}
                          input={
                            (el as InputElementWithAddressItems).addressElements
                          }
                          formState={accountSettingsFormStateData}
                          showError={missingInputs}
                        />
                      );
                    }
                    return (
                      <div
                        key={`${i}_${j}`}
                        className={`flex flex-row self-stretch gap-4 px-10 py-2`}
                      >
                        {el.items.map((item, p) => {
                          return (
                            <Input
                              classes="flex-1"
                              key={`${formatNameForID(item.label)}_${p}`}
                              input={{
                                ...item,
                              }}
                              icon={getFormIcon(item)}
                              showError={missingInputs}
                              actions={onboardUserActions}
                              form="addNewUser"
                              autofocus={
                                i === 0 && j === 0 && p === 0 ? true : false
                              }
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </form>
        </div>
        <Button
          buttonText="Welcome to Stak!"
          className="py-2 px-8 mb-2 text-2xl"
          onClick={openModalHandler}
        />
      </Card>
    </div>
  );
}
