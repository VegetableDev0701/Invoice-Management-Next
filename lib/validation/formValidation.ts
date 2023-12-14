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
import {
  formatNumber,
  formatPhoneNumber,
  formatTaxNumber,
} from '@/lib/utility/formatter';
import { Actions, FormData } from '@/lib/models/types';
import { FormState, FormStateV2 } from '@/lib/models/formStateModels';

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
export const isNameValid = (name: string, required?: boolean): boolean => {
  if (required) {
    return name ? name !== '' && name !== 'None' : false;
  } else {
    if (!name || name === '') {
      return true;
    } else {
      return name ? name !== '' && name !== 'None' : false;
    }
  }
};

/**
 * Checks if the input email is a valid email address by verifying that it matches a regular expression pattern for email validation.
 * @param {string} email - The email address to validate.
 * @returns {boolean} - True if the email is a valid email address, false otherwise.
 */
export const isEmailValid = (email: string, required?: boolean): boolean => {
  const validRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (required) {
    return email !== ''
      ? email.toLowerCase().match(validRegex)
        ? true
        : false
      : false;
  } else {
    if (!email || email === '') {
      return true;
    } else {
      return email !== ''
        ? email.toLowerCase().match(validRegex)
          ? true
          : false
        : false;
    }
  }
};

/**
 * Checks if the input URL is a valid URL address by verifying that it matches a regular expression pattern for URL validation.
 * @param {string} url - The URL address to validate.
 * @returns {boolean} - True if the URL is a valid URL address, false otherwise.
 */
export const isURLValid = (url: string, required?: boolean): boolean => {
  const validURLRegex =
    /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/;
  // because url is optional if the user doesn't put anything down
  // that should be okay and will not throw an error.
  if (required) {
    return url.match(validURLRegex) ? true : false;
  } else {
    if (!url || url === '') {
      return true;
    } else {
      return url.match(validURLRegex) ? true : false;
    }
  }
};

/**
 * Validates a phone number by checking if it contains only numbers and has 10 digits.
 * @param {string} phoneNumber - The phone number to validate.
 * @returns {boolean} - True if the phone number is valid, false otherwise.
 */
export const isPhoneNumberValid = (
  phoneNumber: string,
  required?: boolean
): boolean => {
  const phoneNumberDigits = phoneNumber.replace(/\D/g, '');
  const validPhoneNumberRegex = /^\d{10}$/;
  if (required) {
    return validPhoneNumberRegex.test(phoneNumberDigits);
  } else {
    if (!phoneNumber || phoneNumber === '') {
      return true;
    } else {
      return validPhoneNumberRegex.test(phoneNumberDigits);
    }
  }
};

/**
 * Checks if the tax number input is valid for federal EIN standards.
 */
export const isValidTaxNumber = (
  taxNumber: string,
  required?: boolean
): boolean => {
  const validRegex = /^\d{2}-\d{7}$/;
  if (required) {
    return taxNumber.match(validRegex) ? true : false;
  } else {
    if (!taxNumber || taxNumber === '') {
      return true;
    } else {
      return taxNumber.match(validRegex) ? true : false;
    }
  }
};

export const getValidFunc = (
  inputId: string
): ((text: string, required?: boolean) => boolean) => {
  if (inputId === 'email') {
    return isEmailValid;
  }
  if (inputId === 'phone') {
    return isPhoneNumberValid;
  }
  if (inputId === 'tax-number') {
    return isValidTaxNumber;
  }
  return isNameValid;
};

export const getRequiredInputIds = (formData: FormData) => {
  const reqLabels = [] as { id: string; required?: boolean }[];
  if (formData) {
    formData.mainCategories.map((category: MainCategories) => {
      category.inputElements.map((el: InputElement) => {
        if (isInputElementWithAddressElements(el)) {
          el.addressElements.forEach((addEl: AddressItems) => {
            addEl.items.forEach((addItem: Items) => {
              reqLabels.push({ id: addItem.id, required: addItem.required });
            });
          });
        } else if (isInputElementWithItems(el)) {
          el.items.map((item: Items) => {
            reqLabels.push({ id: item.id, required: item.required });
          });
        }
      });
    });
  }
  return reqLabels;
};

export const checkAllFormFields = (
  formData: FormData,
  formState: FormStateV2
) => {
  return getRequiredInputIds(formData).every(({ id, required }) => {
    if (required) {
      return (
        Object.prototype.hasOwnProperty.call(formState, id) &&
        formState[id].isValid
      );
    } else {
      if (!formState[id]?.value || formState[id].value === '') {
        return true;
      } else {
        return (
          Object.prototype.hasOwnProperty.call(formState, id) &&
          formState[id].isValid
        );
      }
    }
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
        { id: `${itemNumber}-work-description`, required: true },
        { id: `${itemNumber}-number-of-hours`, required: true },
        { id: `${itemNumber}-cost-code`, required: true },
      ]
    );
  });
  return reqInputs.every(({ id, required }) => {
    if (required) {
      return (
        Object.prototype.hasOwnProperty.call(formState, id) &&
        formState[id].isValid
      );
    } else {
      if (!formState[id]?.value || formState[id].value === '') {
        return true;
      } else {
        return (
          Object.prototype.hasOwnProperty.call(formState, id) &&
          formState[id].isValid
        );
      }
    }
  });
};

export const checkInputField = (
  input: Items,
  actions: Actions,
  setInputValue: Dispatch<SetStateAction<any>>,
  getValidFunc: (id: string) => (text: string, required?: boolean) => boolean,
  dispatch: AppDispatch,
  value?: string
) => {
  if (input.isCurrency && value) {
    value = formatNumber(value);
    if (!isNaN(Number(value.replace(/,/g, '')))) {
      setInputValue(value);
      dispatch(
        actions.setFormElement({
          inputValue: value,
          inputKey: input.id,
          isValid: getValidFunc(input.validFunc || input.id)(
            value,
            input.required
          ),
        })
      );
    }
  } else if (input.isPhoneNumber && value) {
    value = formatPhoneNumber(value) as string;
    setInputValue(value);
    dispatch(
      actions.setFormElement({
        inputValue: value,
        inputKey: input.id,
        isValid: getValidFunc(input.validFunc || input.id)(
          value,
          input?.required
        ),
      })
    );
  } else if (input.isTaxNumber && value) {
    value = formatTaxNumber(value) as string;
    setInputValue(value);
    dispatch(
      actions.setFormElement({
        inputValue: value,
        inputKey: input.id,
        isValid: getValidFunc(input.validFunc || input.id)(
          value,
          input?.required
        ),
      })
    );
  } else {
    setInputValue(value);
    dispatch(
      actions.setFormElement({
        inputValue: value,
        inputKey: input.id,
        isValid: getValidFunc(input.validFunc || input.id)(
          value as string,
          input?.required
        ),
      })
    );
  }
};
