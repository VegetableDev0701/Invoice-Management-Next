import { useAppSelector as useSelector } from '@/store/hooks';
import { FormData } from '@/lib/models/types';
import {
  InputElement,
  InputElementWithAddressItems,
  InputElementWithItems,
  Items,
} from '@/lib/models/formDataModel';
import { FormStateV2 } from '@/lib/models/formStateModels';

import DollarSign from '@/public/icons/DollarSign';
import Calendar from '@/public/icons/Calendar';

/**
 *
 * Checks if a label is related to currency.
 * @param {string} label - The label to check.
 * @returns {boolean} - True if the label is related to currency, false otherwise.
 */
export function checkIfCurrency(label: string): boolean {
  return (
    label.toLowerCase().includes('contract value') ||
    label.includes('insurance rate')
  );
}

/**
 * Checks if a label is related to a phone number.
 * @param {string} label - The label to check.
 * @returns {boolean} - True if the label is related to a phone number, false otherwise.
 */
export function checkIfPhoneNumber(label: string): boolean {
  return label.toLowerCase().includes('phone');
}

/**
 * Returns an icon component based on the item provided.
 * @param {Object} item - The form item.
 * @returns {Object} - An icon component based on the item provided. If the item does not have an associated icon, null is returned.
 */
export function getFormIcon(item: Items): JSX.Element | undefined {
  if (item.isCurrency) {
    return <DollarSign width={24} height={20} />;
  }
  if (item.type === 'date') {
    return <Calendar width={24} height={24} />;
  }
  return;
}

export function createRecurringFormObject(formData: FormData) {
  const recurrFormIdx = formData.mainCategories.findIndex(
    (el) =>
      el.name === 'Recurring Fees' ||
      el.name === 'Labor Cost Codes' ||
      el.name === 'Line Items'
  );
  const recurrFormObj = {} as { [key: string]: string };
  formData.mainCategories[recurrFormIdx].inputElements.forEach(
    (el: InputElement) => {
      (el as InputElementWithItems).items.forEach((item: Items) => {
        recurrFormObj[item.id] = item.value as string;
      });
    }
  );

  return recurrFormObj;
}

// Grabs the state for a particular form element's id
export function useGetInputState(id: string, form: string) {
  const formData = useSelector((state) =>
    form === 'addBudget'
      ? state[`${form}Form`].budget[id]
      : (state as any)[`${form}Form`][id]
  );
  return formData;
}

/**
 * When the user navigates away from a form before submitting it resets
 * any validation classes if the input field is empty.
 * @param formState
 * @returns formState
 */
export function resetAllFormValidation(formState: FormStateV2) {
  for (const key in formState) {
    if (formState[key].value === '') {
      formState[key].isTouched = false;
    }
    if (formState[key]?.isAdded) {
      formState[key].isAdded = false;
      formState[key].isShowing = false;
    }
  }
  if (formState?.numCostCodes) {
    // formState.numCostcodes = { value: 1 };
  }
  return formState;
}

/**
 * When the form data needs to be updated this utility function will update the
 * section of that object that needs to be updated.
 */
export const updateItemElement = ({
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
