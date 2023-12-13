import {
  AddressItems,
  InputElement,
  Items,
  MainCategories,
  isInputElementWithAddressElements,
  isInputElementWithItems,
} from '@/lib/models/formDataModel';
import { FormState } from '@/lib/models/formStateModels';
import { EmptyAddProjectForm } from '../forms/AddProjectForm.test';

export function createFormStateData(
  formData: EmptyAddProjectForm,
  setIsTouched: boolean,
  setIsValid: boolean
): { formState: FormState; numRequired: number; totalNumInputs: number } {
  let numRequired: number = 0;
  let totalNumInputs: number = 0;
  const formState: FormState = {};
  formData.mainCategories.forEach((category: MainCategories, i: number) => {
    category.inputElements.forEach((el: InputElement, j: number) => {
      if (isInputElementWithAddressElements(el)) {
        el.addressElements.forEach((addEl: AddressItems, jAdd: number) => {
          addEl.items.forEach((addItem: Items, kAdd: number) => {
            if (addItem.required) {
              numRequired++;
            }
            totalNumInputs++;
            const isTouched = setIsTouched ? true : false;
            const isValid = setIsValid ? true : false;
            formState[addItem.id] = {
              value: addItem.value as string,
              isTouched,
              isValid,
            };
          });
        });
      } else if (isInputElementWithItems(el)) {
        el.items.forEach((item, k) => {
          if (item.required) {
            numRequired++;
          }
          totalNumInputs++;

          const isTouched = setIsTouched ? true : false;
          const isValid = setIsValid ? true : false;
          formState[item.id] = {
            value: item.value as string,
            isTouched,
            isValid,
          };
        });
      }
    });
  });
  return { formState, numRequired, totalNumInputs };
}
