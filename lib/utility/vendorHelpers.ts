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
import { AgaveVendorFormStateV2 } from '../models/vendorModel';
import { formatPhoneNumber } from './formatter';

interface CustomFields {
  OwnerId: string;
  DataExtName: string;
  DataExtType: string;
  DataExtValue: string;
}

function getCustomField(data: CustomFields[], customName: string) {
  return data
    ? data.find((item) => item.DataExtName === customName)?.['DataExtValue']
    : undefined;
}

export function createVendorFormStateData({
  agaveVendorData,
}: {
  agaveVendorData: any;
}) {
  const sourceDataCustomFields: CustomFields[] =
    agaveVendorData.source_data.data?.DataExtRet;

  const vendorAgaveFormState = {} as AgaveVendorFormStateV2;

  // qbd custom fields
  vendorAgaveFormState['w9-on-file'] = {
    value: getCustomField(sourceDataCustomFields, 'W-9 on File'),
  };
  vendorAgaveFormState['primary-contact'] = {
    value: getCustomField(sourceDataCustomFields, 'Primary Contact'),
  };
  vendorAgaveFormState['business-license-number'] = {
    value: getCustomField(sourceDataCustomFields, 'Master Bus License'),
  };
  vendorAgaveFormState['landi-number'] = {
    value: getCustomField(sourceDataCustomFields, 'LNI Registration No.'),
  };
  vendorAgaveFormState['insurance-expiration-date'] = {
    value: getCustomField(sourceDataCustomFields, 'Gen Liability Expires'),
  };

  // agave standard fields
  vendorAgaveFormState['vendor-name'] = { value: agaveVendorData.name };
  vendorAgaveFormState['vendor-address'] = {
    value: agaveVendorData.address?.street_1,
  };
  vendorAgaveFormState['city-vendor'] = {
    value: agaveVendorData.address?.city,
  };
  vendorAgaveFormState['state-vendor'] = {
    value: agaveVendorData.address?.state,
  };
  vendorAgaveFormState['zip-code-vendor'] = {
    value: agaveVendorData.address?.postal_code,
  };
  vendorAgaveFormState['email'] = { value: agaveVendorData.email };
  vendorAgaveFormState['work-phone'] = agaveVendorData.phone
    ? { value: formatPhoneNumber(agaveVendorData.phone) }
    : { value: undefined };
  vendorAgaveFormState['tax-number'] = { value: agaveVendorData.tax_number };
  vendorAgaveFormState['vendor-type'] = { value: agaveVendorData.type };
  vendorAgaveFormState['is-active'] = {
    value: agaveVendorData.source_data.data.IsActive,
  };

  return vendorAgaveFormState;
}

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
