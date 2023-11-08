// utility data model functions
export function isInputElementWithAddressElements(
  element: InputElement
): element is InputElementWithAddressItems {
  return 'addressElements' in element && element.addressElements !== null;
}

export function isInputElementWithItems(
  element: InputElement
): element is InputElementWithItems {
  return 'items' in element && element.items !== null;
}

export interface CompanyData {
  formData: BaseFormData;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: any;
}

export interface BaseFormData {
  baseForms: BaseForms;
  projects: Projects;
  vendors: Vendors;
}

export interface BaseForms {
  'add-project': ProjectFormData;
  'add-vendor': VendorData;
  'account-settings': AccountSettingsData;
}

export interface Projects {
  [key: string]: ProjectFormData;
}

export interface Vendors {
  [key: string]: VendorData;
}

export interface ProjectFormData {
  name: string;
  isActive: boolean;
  mainCategories: MainCategories[];
  numRecurringFees: number;
  projectId: string;
  uuid: string;
}

export interface VendorData {
  name: string;
  mainCategories: MainCategories[];
  vendorId: string;
  uuid: string;
}

export interface AccountSettingsData {
  name: string;
  mainCategories: MainCategories[];
}

export interface Labor {
  [laborId: string]: LaborData;
}

export interface LaborData {
  numCostCodes: number;
  name?: string;
  uuid?: string;
  mainCategories: MainCategories[];
}

export interface ChangeOrderData {
  name?: string;
  uuid?: string;
  mainCategories: MainCategories[];
}

export interface ContractsData {
  name?: string;
  uuid?: string;
  mainCategories: MainCategories[];
}

export interface MainCategories {
  name: string;
  inputElements: InputElement[];
}

export interface InputElementWithAddressItems {
  name: string;
  addressElements: AddressItems[];
}

export interface AddressItems {
  items: Items[];
}

export interface InputElementWithItems {
  items: Items[];
}

export type InputElement = InputElementWithAddressItems | InputElementWithItems;

export interface SelectMenuOptions {
  id: number;
  label: string;
  project_uuid?: string;
  costCode?: string;
}

export interface Items {
  label: string;
  value: string | number | boolean | null | object | undefined;
  id: string;
  required: boolean;
  disabled?: boolean;
  number?: number;
  'data-testid'?: string | null;
  type?: string | null;
  errormessage?: string | null;
  isCurrency?: boolean | null;
  isPhoneNumber?: boolean | null;
  isAddress?: boolean | null;
  validFunc?: string | null;
  inputType?: string | null;
  sideButton?: boolean | null;
  buttonText?: string | null;
  buttonPath?: string | null;
  isOnOverlay?: boolean | null;
  inputmode?:
    | 'none'
    | 'search'
    | 'text'
    | 'email'
    | 'tel'
    | 'url'
    | 'numeric'
    | 'decimal'
    | undefined;
  selectMenuOptions?: SelectMenuOptions[] | null;
}
