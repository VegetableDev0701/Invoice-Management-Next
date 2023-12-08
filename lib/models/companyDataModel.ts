import { CostCodeTreeData, CostCodesData } from './budgetCostCodeModel';
import { MainCategories, SelectMenuOptions, VendorData } from './formDataModel';
import { Invoices } from './invoiceDataModels';
import { ProjectSummary, VendorSummary } from './summaryDataModel';

// TODO seems costCodeList and costCodeNameList should be stored in project data slice?
export interface CompanyData {
  forms: Forms;
  invoices: { status: string; allInvoices: Invoices };
  vendors: { status: string; allVendors: { [vendorId: string]: VendorData } };
  projectsSummary: { status: string; allProjects: ProjectSummary | object };
  vendorsSummary: { status: string; allVendors: VendorSummary | object };
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
  'add-contact': { mainCategories: MainCategories[] };
  'add-labor': { numCostCodes: number; mainCategories: MainCategories[] };
  'add-project': { numRecurringFees: number; mainCategories: MainCategories[] };
  'add-vendor': { mainCategories: MainCategories[] };
  'change-order': { mainCategories: MainCategories[] };
  'process-invoice': { mainCategories: MainCategories[] };
}
