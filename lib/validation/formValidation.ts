import { Dispatch, SetStateAction } from 'react';

import { AppDispatch } from '@/store';
import {
  AddressItems,
  InputElement,
  Items,
  MainCategories,
  isInputElementWithAddressElements,
  isInputElementWithItems,
} from '@/lib/models/formDataModel';
import { formatNumber, formatPhoneNumber } from '@/lib/utility/formatter';
import { Actions, FormData } from '@/lib/models/types';
import { FormState } from '@/lib/models/formStateModels';

/**
 * Checks if any of the input states has an error by looking for a boolean property in the state objects that includes the string "isValid".
 * @param {Object[]} states - An array of objects representing the state of each input in a form.
 * @returns {boolean} - True if any of the input states has an error, false otherwise.
 */
// export const checkFormHasError = (states: object[]): boolean => {
//   const errorArray = [];
//   for (let obj of states) {
//     for (let key in obj) {
//       if (key.includes('isValid')) {
//         errorArray.push(obj[key]);
//       }
//     }
//   }
//   return errorArray.some((isValid) => isValid === false);
// };

/**
 * Checks if the input name is valid by verifying that it is not an empty string.
 * @param {string} name - The name to validate.
 * @returns {boolean} - True if the name is not an empty string, false otherwise.
 */
export const isNameValid = (name: string): boolean => {
  return name ? name !== '' && name !== 'None' : false;
};

/**
 * Checks if the input email is a valid email address by verifying that it matches a regular expression pattern for email validation.
 * @param {string} email - The email address to validate.
 * @returns {boolean} - True if the email is a valid email address, false otherwise.
 */
export const isEmailValid = (email: string): boolean => {
  const validRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return email !== ''
    ? email.toLowerCase().match(validRegex)
      ? true
      : false
    : false;
};

/**
 * Checks if the input URL is a valid URL address by verifying that it matches a regular expression pattern for URL validation.
 * @param {string} url - The URL address to validate.
 * @returns {boolean} - True if the URL is a valid URL address, false otherwise.
 */
export const isURLValid = (url: string): boolean => {
  const validURLRegex =
    /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/;
  // because url is optional if the user doesn't put anything down
  // that should be okay and will not throw an error.
  if (url === '') {
    return true;
  } else {
    return url.match(validURLRegex) ? true : false;
  }
};

/**
 * Validates a phone number by checking if it contains only numbers and has 10 digits.
 * @param {string} phoneNumber - The phone number to validate.
 * @returns {boolean} - True if the phone number is valid, false otherwise.
 */
export const isPhoneNumberValid = (phoneNumber: string): boolean => {
  const phoneNumberDigits = phoneNumber.replace(/\D/g, '');
  const validPhoneNumberRegex = /^\d{10}$/;
  return validPhoneNumberRegex.test(phoneNumberDigits);
};

export const getValidFunc = (
  inputId: string,
  required: boolean
): ((text: string) => boolean) => {
  if (required) {
    if (inputId === 'email') {
      return isEmailValid;
    }
    if (inputId === 'phone') {
      return isPhoneNumberValid;
    }
    return isNameValid;
  }
  return () => {
    return true;
  };
};

export const getRequiredInputIds = (formData: FormData) => {
  const reqLabels = [] as string[];
  if (formData) {
    formData.mainCategories.map((category: MainCategories) => {
      category.inputElements.map((el: InputElement) => {
        if (isInputElementWithAddressElements(el)) {
          el.addressElements.forEach((addEl: AddressItems) => {
            addEl.items.forEach((addItem: Items) => {
              if (addItem.required) {
                reqLabels.push(addItem.id);
              }
            });
          });
        } else if (isInputElementWithItems(el)) {
          el.items.map((item: Items) => {
            if (item.required) {
              reqLabels.push(item.id);
            }
          });
        }
      });
    });
  }
  return reqLabels;
};

export const checkAllFormFields = (
  formData: FormData,
  formState: FormState
) => {
  return getRequiredInputIds(formData).every((key) => {
    return (
      Object.prototype.hasOwnProperty.call(formState, key) &&
      formState[key].isValid
    );
  });
};

export const checkAllFormFieldsLabor = (
  formData: FormData,
  formState: FormState,
  numItems: string[]
) => {
  const reqInputs = getRequiredInputIds(formData);
  numItems.forEach((itemNumber) => {
    reqInputs.push(
      ...[
        `${itemNumber}-work-description`,
        `${itemNumber}-number-of-hours`,
        `${itemNumber}-cost-code`,
      ]
    );
  });
  return reqInputs.every((key) => {
    return (
      Object.prototype.hasOwnProperty.call(formState, key) &&
      formState[key].isValid
    );
  });
};

export const checkInputField = (
  value: string,
  input: Items,
  actions: Actions,
  setInputValue: Dispatch<SetStateAction<any>>,
  getValidFunc: (id: string, required: boolean) => (text: string) => boolean,
  dispatch: AppDispatch
) => {
  if (input.isCurrency) {
    value = formatNumber(value);
    if (!isNaN(Number(value.replace(/,/g, '')))) {
      setInputValue(value);
      dispatch(
        actions.setFormElement({
          inputValue: value,
          inputKey: input.id,
          isValid: getValidFunc(
            input.validFunc || input.id,
            input.required
          )(value),
        })
      );
    }
  } else if (input.isPhoneNumber) {
    value = formatPhoneNumber(value);
    setInputValue(value);
    dispatch(
      actions.setFormElement({
        inputValue: value,
        inputKey: input.id,
        isValid: getValidFunc(
          input.validFunc || input.id,
          input.required
        )(value),
      })
    );
  } else {
    setInputValue(value);
    dispatch(
      actions.setFormElement({
        inputValue: value,
        inputKey: input.id,
        isValid: getValidFunc(
          input.validFunc || input.id,
          input.required
        )(value),
      })
    );
  }
};
