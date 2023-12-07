import { SUMMARY_COST_CODES } from '../globals';
import {
  BaseReportDataItem,
  CostCodeItem,
  CostCodesData,
  CurrentActualsChangeOrdersV2,
  CurrentActualsV2,
  Divisions,
  ReportData,
  ReportDataChangeOrder,
  ReportDataItem,
  ReportDataItemChangeOrder,
} from '../models/budgetCostCodeModel';
import {
  ChangeOrderSummary,
  ClientBillSummary,
} from '../models/summaryDataModel';
import { getDataByRecursiveLevel, iterateData } from './costCodeHelpers';
import { fetchWithRetry } from './ioUtils';

const formatReportDataItem = (data: BaseReportDataItem, isEmpty = false) => {
  return {
    title: data.title,
    budgetAmount: isEmpty ? '' : Number(data.budgetAmount).toFixed(2),
    actualAmount: isEmpty ? '' : Number(data.actualAmount).toFixed(2),
    difference: isEmpty
      ? ''
      : (Number(data.actualAmount) - Number(data.budgetAmount)).toFixed(2),
    percent: isEmpty
      ? ''
      : `${(Number(data.budgetAmount) !== 0
          ? (Number(data.actualAmount) / Number(data.budgetAmount)) * 100
          : Number(data.actualAmount) === 0
          ? 0
          : 100
        ).toFixed(2)}%`,
  } as BaseReportDataItem;
};

export const buildB2AReport = async ({
  projectId,
  companyId,
  clientBillId,
  clientBills,
  projectBudget,
  changeOrderSummary,
}: {
  projectId: string;
  companyId: string;
  clientBillId: string;
  clientBills: ClientBillSummary;
  projectBudget: CostCodesData;
  changeOrderSummary: ChangeOrderSummary;
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
  const reportDataChangeOrder: ReportDataChangeOrder = {};

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
  Object.keys(clientBillActuals).forEach((clientBillId: string) => {
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

    Object.keys(billData.currentActualsChangeOrders)
      .filter((key) => key !== 'profitTaxesLiability')
      .forEach((changeOrderId) => {
        if (!reportDataChangeOrder[changeOrderId]) {
          reportDataChangeOrder[changeOrderId] = {
            title: changeOrderSummary[changeOrderId].name,
            budgetAmount: Number(changeOrderSummary[changeOrderId].subtotalAmt),
            actualAmount: 0,
            difference: '',
            percent: '',
            changeOrderId,
          };
        }

        Object.values(
          billData.currentActualsChangeOrders[changeOrderId]
        ).forEach((data) => {
          reportDataChangeOrder[changeOrderId] = {
            ...reportDataChangeOrder[changeOrderId],
            actualAmount:
              Number(reportDataChangeOrder[changeOrderId].actualAmount) +
              Number(data.totalAmt.replaceAll(',', '')),
          };
        });
      });
  });

  const finalReportData: ReportDataItem[] = Object.values(reportData)
    .map((data) => ({
      ...formatReportDataItem(data, data.hasSubItem),
      costCode: data.costCode,
      hasSubItem: data.hasSubItem,
      depth: data.depth,
    }))
    .sort((a, b) => {
      if (Number(a.costCode) > Number(b.costCode)) return 1;
      return -1;
    });

  const finalReportDataChangeOrder: ReportDataItemChangeOrder[] = Object.values(
    reportDataChangeOrder
  ).map((data) => ({
    ...formatReportDataItem(data),
    changeOrderId: data.changeOrderId,
  }));

  return finalReportData;
};
