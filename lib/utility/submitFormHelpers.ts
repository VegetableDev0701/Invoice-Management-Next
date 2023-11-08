import {
  AddressItems,
  InputElementWithAddressItems,
  InputElementWithItems,
  InputElement,
  Items,
  MainCategories,
  ProjectFormData,
  isInputElementWithAddressElements,
  isInputElementWithItems,
  LaborData,
} from '@/lib/models/formDataModel';
import { FormStateV2, User } from '@/lib/models/formStateModels';
import { FormData } from '@/lib/models/types';
import { formatNameForID } from '@/lib/utility/formatter';

import { CostCodesData } from '../models/budgetCostCodeModel';
import { NewUserData } from '@/components/Utilities/OnBoardUser/OnBoardNewUser';

export function createAuth0UserData(
  formStateData: FormStateV2,
  newUserData?: NewUserData
) {
  const userData: User = {
    user_metadata: {
      companyName: '',
      companyId: '',
      userUUID: '',
      accountSettings: {},
    },
  };
  Object.keys(formStateData)
    .filter((key) => key.endsWith('as'))
    .forEach((key) => {
      userData.user_metadata.accountSettings[key] = {
        value: (formStateData[key].value as string) ?? '',
      };
    });

  const name = `${formStateData['first-name-as'].value} ${formStateData['last-name-as'].value}`;
  if (newUserData && newUserData.user_data) {
    userData.name = name;
    userData.user_metadata.companyName =
      newUserData.user_data?.company_name ??
      (formStateData['company-name-as'].value as string);
    userData.user_metadata.companyId = newUserData.user_data.company_id;
    userData.user_metadata.userUUID = newUserData.user_data.user_id;
  }

  return userData;
}

/**
 * Retrieves the first address value from the given FormData.
 *
 * This function iterates over the mainCategories and inputElements of the FormData,
 * and when it finds the first InputElement with an address, it returns the value of the
 * first address item. If no address is found, it returns undefined.
 *
 * @param {FormData} formData - The FormData object containing mainCategories and inputElements.
 * @returns {string | undefined} The value of the first address item found, or undefined if not found.
 */
export function getAddressFormData(formData: FormData): string {
  let address: string = '';
  formData.mainCategories.forEach((category: MainCategories, i: number) => {
    category.inputElements.forEach((el: InputElement, j: number) => {
      if (isInputElementWithAddressElements(el)) {
        if (
          (
            formData.mainCategories[i].inputElements[
              j
            ] as InputElementWithAddressItems
          ).addressElements[0].items[0].id === 'project-address'
        ) {
          address = (
            formData.mainCategories[i].inputElements[
              j
            ] as InputElementWithAddressItems
          ).addressElements[0].items[0].value as string;
          return address;
        }
      }
    });
  });

  return address;
}

/**
 * Takes the add project form state and transforms it into the form
 * to push to the database
 * @param {FormData} formData - Base form object
 * @param {FormStateV2} formStateData - Object with updated values for a new project
 * @param {boolean} isAddProject - If the form is for adding a project
 * @param {boolean} isAddVendor - If the form is for adding a vendor
 * @returns
 */
