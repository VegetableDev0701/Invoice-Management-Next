import { LaborData } from './formDataModel';
import {
  InvoiceCurrentActuals,
  InvoiceCurrentActualsChangeOrders,
} from './budgetCostCodeModel';
import { Invoices } from './invoiceDataModels';
import { ChangeOrderContent } from './changeOrderModel';
import { ProjectDataItems, ProjectSummaryGroup } from './projectDataModel';

type EmptyObject = {
  [K in keyof any]: never;
};
export type RowsWithoutEmptyObject = {
  [K in keyof Rows]: Exclude<Rows[K], EmptyObject>;
};

export interface BaseSummary {
  uuid: string;
}

export interface Rows {
  [key: string]:
    | string
    | number
    | boolean
    | string[]
    | undefined
    | EmptyObject
    | null;
}

export interface Data {
  data: SummaryData;
  isLoading: boolean;
}

export interface SummaryData {
  [key: string]: SummaryRows | string;
}

export type SummaryRows = {
  [id: string]: Rows;
};

export interface ClientBillEntry {
  invoices: Invoices;
  labor: { [laborId: string]: LaborData };
  'labor-summary': LaborSummary;
  billSummary?: Rows;
}

export interface ClientBills {
  [clientBillId: string]: ClientBillEntry;
}

export interface LaborSummary {
  [laborFeeId: string]: LaborSummaryItem;
}

export interface LaborLineItem {
  [itemId: string]: LaborLineItemItem;
}

export interface LaborLineItemItem {
  cost_code: string;
  work_description: string;
  number_of_hours: string;
  change_order: { name: string; uuid: string } | null;
  amount: string;
}

export interface LaborSummaryItem extends BaseSummary {
  name: string;
  rate: string;
  line_items: LaborLineItem;
  payPeriod: string;
  totalAmt: string;
  clientBillId: string | null;
  currentLabor: boolean;
  rowId?: null;
}

export interface ClientBillData {
  actuals: InvoiceCurrentActuals;
  actualsChangeOrders: InvoiceCurrentActualsChangeOrders;
}

export interface ClientBillSummary {
  [clientBillId: string]: ClientBillSummaryItem;
}

export interface ClientBillSummaryItem extends BaseSummary {
  billTitle: string;
  subTotal: string;
  changeOrders: string;
  budgetedSalesTax: string;
  profit: string;
  insuranceLiability: string;
  boTax: string;
  total: string;
  numInvoices: number;
  numChangeOrders: number;
  laborFeeIds: string[];
  invoiceIds: string[];
  changeOrder?: string;
  totalsByChangeOrder?: { [changeOrderId: string]: number };
}

export interface ChangeOrderSummary {
  [changeOrderId: string]: ChangeOrderSummaryItem;
}

export interface ChangeOrderSummaryItem extends BaseSummary {
  projectName: string;
  date: string;
  clientName: string;
  content: ChangeOrderContent | object;
  address: string;
  subtotalAmt: string;
  workDescription: string;
  name: string;
  numItems?: string;
}

export interface ProjectSummary {
  [projectId: string]: ProjectSummaryItem;
}

export interface ProjectSummaryItem extends BaseSummary {
  ownerPhone: string;
  contractAmt: string;
  ownerEmail: string;
  zipCode: string;
  profitPercent: string;
  city: string;
  projectSuperPhone: string;
  projectSuper: string;
  projectName: string;
  projectType: string;
  squareFeet: string;
  isActive: boolean;
  ownerName: string;
  estCompletionDate: string;
  address: string;
  permitNumber: string;
  state: string;
  salesTax: string;
  insuranceRate: string;
  boTax: string;
}

export interface VendorSummary {
  [vendorId: string]: VendorSummaryItem;
}

export interface VendorSummaryItem extends BaseSummary {
  insuranceName: string;
  w9OnFile: boolean;
  businessLicExpirationDate: string;
  cellPhone: string;
  zipCode: string;
  vendorName: string;
  businessLicNumber: string;
  insuranceExpirationDate: string;
  city: string;
  vendorType: string;
  landiExpirationDate: string;
  primaryContact: string;
  insuranceCoverageAmt: string;
  bondCompanyName: string;
  bondAmt: string;
  workPhone: string;
  address: string;
  state: string;
  landiLicNumber: string;
  email: string;
  workersCompExpirationDate: string;
}

export interface SummaryProjects {
  [projectId: string]: ProjectSummaryItem;
}

export interface ContractData {
  [contractId: string]: ContractEntry;
}

export interface ContractEntry {
  gcs_img_uri: string[];
  gcs_uri: string;
  summaryData: ContractSummaryData;
  uuid: string;
}

interface ContractSummaryData {
  projectName: string;
  date: string;
  contractAmt: string;
  workDescription: string;
  vendor: string;
  vendorId?: string; // TODO this needs to be added to the contract interface
}

export interface ContractSummaryItem extends BaseSummary {
  gcs_uri: string;
  gcs_img_uri: string[];
  summaryData: ContractSummaryData;
}

export interface ContractSummary {
  [contractId: string]: ContractSummaryItem;
}

export interface ContractTableRow {
  name: string;
  projectName: string;
  workDescription: string;
  contractAmt: string;
  contractDate: string;
  uuid: string;
}

export type SummaryTableRowType =
  | { stateKey: 'change-orders-summary'; newData: ChangeOrderSummaryItem }
  | { stateKey: 'labor-summary'; newData: LaborSummaryItem }
  | { stateKey: 'contracts-summary'; newData: ContractEntry }
  | { stateKey: 'client-bills-summary'; newData: ClientBillSummaryItem };

export function getSummary(
  projectState: ProjectDataItems,
  stateKey: keyof ProjectSummaryGroup,
  projectId: string
): ProjectSummaryGroup[keyof ProjectSummaryGroup] {
  const summaryState = projectState[stateKey];

  if (!summaryState) {
    throw new Error(
      `Summary with key ${stateKey} not found in project ${projectId}.`
    );
  }

  switch (stateKey) {
    case 'change-orders-summary':
      return summaryState as ChangeOrderSummary;
    case 'labor-summary':
      return summaryState as LaborSummary;
    case 'contracts-summary':
      return summaryState as ContractSummary;
    case 'client-bills-summary':
      return summaryState as ClientBillSummary;
  }
}
