import { SUMMARY_COST_CODES } from '../globals';
import {
  B2AReport,
  BaseReportDataItem,
  CostCodeItem,
  CostCodesData,
  CurrentActualsChangeOrdersV2,
  CurrentActualsV2,
  Divisions,
  ReportData,
  ReportDataChangeOrder,
} from '../models/budgetCostCodeModel';
import {
  ChangeOrderSummary,
  ClientBillSummary,
} from '../models/summaryDataModel';
import { getDataByRecursiveLevel, iterateData } from './costCodeHelpers';
import { fetchWithRetry } from './ioUtils';

export const initReportDataItem = (title = '') => {
  return {
    title,
    budgetAmount: 0,
    actualAmount: 0,
    difference: '',
    percent: '',
    depth: 0,
  } as BaseReportDataItem;
};

export const formatReportDataItem = (
  data: BaseReportDataItem,
  isEmpty = false
) => {
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
    depth: data.depth,
  } as BaseReportDataItem;
};

export const sumOfArray = (
  title: string,
  format: boolean,
  ...arr: BaseReportDataItem[]
) => {
  const total: BaseReportDataItem = {
    title,
    budgetAmount: arr
      .map((item) => Number(item.budgetAmount))
      .reduce((a, b) => a + b),
    actualAmount: arr
      .map((item) => Number(item.actualAmount))
      .reduce((a, b) => a + b),
    difference: '',
    percent: '',
    depth: arr[0].depth,
  };

  return format ? formatReportDataItem(total) : total;
};

interface ClientBillActuals {
  [clientBillId: string]: {
    currentActuals: CurrentActualsV2;
    currentActualsChangeOrders: CurrentActualsChangeOrdersV2;
  };
}

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
  const clientBillActuals: ClientBillActuals = {};

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

  const reportData: ReportData = initReportDataFromProjectBudget({
    projectBudget,
  });
  const reportDataChangeOrder: ReportDataChangeOrder = {};

  let serviceTotal: BaseReportDataItem = initReportDataItem('TOTAL');
  let changeOrderTotal: BaseReportDataItem = initReportDataItem(
    'TOTAL CHANGE ORDERS TO DATE'
  );
  let grandTotal: BaseReportDataItem = initReportDataItem(
    'GRAND TOTAL PROJECT TO DATE'
  );

  fetchActualCostsFromInvoices({
    reportData,
    reportDataChangeOrder,
    projectBudget,
    clientBillActuals,
    changeOrderSummary,
  });

  // sum up the total values
  const totalReportData: ReportData = {};

  Object.values(reportData)
    .filter((data) => data.hasSubItem === false)
    .forEach((data) => {
      data.costCodeLevel?.forEach((costCode) => {
        if (!reportData[costCode] || !reportData[costCode].hasSubItem) return;

        const totalId = `${costCode}Total`;

        if (!totalReportData[totalId]) {
          totalReportData[totalId] = {
            title: `Total ${reportData[costCode].title}`,
            budgetAmount: 0,
            actualAmount: 0,
            difference: '',
            percent: '',
            costCode: totalId,
            depth: reportData[costCode].depth,
            hasSubItem: false,
          };
        }

        totalReportData[totalId] = {
          ...totalReportData[totalId],
          ...sumOfArray(
            totalReportData[totalId].title,
            false,
            totalReportData[totalId],
            data
          ),
        };

        serviceTotal = sumOfArray(
          serviceTotal.title,
          false,
          serviceTotal,
          data
        );
      });
    });

  serviceTotal = formatReportDataItem(serviceTotal);
  changeOrderTotal = sumOfArray(
    changeOrderTotal.title,
    true,
    ...(Object.values(reportDataChangeOrder) as BaseReportDataItem[])
  );
  grandTotal = sumOfArray(
    grandTotal.title,
    true,
    serviceTotal,
    changeOrderTotal
  );

  const finalReportData: BaseReportDataItem[] = Object.values({
    ...reportData,
    ...totalReportData,
  })
    .sort((a, b) => {
      if (
        +String(a.costCode).split('.')[0].split('T')[0] >
        +String(b.costCode).split('.')[0].split('T')[0]
      )
        return 1;
      if (
        +String(a.costCode).split('.')[0].split('T')[0] <
        +String(b.costCode).split('.')[0].split('T')[0]
      )
        return -1;
      if (String(a.costCode) > String(b.costCode)) return 1;
      return -1;
    })
    .map((data) => ({
      ...formatReportDataItem(data, data.hasSubItem),
    }));

  const finalReportDataChangeOrder: BaseReportDataItem[] = Object.values(
    reportDataChangeOrder
  ).map((data) => ({
    ...formatReportDataItem(data),
  }));

  return {
    service: finalReportData,
    serviceTotal: serviceTotal,
    changeOrder: finalReportDataChangeOrder,
    changeOrderTotal: changeOrderTotal,
    grandTotal: grandTotal,
  } as B2AReport;
};

const initReportDataFromProjectBudget = ({
  projectBudget,
}: {
  projectBudget: CostCodesData;
}) => {
  const reportData: ReportData = {};

  const initReportData = (
    item: CostCodeItem | Divisions,
    level: Array<number>,
    costCodeLevel = [] as Array<number>,
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
      costCodeLevel,
    };
  };

  projectBudget &&
    projectBudget.divisions.forEach((div, index) => {
      iterateData({
        data: div,
        level: [index],
        cb: initReportData,
        costCodeLevel: [div.number],
        visitAll: true,
      });
    });

  return reportData;
};

const fetchActualCostsFromInvoices = ({
  reportData,
  reportDataChangeOrder,
  projectBudget,
  clientBillActuals,
  changeOrderSummary,
}: {
  reportData: ReportData;
  reportDataChangeOrder: ReportDataChangeOrder;
  projectBudget: CostCodesData;
  clientBillActuals: ClientBillActuals;
  changeOrderSummary: ChangeOrderSummary;
}) => {
  // fetch actual amounts from invoices
  Object.keys(clientBillActuals).forEach((clientBillId: string) => {
    const billData = clientBillActuals[clientBillId];

    // service data
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

    // change orders
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
            depth: 3,
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
};