export function createFormDataForSubmit({
  formData,
  formStateData,
  isAddProject = false,
  isAddVendor = false,
  isAddLabor = false,
}: {
  formData: FormData;
  formStateData: FormStateV2;
  isAddProject: boolean;
  isAddVendor: boolean;
  isAddLabor: boolean;
}): FormData {
  const newFormData: FormData = JSON.parse(JSON.stringify(formData || {}));
  newFormData.mainCategories?.forEach((category: MainCategories, i: number) => {
    category.inputElements.forEach((el: InputElement, j: number) => {
      if (isInputElementWithAddressElements(el)) {
        el.addressElements.forEach((addEl: AddressItems, jAdd: number) => {
          addEl.items.forEach((addItem: Items, kAdd: number) => {
            for (const key in formStateData) {
              if (key === addItem.id) {
                (
                  newFormData.mainCategories[i].inputElements[
                    j
                  ] as InputElementWithAddressItems
                ).addressElements[jAdd].items[kAdd].value = formStateData[key]
                  .value as string;
              }
            }
          });
        });
      } else if (isInputElementWithItems(el)) {
        el.items.forEach((item, k) => {
          for (const key in formStateData) {
            if (key === item.id) {
              if (item?.isCurrency) {
                (
                  newFormData.mainCategories[i].inputElements[
                    j
                  ] as InputElementWithItems
                ).items[k].value = (
                  formStateData[key].value as string
                )?.replace(/[^0-9.]/g, '');
              } else if (item?.isPhoneNumber) {
                (
                  newFormData.mainCategories[i].inputElements[
                    j
                  ] as InputElementWithItems
                ).items[k].value = (
                  formStateData[key].value as string
                )?.replace(/\D/g, '');
              } else {
                (
                  newFormData.mainCategories[i].inputElements[
                    j
                  ] as InputElementWithItems
                ).items[k].value = formStateData[key]?.value as string;
              }
            }
          }
        });
      }
    });
  });

  if (isAddProject || isAddVendor) {
    newFormData['name'] = formatNameForID(
      (newFormData.mainCategories[0].inputElements[0] as InputElementWithItems)
        .items[0].value as string
    );
  }

  if (isAddProject) {
    (newFormData as ProjectFormData).isActive = true;
    (newFormData as ProjectFormData).numRecurringFees = formStateData[
      'numRecurringFees'
    ]['value'] as number;

    const inputElements = [];
    for (
      let i = 1;
      i <= (formStateData['numRecurringFees'].value as number);
      i++
    ) {
      inputElements.push(
        {
          items: [
            {
              label: 'Description',
              id: `${i}-recurring-fee-description`,
              type: 'text',
              value: formStateData[`${i}-recurring-fee-description`].value,
              required: false,
            },
            {
              label: 'Cost Code',
              id: `${i}-recurring-fee-cost-code`,
              type: 'text',
              value: formStateData[`${i}-recurring-fee-cost-code`].value,
              required: false,
            },
          ],
        },
        {
          items: [
            {
              label: 'Amount ($)',
              id: `${i}-recurring-fee-amount`,
              type: 'text',
              value: formStateData[`${i}-recurring-fee-amount`].value,
              isCurrency: true,
              required: false,
            },
            {
              label: 'Recurring',
              id: `${i}-recurring-fee-cycle`,
              inputType: 'dropdown',
              value: formStateData[`${i}-recurring-fee-cycle`].value,
              required: false,
              selectMenuOptions: [
                { id: 1, label: 'Each billing cycle' },
                { id: 2, label: 'Weekly' },
                { id: 3, label: 'Bi-weekly' },
                { id: 4, label: 'Monthly' },
              ],
            },
          ],
        }
      );
    }
    const recurrFeeIdx = newFormData.mainCategories.findIndex(
      (el: MainCategories) => el.name === 'Recurring Fees'
    );
    newFormData['mainCategories'][recurrFeeIdx] = {
      inputElements: inputElements,
      name: 'Recurring Fees',
    };
  }

  if (isAddLabor) {
    (newFormData as LaborData).numCostCodes = formStateData.numCostCodes
      .value as number;
    const inputElements: InputElement[] = [];
    for (let i = 1; i <= (formStateData.numCostCodes.value as number); i++) {
      inputElements.push(
        {
          items: [
            {
              label: 'Cost Code',
              id: `${i}-cost-code`,
              type: 'text',
              inputType: 'dropdownWithSearch',
              required: true,
              errormessage: 'Cost Code is required.',
              value: formStateData[`${i}-cost-code`].value,
              isCurrency: false,
              isOnOverlay: true,
            },
            {
              label: 'Description',
              id: `${i}-work-description`,
              type: 'text',
              required: false,
              errormessage: 'Work description is required.',
              value: formStateData[`${i}-work-description`].value,
              isCurrency: false,
              isOnOverlay: true,
            },
          ],
        },
        {
          items: [
            {
              label: 'Number of Hours',
              id: `${i}-number-of-hours`,
              type: 'text',
              inputmode: 'numeric',
              required: true,
              errormessage: 'Number of hours worked is required.',
              value: formStateData[`${i}-number-of-hours`].value,
              isCurrency: false,
              isOnOverlay: true,
            },
            {
              label: 'Change Order',
              id: `${i}-change-order`,
              type: 'text',
              inputType: 'dropdownWithSearch',
              required: false,
              errormessage: 'Change order is required.',
              value: formStateData[`${i}-change-order`].value,
              isCurrency: false,
              isOnOverlay: true,
            },
          ],
        }
      );
    }
    const costCodeIdx = newFormData.mainCategories.findIndex(
      (el: MainCategories) => el.name === 'Labor Cost Codes'
    );
    newFormData['mainCategories'][costCodeIdx] = {
      inputElements: inputElements,
      name: 'Labor Cost Codes',
    };
  }

  return newFormData;
}
