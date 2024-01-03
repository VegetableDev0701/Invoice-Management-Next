import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';

import { projectDataActions } from '@/store/projects-data-slice';
import { companyDataActions } from '@/store/company-data-slice';

import {
  AddressItems,
  InputElement,
  InputElementWithAddressItems,
  InputElementWithItems,
  Items,
  MainCategories,
  VendorData,
  isInputElementWithAddressElements,
  isInputElementWithItems,
} from '../models/formDataModel';
import {
  AgaveVendorFormStateV2,
  UpdateContractVendor,
  UpdateDocData,
  UpdateInvoiceVendor,
} from '../models/vendorModel';
import { isObjectEmpty } from './utils';

// interface CustomFields {
//   OwnerId: string;
//   DataExtName: string;
//   DataExtType: string;
//   DataExtValue: string;
// }

// function getCustomField(data: CustomFields[], customName: string) {
//   return data
//     ? data.find((item) => item.DataExtName === customName)?.['DataExtValue']
//     : undefined;
// }

// export function createVendorFormStateData({
//   vendorSummary,
// }: {
//   vendorSummary: any;
// }) {
//   const sourceDataCustomFields: CustomFields[] =
//     vendorSummary.source_data.data?.DataExtRet;

//   const vendorAgaveFormState = {} as AgaveVendorFormStateV2;

//   // qbd custom fields
//   vendorAgaveFormState['w9-on-file'] = {
//     value: getCustomField(sourceDataCustomFields, 'W-9 on File'),
//   };
//   vendorAgaveFormState['primary-contact'] = {
//     value: getCustomField(sourceDataCustomFields, 'Primary Contact'),
//   };
//   vendorAgaveFormState['business-license-number'] = {
//     value: getCustomField(sourceDataCustomFields, 'Master Bus License'),
//   };
//   vendorAgaveFormState['landi-number'] = {
//     value: getCustomField(sourceDataCustomFields, 'LNI Registration No.'),
//   };
//   vendorAgaveFormState['insurance-expiration-date'] = {
//     value: getCustomField(sourceDataCustomFields, 'Gen Liability Expires'),
//   };

//   // agave standard fields
//   vendorAgaveFormState['vendor-name'] = { value: agaveVendorData.name };
//   vendorAgaveFormState['vendor-address'] = {
//     value: agaveVendorData.address?.street_1,
//   };
//   vendorFormState['city-vendor'] = {
//     value: vendorSummary.address?.city,
//   };
//   vendorFormState['state-vendor'] = {
//     value: vendorSummary.address?.state,
//   };
//   vendorFormState['zip-code-vendor'] = {
//     value: vendorSummary.address?.postal_code,
//   };
//   vendorFormState['email'] = { value: vendorSummary.email };
//   vendorFormState['work-phone'] = vendorSummary.phone
//     ? { value: formatPhoneNumber(vendorSummary.phone) }
//     : { value: undefined };
//   vendorFormState['tax-number'] = { value: vendorSummary.tax_number };
//   vendorFormState['vendor-type'] = { value: vendorSummary.type };
//   vendorFormState['is-active'] = {
//     value: vendorSummary.source_data.data.IsActive,
//   };

// }

export function createVendorFormData({
  formData,
  formStateData,
}: {
  formData: Omit<VendorData, 'name' | 'vendorId' | 'uuid'>;
  formStateData: AgaveVendorFormStateV2;
}): VendorData {
  const newFormData: VendorData = JSON.parse(JSON.stringify(formData || {}));
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

  return newFormData;
}

export async function updateVendorDocs({
  dispatch,
  data,
}: {
  dispatch: ThunkDispatch<unknown, unknown, AnyAction>;
  data: UpdateDocData;
}) {
  if (data) {
    if (!isObjectEmpty(data.invoice)) {
      dispatch(
        companyDataActions.updateMultipleInvoiceVendors(
          data.invoice as UpdateInvoiceVendor
        )
      );
    }
    if (!isObjectEmpty(data.contract)) {
      dispatch(
        projectDataActions.updateMultipleContractVendors(
          data.contract as UpdateContractVendor
        )
      );
    }
  }
}
