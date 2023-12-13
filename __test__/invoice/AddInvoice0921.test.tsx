// mocked data
import projectSummaryJSON from '@/__test__/invoiceMocks/0921/projectSummary.json';
import budgetTotalsV2JSON from '@/__test__/invoiceMocks/0921/budgetTotalsV2.json';
import costCodeNameListJSON from '@/__test__/invoiceMocks/0921/costCodeNameList.json';
import projectInvoicesJSON from '@/__test__/invoiceMocks/0921/projectInvoices.json';
import projectLaborFeesJSON from '@/__test__/invoiceMocks/0921/projectLaborFees.json';
import currentActualsJSON from '@/__test__/invoiceMocks/0921/currentActuals.json';
import currentActualChangeOrdersJSON from '@/__test__/invoiceMocks/0921/currentActualsChangeOrders.json';

// other imports
import {
  MakeRequired,
  calculateBillTotal,
  calculateTotals,
  createBudgetActualsObject,
} from '@/lib/utility/budgetHelpers';
import { InvoiceItem } from '@/lib/models/invoiceDataModels';
import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import {
  ChangeOrderSummary,
  LaborSummaryItem,
  ProjectSummaryItem,
} from '@/lib/models/summaryDataModel';
import {
  BudgetTotalsV2,
  CurrentActualsChangeOrdersV2,
  CurrentActualsV2,
} from '@/lib/models/budgetCostCodeModel';
import { SelectMenuOptions } from '@/lib/models/formDataModel';

// assert types
const projectSummary: ProjectSummaryItem =
  projectSummaryJSON as unknown as ProjectSummaryItem;
const projectInvoices: MakeRequired<InvoiceItem, 'processedData'>[] =
  projectInvoicesJSON as unknown as MakeRequired<
    InvoiceItem,
    'processedData'
  >[];
const projectLaborFees: LaborSummaryItem[] =
  projectLaborFeesJSON as unknown as LaborSummaryItem[];
const budgetTotalsV2: BudgetTotalsV2 =
  budgetTotalsV2JSON as unknown as BudgetTotalsV2;
const changeOrdersSummary: ChangeOrderSummary =
  undefined as unknown as ChangeOrderSummary;
const costCodeNameList: SelectMenuOptions[] =
  costCodeNameListJSON as unknown as SelectMenuOptions[];
const currentActuals: CurrentActualsV2 =
  currentActualsJSON as unknown as CurrentActualsV2;
const currentActualsChangeOrders: CurrentActualsChangeOrdersV2 =
  currentActualChangeOrdersJSON as unknown as CurrentActualsChangeOrdersV2;

const dispatch: ThunkDispatch<unknown, unknown, AnyAction> = jest.fn();

describe('testing the invoice build process', () => {
  test('test createBudgetActualsObject output', () => {
    const {
      budgetActuals: currentActuals,
      budgetActualsChangeOrders: currentActualsChangeOrders,
      billTitle,
      numInvoices,
      numChangeOrders,
      invoiceBudgetActuals: invoiceCurrentActuals,
      invoiceBudgetActualsChangeOrders: invoiceCurrentActualsChangeOrders,
    } = createBudgetActualsObject({
      projectInvoices,
      projectLaborFees,
      budgetTotals: budgetTotalsV2,
      changeOrdersSummary,
      costCodeNameList,
      dispatch,
    });

    expect(Object.keys(currentActuals).length).toBe(12);
    expect(Object.keys(currentActualsChangeOrders).length).toBe(1);
    expect(Object.keys(invoiceCurrentActuals.laborFee).length).toBe(4);
  });
  test('test budget totals and profit and taxes calculations', () => {
    const budgetedTotals = calculateTotals({
      budget: currentActuals,
      isChangeOrder: false,
    });
    const changeOrderTotals = calculateTotals({
      budget: currentActualsChangeOrders,
      isChangeOrder: true,
    });
    const profitTaxesObject = calculateBillTotal({
      projectSummary,
      subTotal: budgetedTotals.total,
    });
    const profitTaxesObjectChangeOrders = calculateBillTotal({
      projectSummary,
      subTotal: changeOrderTotals.total,
    });

    expect(budgetedTotals.total).toBe('94,715.70');
    expect(changeOrderTotals.total).toBe('16,281.31');
    expect(profitTaxesObject.profit).toBe(11365.88);
    expect(profitTaxesObject.liability).toBe(1045.96);
    expect(profitTaxesObject.boTax).toBe(535.64);
    expect(profitTaxesObject.salesTax).toBe(10873.98);
    expect(profitTaxesObject.total).toBe(118537.17);
    expect(profitTaxesObjectChangeOrders.profit).toBe(1953.76);
    expect(profitTaxesObjectChangeOrders.liability).toBe(179.8);
    expect(profitTaxesObjectChangeOrders.boTax).toBe(92.07);
    expect(profitTaxesObjectChangeOrders.salesTax).toBe(1869.2);
    expect(profitTaxesObjectChangeOrders.total).toBe(20376.14);
  });
});
