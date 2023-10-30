import {
  CurrentActuals,
  CurrentActualsChangeOrders,
  InvoiceCurrentActuals,
  InvoiceCurrentActualsChangeOrders,
} from './budgetCostCodeModel';
import { Labor } from './formDataModel';
import { Invoices } from './invoiceDataModels';
import { ChangeOrderSummary, LaborSummary } from './summaryDataModel';

export interface ClientBillData {
  ['current-actuals']: CurrentActualsClientBill;
  invoices: Invoices;
  labor: Labor;
  ['labor-summary']: LaborSummary;
  ['bill-work-description']: BillWorkDescription;
}

export interface BillWorkDescription {
  actuals: InvoiceCurrentActuals;
  actualsChangeOrders: InvoiceCurrentActualsChangeOrders;
}

export interface CurrentActualsClientBill {
  clientBillSummary: ChangeOrderSummary | null;
  currentActuals: CurrentActuals;
  currentActualsChangeOrders: CurrentActualsChangeOrders;
  invoiceIds: string[] | null;
  laborIds: string[] | null;
}

export interface SubTotals {
  budgeted: CurrentActuals;
  changeOrders: CurrentActuals;
}

export interface GroupedClientBillData {
  [group: string]: WorkDescriptionContentItem;
}

export interface WorkDescriptionContentItem {
  qtyAmt: string;
  description: string;
  rateAmt: string;
  vendor: string;
  totalAmt: string;
  costCode: string;
}
