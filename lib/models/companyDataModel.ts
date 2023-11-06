import { CostCodesData, Divisions } from './budgetCostCodeModel';
import { CostCodesData as UpdatedCostCodesData } from '@/components/Budget/CostCodes/CostCodesTreeData';
import { MainCategories, SelectMenuOptions, VendorData } from './formDataModel';
import { Invoices } from './invoiceDataModels';
import { ProjectSummary, VendorSummary } from './summaryDataModel';

// TODO seems costCodeList and costCodeNameList should be stored in project data slice?
export interface CompanyData {
  forms: Forms;
  invoices: { status: string; allInvoices: Invoices };
  vendors: { [vendorId: string]: VendorData };
  projectsSummary: { status: string; allProjects: ProjectSummary };
  vendorsSummary: { status: string; allVendors: VendorSummary };
  costCodes: UpdatedCostCodesData;
  costCodeList: SelectMenuOptions[];
  costCodeNameList: SelectMenuOptions[];
}

export interface Forms {
  status: string;
  'account-settings': { mainCategories: MainCategories };
  'add-contact': { mainCategories: MainCategories };
  'add-labor': { numCostCodes: number; mainCategories: MainCategories };
  'add-project': { numRecurringFees: number; mainCategories: MainCategories };
  'add-vendor': { mainCategories: MainCategories };
  'change-order': { mainCategories: MainCategories };
  'process-invoice': { mainCategories: MainCategories };
}
