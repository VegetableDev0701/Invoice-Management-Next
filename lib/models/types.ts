import {
  AccountSettingsData,
  ChangeOrderData,
  ContractsData,
  LaborData,
  ProjectFormData,
  VendorData,
  InvoiceFormData,
  ProjectInvoiceFormData
} from '@/lib/models/formDataModel';

// import { ProcessedInvoiceData } from '@/lib/models/invoiceDataModels';

import { addProjectFormActions } from '@/store/add-project-slice';
import { addVendorFormActions } from '@/store/add-vendor-slice';
import { accountSettingsFormActions } from '@/store/account-settings-slice';
import { addLaborFormActions } from '@/store/add-labor-slice';
import { addChangeOrderFormActions } from '@/store/add-change-order';
import { editContractFormActions } from '@/store/edit-contract';
import { addProcessInvoiceFormActions } from '@/store/add-process-invoice';
import { invoiceActions } from '@/store/invoice-slice';
import { BudgetTotalItem, BudgetTotalItemV2 } from './budgetCostCodeModel';
import { InvoiceLineItemItem } from './invoiceDataModels';
import { onboardUserActions } from '@/store/onboard-user-slice';
import { addBillTitleActions } from '@/store/add-bill-title-slice';
import { singleInvoiceFormActions } from '@/store/process-invoice-slice';
import { singleContractFormActions } from '@/store/single-contract-slice';
import { singleClientBillInvoiceFormActions} from '@/store/single-client-bill-invoice-slice';

export type AddProjectActions = typeof addProjectFormActions;
type AddVendorActions = typeof addVendorFormActions;
type AccountSettingsActions = typeof accountSettingsFormActions;
export type AddLaborActions = typeof addLaborFormActions;
type AddChangeOrderActions = typeof addChangeOrderFormActions;
export type EditContractFormActions = typeof editContractFormActions;
export type AddProcessInvoiceActions = typeof addProcessInvoiceFormActions;
export type InvoiceActions = typeof invoiceActions;
type OnboardUserActions = typeof onboardUserActions;
type AddBillTitleActions = typeof addBillTitleActions;
type SingleInvoiceAction = typeof singleInvoiceFormActions;
type singleContractActions = typeof singleContractFormActions;
type singleClientBillInvoiceActions = typeof singleClientBillInvoiceFormActions;

export type Actions =
  | AddProjectActions
  | AddVendorActions
  | AccountSettingsActions
  | AddLaborActions
  | AddChangeOrderActions
  | EditContractFormActions
  | OnboardUserActions
  | AddProcessInvoiceActions
  | AddBillTitleActions
  | singleContractActions
  | SingleInvoiceAction
  | singleClientBillInvoiceActions

export type FormData =
  | ProjectFormData
  | InvoiceFormData
  | VendorData
  | AccountSettingsData
  | LaborData
  | ChangeOrderData
  | ContractsData
  | ProjectInvoiceFormData;

/**
 * I have two interfaces with the same entry called value and totalAmt,
 * so this type guard allows both to be used in various functions.
 * @param item
 * @returns
 */
export function isBudgetTotalItem(item: any): item is BudgetTotalItem {
  return item.type === 'BudgetTotal';
}

export function isBudgetTotalItemV2(item: any): item is BudgetTotalItemV2 {
  return item.type === 'BudgetTotalV2';
}

export function isKeyOfLineItemItem(
  key: string
): key is keyof InvoiceLineItemItem {
  return [
    'description',
    'amount',
    'cost_code',
    'work_description',
    'page',
    'bounding_box',
    'change_order',
    'number_of_hours',
    'billable',
  ].includes(key);
}
