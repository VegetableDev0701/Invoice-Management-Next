import { FormStateItem } from './formStateModels';

export interface CostCodesData {
  format: string;
  currency: string;
  updated: boolean;
  divisions: Divisions[];
  status?: string;
  // uuid?: string;
}

export interface Divisions {
  name: string;
  number: number;
  subdivisions: SubDivisions[];
}

export interface SubDivisions {
  name: string;
  number: number;
  items: CostCodeItem[];
}

export interface CostCodeItem {
  label: string;
  number: number;
  value: string;
  id: string;
  type: string;
  required: boolean;
  isCurrency: boolean;
  inputType: string;
  subdivisions?: SubDivisions[];
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
  // changeOrder?: string | null;
  // amount?: string;
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
