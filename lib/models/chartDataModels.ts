import { CurrentActuals, CurrentActualsV2 } from './budgetCostCodeModel';

export interface CostCodeB2AData {
  subDivision: number | string;
  subDivisionName: string;
  costCodeLabels: string[];
  costCodeNumbers: string[];
  costCodeTotals: number[];
  costCodeActuals: number[];
}

export interface SubDivisionB2AData {
  [subDivisionName: number]: CostCodeB2AData;
}

export interface DivisionData {
  division: number | string;
  divisionName: string;
  subDivisionLabels: string[];
  subDivisionTotals: number[];
  subDivisionActuals: number[];
  subDivisions: SubDivisionB2AData;
}

export interface ChartData {
  [divisionName: number]: DivisionData;
}

export interface ChangeOrderChartData {
  [changeOrderPlotXAxis: string]: {
    totalValue: number | null;
    actualValue: number | null;
    costCodeObj: CurrentActuals | null;
    laborFeeIds?: string[] | null;
    invoiceIds?: string[] | null;
  };
}
export interface DivisionDataV2 {
  name?: string;
  number: number;
  subItems?: CostCodeItemB2AData[];
}
export interface CostCodeItemB2AData {
  number: number;
  name?: string;
  value?: string;
  actual?: string | number;
  subItems?: CostCodeItemB2AData[];
  isCurrency?: boolean;
}

export interface ChartDataV2 {
  divisions: DivisionDataV2[];
}

export interface ChangeOrderChartDataV2 {
  [changeOrderPlotXAxis: string]: {
    totalValue: number | null;
    actualValue: number | null;
    costCodeObj: CurrentActualsV2 | null;
    laborFeeIds?: string[] | null;
    invoiceIds?: string[] | null;
  };
}
