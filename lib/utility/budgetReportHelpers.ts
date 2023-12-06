import { SUMMARY_COST_CODES } from '../globals';
import {
  CostCodeItem,
  CostCodesData,
  CurrentActualsChangeOrdersV2,
  CurrentActualsV2,
  Divisions,
  ReportData,
  ReportDataItem,
} from '../models/budgetCostCodeModel';
import { ClientBillSummary } from '../models/summaryDataModel';
import { getDataByRecursiveLevel, iterateData } from './costCodeHelpers';
import { fetchWithRetry } from './ioUtils';

export const buildB2AReport = async ({
  projectId,
  companyId,
  clientBillId,
  clientBills,
  projectBudget,
}: {
  projectId: string;
  companyId: string;
  clientBillId: string;
  clientBills: ClientBillSummary;
  projectBudget: CostCodesData;
}) => {
  const clientBillActuals: {
    [clientBillId: string]: {
      currentActuals: CurrentActualsV2;
      currentActualsChangeOrders: CurrentActualsChangeOrdersV2;
    };
  } = {};

  // fetch current and previous client bill data from backend
  const clientBillIds = Object.keys(clientBills).filter(
    (key) =>
      key === clientBillId ||
      new Date(clientBills[clientBillId].createdAt || 0) >=
        new Date(clientBills[key].createdAt || 0)
  );
  for (const clientBillId of clientBillIds) {
    const result = await fetchWithRetry(
      `/api/${companyId}/projects/${projectId}/get-single-client-bill`,
      {
        method: 'GET',
        headers: {
          clientBillId,
          isOnlyCurrentActuals: 'false',
        },
      }
    );
    const data = JSON.parse(result)[clientBillId]['current-actuals'];
    const { currentActuals, currentActualsChangeOrders } = data;
    clientBillActuals[clientBillId] = {
      currentActuals: currentActuals as CurrentActualsV2,
      currentActualsChangeOrders:
        currentActualsChangeOrders as CurrentActualsChangeOrdersV2,
    };
  }

  const reportData: ReportData = {};

  const initReportData = (
    item: CostCodeItem | Divisions,
    level: Array<number>,
    hasSubItem = false
  ) => {
    const depth = level.length - 1;
    reportData[item.number] = {
      title: `${item.number} ${item.name}`,
      budgetAmount: (item as CostCodeItem).value || '',
      actualAmount: '',
      difference: '',
      percent: '',
      costCode: item.number,
      hasSubItem,
      depth,
    };
  };

  projectBudget &&
    projectBudget.divisions.forEach((div, index) => {
      iterateData({
        data: div,
        level: [index],
        cb: initReportData,
        visitAll: true,
      });
    });

  // fetch actual amounts from invoices
  Object.keys(clientBillActuals).forEach((clientBillId: any) => {
    const billData = clientBillActuals[clientBillId];

    // for now, skip tax information
    Object.keys(billData.currentActuals)
      .filter(
        (key) =>
          Object.values(SUMMARY_COST_CODES).findIndex(
            (item) => item === key
          ) === -1
      )
      .forEach((key) => {
        const data = billData.currentActuals[key];

        const result = getDataByRecursiveLevel({
          fullData: projectBudget.divisions,
          level: data.recursiveLevel || [],
        });

        if (result && result.data && reportData[result.data.number]) {
          reportData[result.data.number] = {
            ...reportData[result.data.number],
            actualAmount:
              Number(reportData[result.data.number].actualAmount) +
              Number(data.totalAmt.replaceAll(',', '')),
          };
        }
      });
  });

  const finalReportData: ReportDataItem[] = Object.values(reportData)
    .map((data) => ({
      title: data.title,
      budgetAmount: data.hasSubItem ? '' : Number(data.budgetAmount).toFixed(2),
      actualAmount: data.hasSubItem ? '' : Number(data.actualAmount).toFixed(2),
      difference: data.hasSubItem
        ? ''
        : (Number(data.actualAmount) - Number(data.budgetAmount)).toFixed(2),
      percent: data.hasSubItem
        ? ''
        : `${(Number(data.budgetAmount) !== 0
            ? (Number(data.actualAmount) / Number(data.budgetAmount)) * 100
            : 0
          ).toFixed(2)}%`,
      costCode: data.costCode,
      hasSubItem: data.hasSubItem,
      depth: data.depth,
    }))
    .sort((a, b) => {
      if (Number(a.costCode) > Number(b.costCode)) return 1;
      return -1;
    });

  return finalReportData;
};
