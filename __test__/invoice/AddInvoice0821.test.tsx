// mocked data
import projectSummaryJSON from '@/__test__/invoiceMocks/0821/projectSummary.json';
import budgetTotalsV2JSON from '@/__test__/invoiceMocks/0821/budgetTotalsV2.json';
import costCodeNameListJSON from '@/__test__/invoiceMocks/0821/costCodeNameList.json';
import projectInvoicesJSON from '@/__test__/invoiceMocks/0821/projectInvoices.json';
import projectLaborFeesJSON from '@/__test__/invoiceMocks/0821/projectLaborFees.json';
import currentActualsJSON from '@/__test__/invoiceMocks/0821/currentActuals.json';
import currentActualChangeOrdersJSON from '@/__test__/invoiceMocks/0821/currentActualsChangeOrders.json';

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
    expect(Object.keys(currentActuals).length).toBe(13);
    expect(Object.keys(currentActualsChangeOrders).length).toBe(0);
    expect(Object.keys(currentActualsChangeOrders).length).toBe(
      numChangeOrders ?? 0
    );
    expect(Object.keys(invoiceCurrentActuals.invoice).length).toBe(
      numInvoices ?? 0
    );
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

    expect(budgetedTotals.total).toBe('33,511.16');
    expect(changeOrderTotals.total).toBe('0.00');
    expect(profitTaxesObject.profit).toBe(4021.34);
    expect(profitTaxesObject.liability).toBe(370.07);
    expect(profitTaxesObject.boTax).toBe(189.51);
    expect(profitTaxesObject.salesTax).toBe(3847.3);
    expect(profitTaxesObject.total).toBe(41939.38);
    expect(profitTaxesObjectChangeOrders.profit).toBe(0);
    expect(profitTaxesObjectChangeOrders.liability).toBe(0);
    expect(profitTaxesObjectChangeOrders.boTax).toBe(0);
    expect(profitTaxesObjectChangeOrders.salesTax).toBe(0);
    expect(profitTaxesObjectChangeOrders.total).toBe(0);
  });
});
