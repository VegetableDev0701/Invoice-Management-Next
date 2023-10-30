import {
  AccountSettingsData,
  BaseForms,
  ProjectFormData,
  VendorData,
  Projects,
  Vendors,
  BaseFormData,
  CompanyData,
} from '@/lib/models/formDataModel';

const initialAccountSettingsData: AccountSettingsData = {
  name: '',
  mainCategories: [],
};

const initialProjectData: ProjectFormData = {
  name: '',
  isActive: false,
  mainCategories: [],
  numRecurringFees: 0,
  projectId: '',
  uuid: '',
};

const initialVendorData: VendorData = {
  name: '',
  mainCategories: [],
  vendorId: '',
  uuid: '',
};

const initialBaseForms: BaseForms = {
  'add-project': initialProjectData,
  'add-vendor': initialVendorData,
  'account-settings': initialAccountSettingsData,
};

const initialProjects: Projects = {};

const initialVendors: Vendors = {};

const initialBaseFormData: BaseFormData = {
  baseForms: initialBaseForms,
  projects: initialProjects,
  vendors: initialVendors,
};

export const initialCostCodesState = {
  status: '',
  format: '',
  updated: false,
  divisions: [],
  currency: '',
};

export const initialCompanyDataState: CompanyData = {
  formData: initialBaseFormData,
  status: 'idle',
  error: null,
};
