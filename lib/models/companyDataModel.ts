import { CostCodeTreeData, CostCodesData } from './budgetCostCodeModel';
import { MainCategories, SelectMenuOptions } from './formDataModel';
import { Invoices } from './invoiceDataModels';
import { ProjectSummary, VendorSummary } from './summaryDataModel';

export interface Employees {
  full_name: string;
  agave_uuid: string | null;
  uuid: string;
}
export interface Customers {
  name: string;
  agave_uuid: string | null;
  email: string | null;
  uuid: string;
  sub_level: number;
}

// TODO seems costCodeList and costCodeNameList should be stored in project data slice?
export interface CompanyData {
  forms: Forms;
  invoices: { status: string; allInvoices: Invoices };
  projectsSummary: { status: string; allProjects: ProjectSummary | object };
  vendorsSummary: { status: string; allVendors: VendorSummary | object };
  employees: Employees | object;
  customers: Customers | object;
  costCodes: CostCodesData;
  costCodeList: SelectMenuOptions[];
  costCodeNameList: SelectMenuOptions[];
}

export type ExtendedCompanyData = {
  treeData: CostCodeTreeData;
} & CompanyData;

export interface Forms {
  status: string;
  'account-settings': { mainCategories: MainCategories[] };
  'add-contract': { mainCategories: MainCategories[] };
  'edit-contract': { mainCategories: MainCategories[] };
  'add-labor': { numCostCodes: number; mainCategories: MainCategories[] };
  'add-project': { numRecurringFees: number; mainCategories: MainCategories[] };
  'add-vendor': { mainCategories: MainCategories[] };
  'change-order': { mainCategories: MainCategories[] };
  'process-invoice': { mainCategories: MainCategories[] };
}
