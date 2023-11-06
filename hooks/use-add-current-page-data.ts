import {
  AddressItems,
  InputElement,
  InputElementWithAddressItems,
  InputElementWithItems,
  MainCategories,
  isInputElementWithAddressElements,
  isInputElementWithItems,
} from '@/lib/models/formDataModel';
import { FormData } from '@/lib/models/types';
import { snapshotCopy } from '@/lib/utility/utils';
import { useAppSelector as useSelector } from '@/store/hooks';

/**
 * Pre fills in form data for the current project so the user doesn't
 * have to fill in project name, address etc. when they are opening a form
 * that is nested within a project.
 */
export const useAddCurrentDataToFormData = ({
  projectId,
  vendorId,
  formData,
  includeAddress,
}: {
  projectId?: string;
  vendorId?: string;
  formData: FormData;
  includeAddress?: boolean;
}) => {
  let formValues: any;
  if (projectId) {
    formValues = useSelector(
      (state) => state.data.projectsSummary.allProjects[projectId]
    );
  }
  if (vendorId) {
    formValues = useSelector(
      (state) => state.data.vendorsSummary.allVendors[vendorId]
    );
  }

  const currentFormData = snapshotCopy(formData);
  formData.mainCategories.forEach((category: MainCategories, i: number) => {
    category.inputElements.forEach((el: InputElement, j: number) => {
      if (isInputElementWithItems(el)) {
        el.items.forEach((item, k) => {
          if (item.id === 'project-name') {
            (
              currentFormData.mainCategories[i].inputElements[
                j
              ] as InputElementWithItems
            ).items[k] = {
              label: 'Project Name',
              id: 'project-name',
              inputType: 'dropdownWithSearch',
              required: true,
              errormessage: 'Project is required.',
              value: formValues.projectName as string,
              isOnOverlay: true,
            };
          }
          if (item.id === 'client-name') {
            (
              currentFormData.mainCategories[i].inputElements[
                j
              ] as InputElementWithItems
            ).items[k] = {
              label: "Client's Name",
              id: 'client-name',
              type: 'text',
              required: false,
              errormessage: "Client's name is required.",
              value: formValues.ownerName as string,
              isOnOverlay: true,
            };
          }
        });
      }
      if (includeAddress) {
        if (isInputElementWithAddressElements(el)) {
          el.addressElements.forEach((addEl: AddressItems, jAdd: number) => {
            addEl.items.forEach((addItem, kAdd: number) => {
              if (addItem.id === 'project-address') {
                (
                  currentFormData.mainCategories[i].inputElements[
                    j
                  ] as InputElementWithAddressItems
                ).addressElements[jAdd].items[kAdd] = {
                  label: 'Project Address',
                  id: 'project-address',
                  type: 'text',
                  required: true,
                  errormessage: 'Project address is required.',
                  isAddress: true,
                  value: formValues.address as string,
                  isOnOverlay: true,
                };
              }
              if (addItem.id === 'city-project') {
                (
                  currentFormData.mainCategories[i].inputElements[
                    j
                  ] as InputElementWithAddressItems
                ).addressElements[jAdd].items[kAdd] = {
                  label: 'City',
                  id: 'city-project',
                  type: 'text',
                  required: true,
                  isAddress: true,
                  value: formValues.city as string,
                  isOnOverlay: true,
                };
              }
              if (addItem.id === 'state-project') {
                (
                  currentFormData.mainCategories[i].inputElements[
                    j
                  ] as InputElementWithAddressItems
                ).addressElements[jAdd].items[kAdd] = {
                  label: 'State',
                  id: 'state-project',
                  type: 'text',
                  required: true,
                  isAddress: true,
                  value: formValues.state as string,
                  isOnOverlay: true,
                };
              }
              if (addItem.id === 'zip-code-project') {
                (
                  currentFormData.mainCategories[i].inputElements[
                    j
                  ] as InputElementWithAddressItems
                ).addressElements[jAdd].items[kAdd] = {
                  label: 'Zip Code',
                  id: 'zip-code-project',
                  type: 'text',
                  inputmode: 'numeric',
                  required: true,
                  isAddress: true,
                  value: formValues.zipCode as string,
                  isOnOverlay: true,
                };
              }
            });
          });
        }
      }
    });
  });

  return currentFormData;
};
