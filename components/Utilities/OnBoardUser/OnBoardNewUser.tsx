import { useEffect, useState } from 'react';

import { useAppDispatch as useDispatch } from '@/store/hooks';

import { fetchWithRetry } from '@/lib/utility/ioUtils';
import { isObjectEmpty, snapshotCopy } from '@/lib/utility/utils';
import { uiActions } from '@/store/ui-slice';
import ModalErrorWrapper from '@/components/UI/Modal/ErrorModalWrapper';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import { User } from '@/lib/models/formStateModels';
import OnBoardForm from './OnBoardForm';
import { useCurrentUser as useUser } from '@/hooks/use-user';
import { FormData } from '@/lib/models/types';
import {
  AddressItems,
  InputElement,
  InputElementWithAddressItems,
  InputElementWithItems,
  Items,
  MainCategories,
  isInputElementWithAddressElements,
  isInputElementWithItems,
} from '@/lib/models/formDataModel';
import { onboardUserActions } from '@/store/onboard-user-slice';

interface UserData {
  company_id: string;
  user_email: string;
  user_id: string;
  user_name: string;
  company_name: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_zip: string | null;
}

export interface NewUserData {
  new_company: boolean;
  user_data: UserData;
  onboard_form_data: FormData;
}

export default function OnBoardNewUserParent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const hasUserMetadata =
    (user as User).user_metadata && !isObjectEmpty((user as User).user_metadata)
      ? true
      : false;
  return (
    <>
      {isLoading && <FullScreenLoader />}
      {!isLoading && (
        <OnBoardNewUser user={user} hasUserMetadata={hasUserMetadata}>
          {children}
        </OnBoardNewUser>
      )}
    </>
  );
}

