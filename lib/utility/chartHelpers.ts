import {
  BudgetTotalItemV2,
  BudgetTotals,
  BudgetTotalsV2,
  CostCodesData,
  CurrentActuals,
  CurrentActualsChangeOrdersV2,
  CurrentActualsItemV2,
  CurrentActualsV2,
} from '../models/budgetCostCodeModel';
import {
  ChartData,
  ChartDataV2,
  DivisionDataV2,
  CostCodeItemB2AData,
  ChangeOrderChartDataV2,
} from '../models/chartDataModels';
import { ChangeOrderSummary } from '../models/summaryDataModel';
import { isBudgetTotalItem, isBudgetTotalItemV2 } from '../models/types';
import { getDataByRecursiveLevel, iterateData } from './costCodeHelpers';
import { snapshotCopy } from './utils';

export const createB2AChartData = ({
  divisionTotals,
  subDivTotals,
  costCodeTotals,
  currentBudgetedTotal,
  initActualsToZeros,
  previousData,
}: {
  divisionTotals: { [divNumber: number]: { value: string; name: string } };
  subDivTotals: {
    [subDivNumber: number]: { value: string; division: number; name: string };
  };
  costCodeTotals: CurrentActuals | BudgetTotals;
  currentBudgetedTotal: number;
  initActualsToZeros: boolean;
  previousData?: ChartData;
}) => {
  const chartData: ChartData = {};

  Object.values(subDivTotals).forEach((subDivValue) => {
    const divisionKey = subDivValue.division;
    // initialize the chart data object
    if (!chartData?.[divisionKey]) {
      chartData[divisionKey] = {
        division: divisionKey,
        divisionName: divisionTotals[divisionKey].name,
        subDivisionLabels: [],
        subDivisionTotals: [],
        subDivisionActuals: [],
        subDivisions: {},
      };
    }
    chartData[divisionKey].subDivisionLabels.push(subDivValue.name);

    if (typeof subDivValue.value === 'string') {
      chartData[divisionKey].subDivisionTotals.push(
        Number(subDivValue.value.replaceAll(',', ''))
      );
    } else {
      chartData[divisionKey].subDivisionTotals.push(Number(subDivValue.value));
    }

    // initalize the actuals array to all zeros if this object doesn't already exist
    // otherwise insert the old actuals values
    if (initActualsToZeros) {
      chartData[divisionKey].subDivisionActuals = new Array(
        chartData[divisionKey].subDivisionTotals.length
      ).fill(0);
    } else {
      if (previousData) {
        chartData[divisionKey].subDivisionActuals =
          previousData[divisionKey].subDivisionActuals;
      }
    }
  });
  let amount: string;
  let currentInvoiceTotals = currentBudgetedTotal ?? 0;
  // these costCodeTotals are the currentActuals seperated out by cost code
  Object.entries(costCodeTotals).forEach(([costCodeNumber, costCodeObj]) => {
    // get a grand total from the current invoice that we will add to the previous
    // actual totals to calculate project completion percent

    amount = isBudgetTotalItem(costCodeObj)
      ? costCodeObj.value
      : costCodeObj.totalAmt;

    currentInvoiceTotals += Number(amount.replaceAll(',', ''));
    const divisionKey = costCodeObj.division;
    const subDivKey = costCodeObj.subDivision;

    if (!chartData[divisionKey].subDivisions[subDivKey]) {
      chartData[divisionKey].subDivisions[subDivKey] = {
        subDivision: subDivKey,
        subDivisionName: subDivTotals[subDivKey].name,
        costCodeLabels: [],
        costCodeNumbers: [],
        costCodeTotals: [],
        costCodeActuals: [],
      };
    }

    chartData[divisionKey].subDivisions[subDivKey].costCodeLabels.push(
      costCodeObj.costCodeName as string
    );
    chartData[divisionKey].subDivisions[subDivKey].costCodeNumbers.push(
      costCodeNumber
    );
    chartData[divisionKey].subDivisions[subDivKey].costCodeTotals.push(
      +amount.replaceAll(',', '')
    );

    // initalize the actuals array to all zeros if this object doesn't already exist
    // otherwise insert the old actuals values
    if (initActualsToZeros) {
      chartData[divisionKey].subDivisions[subDivKey].costCodeActuals =
        new Array(
          chartData[divisionKey].subDivisions[subDivKey].costCodeTotals.length
        ).fill(0);
    } else {
      if (previousData) {
        chartData[divisionKey].subDivisions[subDivKey].costCodeActuals =
          previousData[divisionKey].subDivisions[subDivKey].costCodeActuals;
      }
    }
  });

  const grandActualsTotal = currentBudgetedTotal
    ? currentInvoiceTotals + currentBudgetedTotal
    : currentInvoiceTotals;

  return { chartData, grandActualsTotal: Number(grandActualsTotal.toFixed(2)) };
};

