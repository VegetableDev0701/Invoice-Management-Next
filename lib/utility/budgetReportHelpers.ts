import { SUMMARY_COST_CODES, SUMMARY_NAMES } from '../globals';
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
  ProjectSummaryItem,
} from '../models/summaryDataModel';
import { getBillProfitTaxes } from './budgetHelpers';
import { getDataByRecursiveLevel, iterateData } from './costCodeHelpers';
import { formatNumber } from './formatter';
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

const calculatePercent = ({
  actual,
  budget,
}: {
  actual: string | number;
  budget: string | number;
}) => {
  const budgetNum = Number(budget);
  const actualNum = Number(actual);
  const diffNum = actualNum - budgetNum;
  if (budgetNum !== 0) {
    if (diffNum < 0) {
      return `${formatNumber(((actualNum / budgetNum) * 100).toFixed(2))}%`;
    }
    if (diffNum > 0) {
      return `${formatNumber(((diffNum / budgetNum + 1) * 100).toFixed(2))}%`;
    }
    if (actualNum === 0) {
      return '0.00%';
    }
  } else {
    return '100.00%';
  }
};

const isMarks = (key: string) => {
  return Object.values(SUMMARY_COST_CODES)
    .map((cc) => (+cc).toString())
    .includes(key);
};

export const formatReportDataItem = (
  data: BaseReportDataItem,
  isEmpty = false
) => {
  return {
    title: data.title,
    budgetAmount: isEmpty
      ? ''
      : formatNumber(Number(data.budgetAmount).toFixed(2)),
    actualAmount: isEmpty
      ? ''
      : formatNumber(Number(data.actualAmount).toFixed(2)),
    difference: isEmpty
      ? ''
      : formatNumber(
          (Number(data.actualAmount) - Number(data.budgetAmount)).toFixed(2)
        ),
    percent: isEmpty
      ? ''
      : calculatePercent({
          actual: data.actualAmount,
          budget: data.budgetAmount,
        }),
    depth: data.depth,
  } as BaseReportDataItem;
};

export const sumOfArray = (
  title: string,
  format: boolean,
  ...arr: BaseReportDataItem[]
) => {
  const total: BaseReportDataItem =
    arr.length > 0
      ? {
          title,
          budgetAmount: arr
            .map((item) => {
              return typeof item.budgetAmount === 'string'
                ? Number(item.budgetAmount.replaceAll(',', ''))
                : item.budgetAmount;
            })
            .reduce((a, b) => a + b),
          actualAmount: arr
            .map((item) => {
              return typeof item.actualAmount === 'string'
                ? Number(item.actualAmount.replaceAll(',', ''))
                : item.actualAmount;
            })
            .reduce((a, b) => a + b),
          difference: '',
          percent: '',
          depth: arr[0].depth,
        }
      : {
          title,
          budgetAmount: '',
          actualAmount: '',
          difference: '',
          percent: '',
          depth: 0,
        };

  return format ? formatReportDataItem(total, arr.length === 0) : total;
};

interface ClientBillActuals {
  [clientBillId: string]: {
    currentActuals: CurrentActualsV2;
    currentActualsChangeOrders: CurrentActualsChangeOrdersV2;
  };
}

export const buildB2AReport = async ({
  companyId,
  clientBillIds,
  projectId,
  projectBudget,
  changeOrderSummary,
  projectSummary,
}: {
  companyId: string;
  clientBillIds: string[];
  projectId: string;
  projectBudget: CostCodesData;
  changeOrderSummary: ChangeOrderSummary;
  projectSummary: ProjectSummaryItem;
}) => {
  const clientBillActuals: ClientBillActuals = {};

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
    const data = result[clientBillId]['current-actuals'];
    const { currentActuals, currentActualsChangeOrders } = data;
    clientBillActuals[clientBillId] = {
      currentActuals: currentActuals as CurrentActualsV2,
      currentActualsChangeOrders:
        currentActualsChangeOrders as CurrentActualsChangeOrdersV2,
    };
  }

  let reportData: ReportData = initReportDataFromProjectBudget({
    projectBudget,
  });

  // remove the marks
  reportData = Object.entries(reportData)
    .filter(([key, _]) => !isMarks(key))
    .reduce((acc, [key, data]) => {
      if (key !== '0') {
        acc[key] = data;
      }
      return acc;
    }, {} as ReportData);

  const reportDataChangeOrder: ReportDataChangeOrder = {};

  let serviceTotal: BaseReportDataItem = initReportDataItem('Total Service');
  let otherChargesTotal: BaseReportDataItem = initReportDataItem(
    'Total Other Charges'
  );
  let contractTotal: BaseReportDataItem = initReportDataItem('TOTAL CONTRACT');
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
      });
      serviceTotal = sumOfArray(serviceTotal.title, false, serviceTotal, data);
    });

  serviceTotal = formatReportDataItem(serviceTotal);

  const profitTaxesBudget = getBillProfitTaxes({
    projectSummary,
    total: serviceTotal.budgetAmount,
  });

  const profitTaxesActual = getBillProfitTaxes({
    projectSummary,
    total: serviceTotal.actualAmount,
  });

  const otherCharges: BaseReportDataItem[] = [];
  Object.keys(SUMMARY_COST_CODES).forEach((key) => {
    otherCharges.push(
      formatReportDataItem({
        title:
          SUMMARY_NAMES[key as 'profit' | 'liability' | 'boTax' | 'salesTax'],
        budgetAmount:
          profitTaxesBudget[
            key as 'profit' | 'liability' | 'boTax' | 'salesTax'
          ],
        actualAmount:
          profitTaxesActual[
            key as 'profit' | 'liability' | 'boTax' | 'salesTax'
          ],
        difference: '',
        percent: '',
        depth: 2,
      })
    );
  });

  otherChargesTotal = sumOfArray(
    otherChargesTotal.title,
    true,
    ...otherCharges
  );
  contractTotal = sumOfArray(
    contractTotal.title,
    true,
    serviceTotal,
    otherChargesTotal
  );

  changeOrderTotal = sumOfArray(
    changeOrderTotal.title,
    true,
    ...(Object.values(reportDataChangeOrder) as BaseReportDataItem[])
  );
  grandTotal = sumOfArray(
    grandTotal.title,
    true,
    contractTotal,
    changeOrderTotal
  );

  const finalReportData: BaseReportDataItem[] = Object.values({
    ...reportData,
    ...totalReportData,
  })
    .filter((data) =>
      data.hasSubItem
        ? Number(totalReportData[`${data.costCode}Total`].actualAmount) !== 0 ||
          Number(totalReportData[`${data.costCode}Total`].budgetAmount) !== 0
        : Number(data.actualAmount) !== 0 || Number(data.budgetAmount) !== 0
    )
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
    otherCharges,
    otherChargesTotal,
    contractTotal,
    changeOrder: finalReportDataChangeOrder,
    changeOrderTotal,
    grandTotal,
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
    costCodeLevel = [] as Array<string>,
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
