import { TreeItem, TreeItemIndex } from 'react-complex-tree';
import { FormStateItem } from './formStateModels';

// TODO unique property of CostCodeItem in N-level structure
export interface CostCodesData {
  format: string;
  currency: string;
  updated: boolean;
  divisions: Divisions[];
  status?: string;
  isOpened?: boolean;
  uuid?: string;
}

export interface Divisions {
  name?: string;
  number: number;
  subdivisions?: SubDivisions[];
  subItems?: CostCodeItem[];
  isOpened?: boolean;
  value?: string;
}

export interface SubDivisions {
  name: string;
  number: number;
  items: CostCodeItem[];
}

export interface CostCodeItem {
  number: number;
  name?: string;
  label?: string;
  value?: string;
  id?: string;
  type?: string;
  required?: boolean;
  isCurrency?: boolean;
  isOpened?: boolean;
  inputType?: string;
  subdivisions?: SubDivisions[];
  subItems?: CostCodeItem[];
}

export interface CostCodeFormState {
  [costCodeId: string]: FormStateItem | boolean;
}

export interface BudgetFormState {
  [itemId: string]: {
    value: string;
    isTouched: boolean;
    isValid: boolean;
    isAdded: boolean;
    isShowing: boolean;
    division: number;
    divisionName: string;
    subDivision: number;
    subDivisionName: string;
    costCodeName: string;
  };
}

export interface AggregatedBudgetTotals {
  total: string;
  changeOrderTotals?: { [changeOrderID: string]: number };
  divisionTotals: {
    [key: string]: {
      value: string;
      name: string;
    };
  };
  subDivisionTotals: {
    [key: string]: {
      value: string;
      division: number;
      name: string;
    };
  };
}

export interface BudgetTotalItem {
  type: 'BudgetTotal';
  value: string;
  isValid?: boolean;
  isTouched?: boolean;
  isAdded?: boolean;
  isShowing?: boolean;
  division: number;
  divisionName: string;
  subDivision: number;
  subDivisionName: string;
  costCodeName: string;
  invoiceIds?: string[];
  laborFeeIds?: string[];
}

export interface BudgetTotals {
  [costCode: string]: BudgetTotalItem;
}

export interface UpdateBudget {
  addCostCodes:
    | {
        name: string;
        number: string;
        divisionNumber: number;
        subDivNumber: number;
      }[]
    | null;
  addSubDivisions:
    | {
        name: string;
        number: string;
        divisionNumber: number;
      }[]
    | null;
  addDivisions:
    | {
        number: string;
        name: string;
      }[]
    | null;
  deleteCostCodes:
    | {
        divisionNumber: number;
        subDivNumber: number;
        costCodeNumber: number;
      }[]
    | null;
  deleteSubDivisions: { divisionNumber: number; subDivNumber: number }[] | null;
  deleteDivisions: { divisionNumber: number }[] | null;
}

export interface CurrentActualsItem {
  totalAmt: string;
  costCodeName: string;
  description: string;
  division: number;
  divisionName: string;
  qtyAmt?: string;
  rateAmt?: string;
  subDivision: number;
  subDivisionName: string;
  vendor: string;
  changeOrder: string | null;
  invoiceIds?: string[];
  laborFeeIds?: string[];
  group: 'Labor and Fees' | 'Invoices' | 'Change Orders';
}

export interface CurrentActuals {
  [costCode: string]: CurrentActualsItem;
}

export interface CurrentActualsChangeOrders {
  [changeOrderId: string]: CurrentActuals;
}

export interface InvoiceCurrentActuals {
  [groupId: string]: { [invoiceId: string]: CurrentActuals };
}

export interface InvoiceCurrentActualsChangeOrders {
  [changeOrderId: string]: { [invoiceId: string]: CurrentActuals };
}

export interface BudgetProfitTaxesObject {
  [key: string]: {
    totalAmt: number;
    rateAmt: string;
    qtyAmt: string;
    description: string;
  };
}

export interface ProfitTaxes {
  profit: number;
  liability: number;
  boTax: number;
  salesTax: number;
  total: number;
}

export interface BudgetTotalItemV2 {
  type: 'BudgetTotalV2';
  costCodeName: string;
  value: string;
  recursiveLevel?: Array<number>;
  isValid?: boolean;
  isTouched?: boolean;
  isAdded?: boolean;
  isShowing?: boolean;
  invoiceIds?: string[];
  laborFeeIds?: string[];
}

export interface BudgetTotalsV2 {
  [costCode: string]: BudgetTotalItemV2;
}

export interface AggregatedBudgetTotalsV2 {
  total: string;
  changeOrderTotals?: { [changeOrderID: string]: number };
  divisionTotals: {
    [key: string]: {
      value: string;
      name: string;
    };
  };
  subDivisionTotals: {
    [key: string]: {
      value: string;
      division: number;
      name: string;
    };
  };
}

export interface CurrentActualsItemV2 {
  totalAmt: string;
  costCodeName: string;
  recursiveLevel?: Array<number>;
  description: string;
  qtyAmt?: string;
  rateAmt?: string;
  vendor: string;
  changeOrder: string | null;
  invoiceIds?: string[];
  laborFeeIds?: string[];
  group: 'Labor and Fees' | 'Invoices' | 'Change Orders';
}

export interface CurrentActualsV2 {
  [costCode: string]: CurrentActualsItemV2;
}

export interface CurrentActualsChangeOrdersV2 {
  [changeOrderId: string]: CurrentActualsV2;
}

export interface InvoiceCurrentActualsV2 {
  [groupId: string]: { [invoiceId: string]: CurrentActualsV2 };
}

export interface InvoiceCurrentActualsChangeOrdersV2 {
  [changeOrderId: string]: { [invoiceId: string]: CurrentActualsV2 };
}

export type TreeData = Record<
  TreeItemIndex,
  TreeItem<
    (Omit<CostCodeItem, 'subItems'> | Omit<CostCodesData, 'divisions'>) & {
      recursiveLevel?: Array<number>;
    }
  >
>;

export type CostCodeTreeData = {
  updated: boolean;
  data: TreeData;
};

export interface UpdateCostCode {
  type: 'Create' | 'Update' | 'Delete';
  number?: number;
  name?: string;
  recursiveLevel?: Array<number>;
}

export interface BaseReportDataItem {
  title: string;
  budgetAmount: number | string;
  actualAmount: number | string;
  difference: number | string;
  percent: string;
  depth: number;
}

export interface ReportDataItem extends BaseReportDataItem {
  costCode?: string | number;
  hasSubItem?: boolean;
  costCodeLevel?: Array<number>;
}

export interface ReportData {
  [costCodeId: string]: ReportDataItem;
}

export interface ReportDataItemChangeOrder extends BaseReportDataItem {
  changeOrderId: string;
}

export interface ReportDataChangeOrder {
  [changeOrderId: string]: ReportDataItemChangeOrder;
}

export interface B2AReport {
  service: BaseReportDataItem[];
  serviceTotal: BaseReportDataItem;
  changeOrder: BaseReportDataItem[];
  changeOrderTotal: BaseReportDataItem;
  grandTotal: BaseReportDataItem;
}