export const createB2AChartDataV2 = ({
  budget,
  costCodeTotals,
  currentBudgetedTotal,
  initActualsToZeros,
  previousData,
}: {
  budget: CostCodesData;
  costCodeTotals?: CurrentActualsV2 | BudgetTotalsV2;
  currentBudgetedTotal: number;
  initActualsToZeros: boolean;
  previousData?: ChartDataV2;
}) => {
  if (!budget) return;
  const chartData: ChartDataV2 = {
    divisions: [],
  };

  budget.divisions.forEach((div) => {
    const divisionData: DivisionDataV2 = {
      number: div.number,
      name: div.name,
      subItems: [],
    };

    divisionData.subItems = snapshotCopy(div.subItems) as CostCodeItemB2AData[];

    chartData.divisions.push(divisionData);
  });

  let amount: string;
  let currentInvoiceTotals = currentBudgetedTotal ?? 0;

  const initActualFromPreviousData = (
    item: CostCodeItemB2AData,
    level: Array<number>
  ) => {
    if (!item.actual) return;

    const data = getDataByRecursiveLevel({
      fullData: chartData.divisions,
      level: level,
    });

    if (data && data.data)
      (data.data as CostCodeItemB2AData).actual = String(item.actual);
  };

  !initActualsToZeros &&
    previousData &&
    previousData.divisions.forEach((div, index) => {
      iterateData({
        data: div,
        level: [index],
        cb: initActualFromPreviousData,
      });
    });

  costCodeTotals &&
    Object.entries(costCodeTotals).forEach(([_, obj]) => {
      const costCodeObj: CurrentActualsItemV2 | BudgetTotalItemV2 = obj;
      const recursiveLevel = costCodeObj.recursiveLevel;
      if (!recursiveLevel || recursiveLevel.length === 0) return;

      amount = isBudgetTotalItemV2(costCodeObj)
        ? costCodeObj.value
        : costCodeObj.totalAmt;

      currentInvoiceTotals += Number(amount.replaceAll(',', ''));

      const levelData = getDataByRecursiveLevel({
        fullData: chartData.divisions,
        level: recursiveLevel,
      });
      if (levelData) {
        const { data } = levelData;

        (data as CostCodeItemB2AData).actual = String(
          amount.replaceAll(',', '')
        );
      }
    });

  return {
    chartData,
    grandActualsTotal: Number(currentInvoiceTotals.toFixed(2)),
  };
};

export const addNewChangeOrderValuesToPreviousData = ({
  currentActualsChangeOrders,
  previousCurrentActualsChangeOrders,
}: {
  currentActualsChangeOrders: CurrentActualsChangeOrdersV2;
  previousCurrentActualsChangeOrders:
    | CurrentActualsChangeOrdersV2
    | null
    | undefined;
}) => {
  let updatedCurrentActualsChangeOrders: CurrentActualsChangeOrdersV2 =
    snapshotCopy(currentActualsChangeOrders);
  if (previousCurrentActualsChangeOrders) {
    Object.keys(previousCurrentActualsChangeOrders).forEach((changeOrderId) => {
      // If this change order already exists, iterate its values from previous data
      if (updatedCurrentActualsChangeOrders?.[changeOrderId]) {
        Object.keys(previousCurrentActualsChangeOrders[changeOrderId]).forEach(
          (costCode) => {
            // if cost code already exists then iterate its values from previous data
            if (updatedCurrentActualsChangeOrders[changeOrderId]?.[costCode]) {
              updatedCurrentActualsChangeOrders[changeOrderId][costCode] = {
                ...updatedCurrentActualsChangeOrders[changeOrderId][costCode],
                totalAmt: (
                  +previousCurrentActualsChangeOrders[changeOrderId][
                    costCode
                  ].totalAmt.replaceAll(',', '') +
                  +updatedCurrentActualsChangeOrders[changeOrderId][
                    costCode
                  ].totalAmt.replaceAll(',', '')
                ).toString(),
              };
              // if then just take the data from the previous and add it to the new current
            } else {
              updatedCurrentActualsChangeOrders[changeOrderId][costCode] = {
                ...previousCurrentActualsChangeOrders[changeOrderId][costCode],
              };
            }
          }
        );
        // if the change order doesn't exist on current data, add previous data for that change order
      } else {
        updatedCurrentActualsChangeOrders[changeOrderId] = {
          ...previousCurrentActualsChangeOrders[changeOrderId],
        };
      }
    });
  } else {
    updatedCurrentActualsChangeOrders = { ...currentActualsChangeOrders };
  }
  return { updatedCurrentActualsChangeOrders };
};