const OnBoardNewUser = ({
  children,
  user,
  hasUserMetadata,
}: {
  children: React.ReactNode;
  user: User;
  hasUserMetadata: boolean;
}) => {
  const [newUserData, setNewUserData] = useState<NewUserData>();
  const [verifiedEmail, setVerifiedEmail] = useState<boolean>(false);
  const [reqLoading, setReqLoading] = useState<boolean>(true);

  // This makes sure the onboard form elements are cleared. This covers the edge
  // case if two users are sigining into the same computer where the new user form state
  // could be saved in the redux memory and displayed on user's two onbaord form.

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(onboardUserActions.clearFormState());
  }, []);

  const finishOnboardingHandler = () => {
    window.location.href = '/api/auth/logout';
  };

  const checkUserDomain = async () => {
    try {
      const checkDomainResponse = await fetch(
        `/api/check-user-domain?user_email=${user.email}`,
        {
          method: 'GET',
        }
      );
      const data: { message: boolean } = await checkDomainResponse.json();
      return Boolean(data.message);
    } catch (error: any) {
      console.error(error);
    }
  };

  const onBoardNewUser = async () => {
    try {
      setReqLoading(true);
      const responseObject: NewUserData = await fetchWithRetry(
        '/api/onboard-new-user',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: (user as User).email,
          }),
        }
      );
      setNewUserData(responseObject);
      setReqLoading(false);
    } catch (error: any) {
      console.error(error);
    }
  };

  const runOnboardProcess = async () => {
    if (user) {
      // check 1: check that the domain exists for one of the organizations we hav whitelisted
      const userDomainCheck = await checkUserDomain();
      if (userDomainCheck) {
        // check 2: if the user's email is not verified log them out
        if (!(user as User).email_verified) {
          dispatch(
            uiActions.setModalContent({
              openModal: true,
              message: 'Please verify your email before continuing to Stak.',
              title: 'Error',
              logout: true,
            })
          );
          setVerifiedEmail(false);
        } else if ((user as User).email_verified && !hasUserMetadata) {
          setVerifiedEmail(true);
          onBoardNewUser();
        }
      } else {
        dispatch(
          uiActions.setModalContent({
            openModal: true,
            message:
              'You are not associated with any organization. Please contact support@stak.cc.',
            title: 'Unauthorized',
            logout: true,
          })
        );
      }
    }
  };

  useEffect(() => {
    runOnboardProcess();
  }, []);

  const updateItemElement = ({
    updatedFormData,
    value,
    i,
    j,
    k,
    jAdd,
    kAdd,
    isAddress,
  }: {
    updatedFormData: FormData;
    value: string | null;
    i: number;
    j: number;
    k?: number;
    jAdd?: number;
    kAdd?: number;
    isAddress: boolean;
  }) => {
    if (isAddress) {
      (
        updatedFormData.mainCategories[i].inputElements[
          j
        ] as InputElementWithAddressItems
      ).addressElements[jAdd as number].items[kAdd as number] = {
        ...(
          updatedFormData.mainCategories[i].inputElements[
            j
          ] as InputElementWithAddressItems
        ).addressElements[jAdd as number].items[kAdd as number],
        value,
        disabled: value ? true : false,
        required: false,
      };
    } else {
      (
        updatedFormData.mainCategories[i].inputElements[
          j
        ] as InputElementWithItems
      ).items[k as number] = {
        ...(
          updatedFormData.mainCategories[i].inputElements[
            j
          ] as InputElementWithItems
        ).items[k as number],
        value,
        disabled: value ? true : false,
        required: false,
      };
    }
  };

  // If this is the second or more user to a company this code will pre fill that data
  // and disable that input field. This
  const modifyFormData = (formData: FormData) => {
    const updatedFormData: FormData = snapshotCopy(formData);
    if (newUserData) {
      formData.mainCategories.forEach((category: MainCategories, i: number) => {
        category.inputElements.forEach((el: InputElement, j: number) => {
          if (isInputElementWithAddressElements(el)) {
            el.addressElements.forEach((addEl: AddressItems, jAdd: number) => {
              addEl.items.forEach((addItem: Items, kAdd: number) => {
                if (addItem.id === 'business-address-as') {
                  updateItemElement({
                    updatedFormData,
                    value: newUserData.user_data.business_address,
                    i,
                    j,
                    jAdd,
                    kAdd,
                    isAddress: true,
                  });
                }
                if (addItem.id === 'city-business-as') {
                  updateItemElement({
                    updatedFormData,
                    value: newUserData.user_data.business_city,
                    i,
                    j,
                    jAdd,
                    kAdd,
                    isAddress: true,
                  });
                }
                if (addItem.id === 'state-business-as') {
                  updateItemElement({
                    updatedFormData,
                    value: newUserData.user_data.business_state,
                    i,
                    j,
                    jAdd,
                    kAdd,
                    isAddress: true,
                  });
                }
                if (addItem.id === 'zip-code-business-as') {
                  updateItemElement({
                    updatedFormData,
                    value: newUserData.user_data.business_zip,
                    i,
                    j,
                    jAdd,
                    kAdd,
                    isAddress: true,
                  });
                }
              });
            });
          }
          if (isInputElementWithItems(el)) {
            el.items.forEach((item, k) => {
              if (!newUserData.new_company && item.id === 'company-name-as') {
                updateItemElement({
                  updatedFormData,
                  value: newUserData.user_data.company_name,
                  i,
                  j,
                  k,
                  isAddress: false,
                });
              }
              if (item.id === 'email-address-as') {
                updateItemElement({
                  updatedFormData,
                  value: newUserData.user_data.user_email,
                  i,
                  j,
                  k,
                  isAddress: false,
                });
              }
            });
          }
        });
      });
    }
    return updatedFormData;
  };

  const modifiedFormData = newUserData?.onboard_form_data
    ? modifyFormData(newUserData.onboard_form_data)
    : undefined;

  const showOnboardForm =
    verifiedEmail && !hasUserMetadata && newUserData && modifiedFormData;

  return (
    <>
      <ModalErrorWrapper />
      {reqLoading && <FullScreenLoader />}
      {showOnboardForm && (
        <OnBoardForm
          user={user as User}
          formData={modifiedFormData}
          userData={newUserData}
          onboardHandler={() => {
            finishOnboardingHandler();
          }}
        />
      )}
      {hasUserMetadata && children}
    </>
  );
};
