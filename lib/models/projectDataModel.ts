import {
  CostCodesData,
  CurrentActualsChangeOrders,
  CurrentActualsChangeOrdersV2,
} from './budgetCostCodeModel';
import {
  ChangeOrderChartData,
  ChangeOrderChartDataV2,
  ChartData,
  ChartDataV2,
} from './chartDataModels';
import {
  ChangeOrderData,
  Labor,
  ProjectFormData,
  SelectMenuOptions,
} from './formDataModel';
import {
  ChangeOrderSummary,
  ClientBillSummary,
  ClientBills,
  ContractData,
  ContractSummary,
  LaborSummary,
} from './summaryDataModel';

export interface B2A {
  b2aChartData: ChartData | ChartDataV2;
  currentGrandTotal: { value: number };
  currentBudgetedTotal: { value: number };
  currentChangeOrderTotal: { value: number };
  b2aChartDataChangeOrder: ChangeOrderChartData | ChangeOrderChartDataV2;
  updatedCurrentActualsChangeOrders:
    | CurrentActualsChangeOrders
    | CurrentActualsChangeOrdersV2;
}

export interface ProjectDataItems {
  status?: 'rejected' | 'fulfilled';
  budget: CostCodesData;
  'change-orders': { [changeOrderId: string]: ChangeOrderData };
  'change-orders-summary': ChangeOrderSummary | object;
  contracts: ContractData;
  'contracts-summary'?: ContractSummary | object;
  labor: Labor;
  'labor-summary': LaborSummary | object;
  'project-details'?: ProjectFormData;
  b2a: B2A;
  'client-bills-summary': ClientBillSummary | object;
  'client-bills': ClientBills;
  costCodeList: SelectMenuOptions[];
  costCodeNameList: SelectMenuOptions[];
}

export interface ProjectData {
  [projectId: string]: ProjectDataItems;
}

export interface CostCodeObjType {
  id: number;
  label: string;
}

export interface ProjectSummaryGroup {
  'change-orders-summary': ChangeOrderSummary;
  'labor-summary': LaborSummary;
  'contracts-summary': ContractSummary;
  'client-bills-summary': ClientBillSummary;
}