export const createB2AChangeOrderChartData = ({
  updatedCurrentActualsChangeOrders,
  changeOrdersSummary,
}: {
  updatedCurrentActualsChangeOrders: CurrentActualsChangeOrdersV2;
  changeOrdersSummary: ChangeOrderSummary;
}) => {
  let changeOrderChartData: ChangeOrderChartDataV2 = {};
  let grandTotal = 0;
  Object.keys(updatedCurrentActualsChangeOrders).forEach((changeOrderId) => {
    // The change order Chart Data is the data that will be used
    // to create the change order plot. This object keys are either
    // the direct values for the x-axis, or the change order ids.
    if (
      changeOrderId !== 'profitTaxesLiability' &&
      !changeOrderChartData?.[changeOrderId]
    ) {
      changeOrderChartData[changeOrderId] = {
        totalValue: null,
        actualValue: null,
        costCodeObj: null,
      };
    }
    let totalValue: number | null = null;
    let actualValue = 0;
    const costCodeObj: CurrentActualsV2 = {};
    if (changeOrderId === 'profitTaxesLiability') {
      totalValue = null;
    } else {
      totalValue = +changeOrdersSummary[changeOrderId].subtotalAmt.replaceAll(
        ',',
        ''
      );
    }
    Object.keys(updatedCurrentActualsChangeOrders[changeOrderId]).forEach(
      (costCode) => {
        if (changeOrderId === 'profitTaxesLiability') {
          // TODO ???
          // const name =
          //   updatedCurrentActualsChangeOrders[changeOrderId][costCode]
          //     .costCodeName;
          // actualValue = Number(
          //   updatedCurrentActualsChangeOrders[changeOrderId][
          //     costCode
          //   ].totalAmt.replaceAll(",", "")
          // );
          // grandTotal += actualValue;
          // changeOrderChartData[name] = {
          //   totalValue,
          //   actualValue,
          //   costCodeObj: null,
          // };
        } else {
          actualValue += Number(
            updatedCurrentActualsChangeOrders[changeOrderId][
              costCode
            ].totalAmt.replaceAll(',', '')
          );
          grandTotal += actualValue;
          costCodeObj[costCode] = {
            ...updatedCurrentActualsChangeOrders[changeOrderId][costCode],
          };
        }
      }
    );
    changeOrderChartData = {
      ...changeOrderChartData,
      ...{ [changeOrderId]: { totalValue, actualValue, costCodeObj } },
    };
  });
  delete changeOrderChartData.profitTaxesLiability;
  return {
    changeOrderChartData,
    grandTotal: Number(Number(grandTotal.toFixed(2))),
  };
};

/**
 * Update totals chart data with new actual values.
 *
 * @param {Object} params - The function parameters.
 * @param {ChartData} params.totals - The existing totals chart data.
 * @param {ChartData} params.actuals - The new actuals chart data.
 * @param {boolean} params.isDeleteBill - Flag to determine if a bill is deleted.
 *
 * @returns {ChartData} - Updated totals chart data.
 */
