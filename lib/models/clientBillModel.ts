import {
  CurrentActuals,
  CurrentActualsChangeOrders,
  CurrentActualsChangeOrdersV2,
  CurrentActualsV2,
  InvoiceCurrentActuals,
  InvoiceCurrentActualsChangeOrders,
  InvoiceCurrentActualsChangeOrdersV2,
  InvoiceCurrentActualsV2,
} from './budgetCostCodeModel';
import { Labor } from './formDataModel';
import { Invoices } from './invoiceDataModels';
import { ChangeOrderSummary, LaborSummary } from './summaryDataModel';

export interface ClientBillData {
  ['current-actuals']: CurrentActualsClientBillV2;
  invoices: Invoices;
  labor: Labor;
  ['labor-summary']: LaborSummary;
  ['bill-work-description']: BillWorkDescriptionV2;
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

export interface SubTotalsV2 {
  budgeted: CurrentActualsV2;
  changeOrders: CurrentActualsV2;
}

export interface CurrentActualsClientBillV2 {
  clientBillSummary: ChangeOrderSummary | null;
  currentActuals: CurrentActualsV2;
  currentActualsChangeOrders: CurrentActualsChangeOrdersV2;
  invoiceIds: string[] | null;
  laborIds: string[] | null;
}

export interface BillWorkDescriptionV2 {
  actuals: InvoiceCurrentActualsV2;
  actualsChangeOrders: InvoiceCurrentActualsChangeOrdersV2;
}
