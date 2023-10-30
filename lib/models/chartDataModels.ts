import { CurrentActuals } from './budgetCostCodeModel';
import { FormStateItem } from './formStateModels';

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