export const addActualsToTotals = ({
  totals,
  actuals,
  isDeleteBill,
}: {
  totals: ChartData;
  actuals: ChartData;
  isDeleteBill: boolean;
}): ChartData => {
  const newTotals: ChartData = JSON.parse(JSON.stringify(totals));
  Object.keys(actuals).forEach((key) => {
    if (totals[+key]) {
      let listActualsLabels = actuals[Number(key)].subDivisionLabels;
      let listTotalsLabels = newTotals[Number(key)].subDivisionLabels;
      let newActuals = actuals[Number(key)].subDivisionTotals;
      let oldActuals = newTotals[Number(key)].subDivisionActuals;

      // Re-map the actual's totals to match the budget totals and add any new
      // actuals to the previous actuals in that list
      newActuals = listTotalsLabels.map((item, index) => {
        const i = listActualsLabels.indexOf(item);
        // if you delete a bill you need to subtract the actual data instead of adding it
        if (!isDeleteBill) {
          return i !== -1
            ? (oldActuals?.[index] ? oldActuals[index] : 0) + newActuals[i]
            : oldActuals?.[index]
            ? oldActuals[index]
            : 0;
        } else {
          return i !== -1
            ? (oldActuals?.[index] ? oldActuals[index] : 0) - newActuals[i]
            : oldActuals?.[index]
            ? oldActuals[index]
            : 0;
        }
      });
      newTotals[Number(key)].subDivisionActuals = newActuals;
      Object.keys(actuals[Number(key)].subDivisions).forEach((subKey) => {
        if (totals[Number(key)].subDivisions[+subKey]) {
          listActualsLabels =
            actuals[Number(key)].subDivisions[+subKey].costCodeLabels;
          listTotalsLabels =
            totals[Number(key)].subDivisions[+subKey].costCodeLabels;
          newActuals =
            actuals[Number(key)].subDivisions[+subKey].costCodeTotals;
          oldActuals =
            totals[Number(key)].subDivisions[+subKey].costCodeActuals;

          newActuals = listTotalsLabels.map((item, index) => {
            const i = listActualsLabels.indexOf(item);
            if (!isDeleteBill) {
              return i !== -1
                ? (oldActuals[index] ? oldActuals[index] : 0) + newActuals[i]
                : oldActuals?.[index]
                ? oldActuals[index]
                : 0;
            } else {
              return i !== -1
                ? (oldActuals[index] ? oldActuals[index] : 0) - newActuals[i]
                : oldActuals?.[index]
                ? oldActuals[index]
                : 0;
            }
          });
          newTotals[Number(key)].subDivisions[Number(subKey)].costCodeActuals =
            newActuals;
        }
      });
    }
  });
  return newTotals;
};

export const addActualsToTotalsV2 = ({
  budget,
  totals,
  actuals,
  isDeleteBill,
}: {
  budget: CostCodesData;
  totals: ChartDataV2;
  actuals: ChartDataV2;
  isDeleteBill: boolean;
}): ChartDataV2 => {
  const newTotals: ChartDataV2 = {
    divisions: [],
  };

  budget.divisions.forEach((div) => {
    const divisionData: DivisionDataV2 = {
      number: div.number,
      name: div.name,
      subItems: [],
    };

    divisionData.subItems = snapshotCopy(div.subItems) as CostCodeItemB2AData[];

    newTotals.divisions.push(divisionData);
  });

  let isAdd = true;

  const updateChartDataActual = (
    item: CostCodeItemB2AData,
    level: Array<number>
  ) => {
    if (!item.actual) return;

    const data = getDataByRecursiveLevel({
      fullData: newTotals.divisions,
      level: level,
    });

    if (data && data.data)
      (data.data as CostCodeItemB2AData).actual =
        (Number((data.data as CostCodeItemB2AData).actual) || 0) +
        (Number(item.actual) || 0) * (isAdd ? 1 : -1);
  };

  totals &&
    totals.divisions?.forEach((div, index) => {
      iterateData({
        data: div,
        level: [index],
        cb: updateChartDataActual,
      });
    });

  isAdd = !isDeleteBill;

  actuals &&
    actuals.divisions?.forEach((div, index) => {
      iterateData({
        data: div,
        level: [index],
        cb: updateChartDataActual,
      });
    });

  return newTotals;
};
