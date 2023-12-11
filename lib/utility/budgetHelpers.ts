import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';

import { uiActions } from '@/store/ui-slice';

import { formatNumber } from './formatter';
import {
  ChangeOrderSummary,
  LaborLineItem,
  LaborSummaryItem,
  ProjectSummaryItem,
} from '../models/summaryDataModel';
import { getCostCodeDescriptionFromNumber } from './costCodeHelpers';
import { SelectMenuOptions } from '../models/formDataModel';
import {
  AggregatedBudgetTotals,
  CurrentActuals,
  BudgetProfitTaxesObject,
  ProfitTaxes,
  BudgetTotalsV2,
  CurrentActualsV2,
  CurrentActualsChangeOrdersV2,
  InvoiceCurrentActualsChangeOrdersV2,
  InvoiceCurrentActualsV2,
  CurrentActualsItemV2,
  BudgetTotalItemV2,
} from '../models/budgetCostCodeModel';
import { isBudgetTotalItemV2 } from '../models/types';
import {
  InvoiceItem,
  InvoiceLineItem,
  InvoiceLineItemItem,
} from '../models/invoiceDataModels';

export type MakeRequired<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export const createBudgetActualsObject = ({
  projectInvoices,
  projectLaborFees,
  budgetTotals,
  costCodeNameList,
  dispatch,
}: {
  projectInvoices: MakeRequired<InvoiceItem, 'processedData'>[];
  projectLaborFees: LaborSummaryItem[] | null;
  budgetTotals: BudgetTotalsV2;
  changeOrdersSummary: ChangeOrderSummary;
  costCodeNameList: SelectMenuOptions[];
  dispatch: ThunkDispatch<unknown, unknown, AnyAction>;
}) => {
  const dates: Date[] = [];
  try {
    const budgetActuals: CurrentActualsV2 = {};
    const budgetActualsChangeOrders: CurrentActualsChangeOrdersV2 = {};
    const invoiceBudgetActualsChangeOrders: InvoiceCurrentActualsChangeOrdersV2 =
      {};
    const invoiceBudgetActuals: InvoiceCurrentActualsV2 = {
      invoice: {},
      laborFee: {},
    };

    // loop through all invoices attached for this current client bill
    projectInvoices &&
      projectInvoices.forEach((invoice) => {
        if (!invoice.processedData) return;
        dates.push(new Date(invoice.processedData.date_received + 'T12:00:00'));
        // init the invoice current actuals object
        invoiceBudgetActuals.invoice[invoice.doc_id] =
          invoiceBudgetActuals.invoice[invoice.doc_id] || {};

        const lineItems = invoice.processedData.line_items;
        // check that we have processedData, that there are line items, and the user
        // did not toggle the line item switch off. This would happen if they started filling i
        // line items, then decided they didn't want to categorize individual line items
        // so they just closed the line items as a way to ignore that work.
        // The user can't choose a cost code for the entire invoice when the line items are opened
        // and they can't choose a change order for a line item AND the whole invoice, so this
        // is a bit of redundancy
        const hasProcessedLineItems =
          invoice.processedData &&
          invoice.processedData.line_items_toggle &&
          invoice.processedData.line_items &&
          Object.values(lineItems as InvoiceLineItem | object).length > 0;
        const hasValidLineItems =
          invoice.processedData.line_items &&
          (
            Object.values(
              lineItems as InvoiceLineItem | object
            ) as InvoiceLineItemItem[]
          ).some((item) => !item.cost_code || item.amount !== '');
        if (hasProcessedLineItems && hasValidLineItems) {
          handleLineItem({
            lineItems: lineItems as InvoiceLineItem,
            vendorName: invoice.processedData.vendor.name ?? '',
            uuid: invoice.doc_id,
            isCredit: invoice.processedData.is_credit,
            isInvoice: true,
            isLaborFee: false,
            budgetTotals,
            costCodeNameList,
            budgetActuals,
            budgetActualsChangeOrders,
            invoiceBudgetActuals,
            invoiceBudgetActualsChangeOrders,
          });
        } else if (
          invoice.processedData.cost_code !== null && // check that it is not null
          invoice.processedData.total_amount &&
          invoice.processedData.total_tax_amount
        ) {
          handleWholeInvoice({
            invoice,
            budgetTotals,
            costCodeNameList,
            budgetActuals,
            budgetActualsChangeOrders,
            invoiceBudgetActuals,
            invoiceBudgetActualsChangeOrders,
          });
        } else {
          handleError({ invoice, dispatch });
        }
      });

    projectLaborFees &&
      projectLaborFees.forEach((laborFee) => {
        // init the invoice budget actuals object for the laborFee
        invoiceBudgetActuals.laborFee[laborFee.uuid] =
          invoiceBudgetActuals.laborFee[laborFee.uuid] || {};
        laborFee.payPeriod != '' &&
          dates.push(new Date((laborFee.payPeriod as string) + 'T12:00:00'));
        handleLineItem({
          lineItems: laborFee.line_items as LaborLineItem,
          vendorName: laborFee.name,
          uuid: laborFee.uuid,
          isCredit: false,
          isInvoice: false,
          isLaborFee: true,
          budgetTotals,
          costCodeNameList,
          budgetActuals,
          budgetActualsChangeOrders,
          invoiceBudgetActuals,
          invoiceBudgetActualsChangeOrders,
        });
      });

    // super clunky but we shouldn't ever have lists of more than 50 - 100, so this shouldn't be that slow
    // TODO reimagine this part
    const maxDate = new Date(Math.max(...dates.map((date) => date.getTime())));
    const maxMonth = String(maxDate.getMonth() + 1).padStart(2, '0');
    const maxMonthName = maxDate.toLocaleString('default', {
      month: 'long',
    });
    const maxYear = maxDate.getFullYear();
    const billTitle = `${maxYear}-${maxMonth} (${maxMonthName})`;

    const allInvoices = [
      ...new Set([
        ...Object.keys(invoiceBudgetActuals.invoice),
        ...Object.keys(invoiceBudgetActualsChangeOrders),
      ]),
    ];

    // throw new Error('stop');
    // clean up the objects...not the most elegant or efficient way but they are small, im tired and it works
    allInvoices.forEach((invoiceId: string) => {
      if (
        invoiceBudgetActuals.invoice?.[invoiceId] &&
        Object.keys(invoiceBudgetActuals.invoice[invoiceId]).length === 0
      ) {
        delete invoiceBudgetActuals.invoice[invoiceId];
      }
      if (
        invoiceBudgetActualsChangeOrders?.[invoiceId] &&
        Object.keys(invoiceBudgetActualsChangeOrders[invoiceId]).length === 0
      ) {
        delete invoiceBudgetActualsChangeOrders[invoiceId];
      }
    });
    return {
      budgetActuals,
      budgetActualsChangeOrders,
      invoiceBudgetActuals,
      invoiceBudgetActualsChangeOrders,
      billTitle,
      numChangeOrders:
        Object.keys(budgetActualsChangeOrders).length > 1 // this will always have the `profitTaxesLiability` key, just all zeros if no change orders
          ? Object.keys(budgetActualsChangeOrders).length
          : null,
      numInvoices: projectInvoices.length > 0 ? projectInvoices.length : null,
    };
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message);
  }
};

/**
 *
 * @param {Object} param0 Object
 * @param {FormState} param0.budget - the currentActuals at the point this function is called
 * @returns Various totals, totals by division, by subDivion. These come in three forms
 * totals including any change orders, just the change orders, and totals without the change orders.
 */
export const calculateTotals = ({
  budget,
  isChangeOrder,
}: {
  budget: CurrentActualsV2 | CurrentActualsChangeOrdersV2 | BudgetTotalsV2;
  isChangeOrder: boolean;
}): AggregatedBudgetTotals => {
  // calculate the totals by division and subdivision for all data including change orders
  // likely won't need this, but having it is low cost and it may come in handy to have
  // this calculation done

  let amount: number;
  let total = 0;
  const changeOrderTotals: { [changeOrderId: string]: number } = {};

  // TODO rearrange total value calculation
  if (isChangeOrder) {
    Object.entries(budget as CurrentActualsChangeOrdersV2).forEach(
      ([changeOrderId, changeOrder]) => {
        if (changeOrderId !== 'profitTaxesLiability') {
          changeOrderTotals[changeOrderId] = Object.values(changeOrder)
            .map((costCodeObj) => {
              return +costCodeObj.totalAmt.replaceAll(',', '');
            })
            .reduce((acc, curr) => {
              return acc + curr;
            }, 0);
        }
      }
    );
    total = Object.values(changeOrderTotals).reduce(
      (acc, curr) => acc + curr,
      0
    );
  } else {
    total = Object.values(budget as CurrentActualsV2 | BudgetTotalsV2)
      .map((costCodeObj: CurrentActualsItemV2 | BudgetTotalItemV2) => {
        amount = isBudgetTotalItemV2(costCodeObj)
          ? +costCodeObj.value.replaceAll(',', '')
          : +costCodeObj.totalAmt.replaceAll(',', '');
        return +formatNumber(amount, false, true);
      })
      .reduce((acc, curr) => {
        return acc + curr;
      }, 0);
  }

  return {
    total: formatNumber(total.toFixed(2)),
    changeOrderTotals,
    divisionTotals: {},
    subDivisionTotals: {},
  };
};

export const createClientBillLineItemObject = ({
  vendor,
  costCode,
  description,
  rateAmt,
  qtyAmt,
}: {
  vendor: string;
  costCode: string;
  description: string;
  rateAmt: string;
  qtyAmt: string;
}) => {
  return [
    {
      vendor,
      costCode,
      description,
      rateAmt,
      qtyAmt,
      totalAmt: +rateAmt * +qtyAmt,
    },
  ];
};

export const createFullBudgetObject = ({
  budgetTotals,
  totalAmt,
  costCode,
  qtyAmt,
  rateAmt,
  description,
  vendor,
  changeOrder,
  group,
}: {
  budgetTotals: BudgetTotalsV2;
  totalAmt: string;
  costCode: string;
  qtyAmt?: string;
  rateAmt?: string;
  vendor: string;
  description: string;
  changeOrder: string | null;
  group: 'Labor and Fees' | 'Invoices' | 'Change Orders';
}): CurrentActualsItemV2 => {
  const { recursiveLevel, costCodeName } = budgetTotals[String(costCode)] ||
    budgetTotals[(+costCode).toFixed(4)] || {
      recursiveLevel: [],
      costCodeName: '',
    };

  return {
    totalAmt,
    changeOrder,
    recursiveLevel,
    costCodeName,
    qtyAmt,
    rateAmt,
    vendor,
    description,
    group,
  };
};

const handleLineItem = ({
  lineItems,
  vendorName,
  uuid,
  isCredit,
  isInvoice,
  isLaborFee,
  budgetTotals,
  costCodeNameList,
  budgetActuals,
  budgetActualsChangeOrders,
  invoiceBudgetActuals,
  invoiceBudgetActualsChangeOrders,
}: {
  lineItems: InvoiceLineItem | LaborLineItem;
  vendorName: string;
  uuid: string;
  isCredit: boolean;
  isInvoice: boolean;
  isLaborFee: boolean;
  budgetTotals: BudgetTotalsV2;
  costCodeNameList: SelectMenuOptions[];
  budgetActuals: CurrentActualsV2;
  budgetActualsChangeOrders: CurrentActualsChangeOrdersV2;
  invoiceBudgetActuals: InvoiceCurrentActualsV2;
  invoiceBudgetActualsChangeOrders: InvoiceCurrentActualsChangeOrdersV2;
}) => {
  // loop through all line items for the current invoice
  Object.values(lineItems).forEach((item) => {
    // grab cost code, if a change order and amount for this line item
    const costCode = item.cost_code as string; // in order to run this function, cost_code was checked
    const changeOrder = item.change_order;

    let amount = +item.amount?.replaceAll(',', '');
    let amountInvoice = +item.amount?.replaceAll(',', '');

    if (
      Object.keys(budgetTotals).findIndex(
        (v) => v == costCode || v == (+costCode).toFixed(4)
      ) === -1
    )
      return;
    if (changeOrder) {
      // check if a change order exists with the current item costCode
      // check to make sure the costCode was filled was also filled
      // CHANGE ORDER
      let invoiceIds: string[] = [];
      let laborFeeIds: string[] = [];
      if (isInvoice) {
        invoiceIds = (
          budgetActualsChangeOrders as CurrentActualsChangeOrdersV2
        )[changeOrder.uuid]?.[costCode]?.invoiceIds
          ? ((budgetActualsChangeOrders as CurrentActualsChangeOrdersV2)[
              changeOrder.uuid
            ][costCode].invoiceIds as string[])
          : [];
      }
      if (isLaborFee) {
        laborFeeIds = (
          budgetActualsChangeOrders as CurrentActualsChangeOrdersV2
        )[changeOrder.uuid]?.[costCode]?.laborFeeIds
          ? ((budgetActualsChangeOrders as CurrentActualsChangeOrdersV2)[
              changeOrder.uuid
            ][costCode].laborFeeIds as string[])
          : [];
      }

      // if we know we are dealing with a change order initialize these objects
      // with the change order id. Treat change orders like their own stand alone budgets
      budgetActualsChangeOrders[changeOrder.uuid] =
        budgetActualsChangeOrders[changeOrder.uuid] || {};
      // init the invoice change order object
      invoiceBudgetActualsChangeOrders[changeOrder.uuid] =
        invoiceBudgetActualsChangeOrders[changeOrder.uuid] || {};
      invoiceBudgetActualsChangeOrders[changeOrder.uuid][uuid] =
        invoiceBudgetActualsChangeOrders[changeOrder.uuid][uuid] || {};

      amount = iterateAmountOnCostCode({
        budgetObj: budgetActualsChangeOrders,
        costCode,
        isCredit,
        isInvoice: false,
        isLaborFee: false,
        uuid,
        amount,
        changeOrder,
      });
      amountInvoice = iterateAmountOnCostCode({
        budgetObj: invoiceBudgetActualsChangeOrders,
        costCode,
        isCredit,
        isInvoice,
        isLaborFee,
        uuid,
        amount: amountInvoice,
        changeOrder,
      });

      const budgetObject = createFullBudgetObject({
        budgetTotals,
        totalAmt: formatNumber(amount.toFixed(2)),
        costCode,
        qtyAmt: '1',
        rateAmt: formatNumber(amount.toFixed(2)),
        description: getCostCodeDescriptionFromNumber(
          costCode,
          costCodeNameList
        ),
        vendor: vendorName,
        changeOrder: changeOrder.name,
        group: 'Change Orders',
      });
      const budgetObjectInvoice = createFullBudgetObject({
        budgetTotals,
        totalAmt: formatNumber(amount.toFixed(2)),
        costCode,
        qtyAmt: '1',
        rateAmt: formatNumber(amount.toFixed(2)),
        description: getCostCodeDescriptionFromNumber(
          costCode,
          costCodeNameList
        ),
        vendor: vendorName,
        changeOrder: changeOrder.name,
        group: 'Change Orders',
      });
      // the current line item amount
      budgetActualsChangeOrders[changeOrder.uuid][costCode] = budgetObject;
      invoiceBudgetActualsChangeOrders[changeOrder.uuid][uuid][costCode] =
        budgetObjectInvoice;
      // add this to the invoice object as well
      // need to updat the iterate amount function to include the invoice object
      if (isInvoice && invoiceIds) {
        invoiceIds.push(uuid);
      }
      if (isLaborFee && laborFeeIds) {
        laborFeeIds.push(uuid);
      }
      if (isInvoice) {
        (budgetActualsChangeOrders as CurrentActualsChangeOrdersV2)[
          changeOrder.uuid
        ][costCode] = {
          ...(budgetActualsChangeOrders as CurrentActualsChangeOrdersV2)[
            changeOrder.uuid
          ][costCode],
          invoiceIds: [...new Set(invoiceIds)],
        };
      }
      if (isLaborFee) {
        (budgetActualsChangeOrders as CurrentActualsChangeOrdersV2)[
          changeOrder.uuid
        ][costCode] = {
          ...(budgetActualsChangeOrders as CurrentActualsChangeOrdersV2)[
            changeOrder.uuid
          ][costCode],
          laborFeeIds: [...new Set(laborFeeIds)],
        };
      }
    }

    // NOT CHANGE ORDER
    else {
      let invoiceIds: string[] = [];
      let laborFeeIds: string[] = [];
      if (isInvoice) {
        invoiceIds = budgetActuals[costCode]?.invoiceIds
          ? (budgetActuals[costCode].invoiceIds as string[])
          : [];
      }
      if (isLaborFee) {
        laborFeeIds = budgetActuals[costCode]?.laborFeeIds
          ? (budgetActuals[costCode].laborFeeIds as string[])
          : [];
      }

      // here we are iterating the overall currenActuals so we just force
      // isInvoice and isLaborFee to false even though it would be one of those two.
      // We only care about the invoice or laborFee for the `amountInvoice`
      amount = iterateAmountOnCostCode({
        budgetObj: budgetActuals,
        costCode,
        isCredit,
        isInvoice: false,
        isLaborFee: false,
        uuid,
        amount,
        changeOrder: null,
      });

      amountInvoice = iterateAmountOnCostCode({
        budgetObj: invoiceBudgetActuals,
        costCode,
        isCredit,
        isInvoice,
        isLaborFee,
        uuid,
        amount: amountInvoice,
        changeOrder: null,
      });

      const budgetObj = createFullBudgetObject({
        budgetTotals,
        totalAmt: formatNumber(amount.toFixed(2)),
        costCode,
        qtyAmt: '1',
        rateAmt: formatNumber(amount.toFixed(2)),
        description: getCostCodeDescriptionFromNumber(
          costCode,
          costCodeNameList
        ),
        vendor: vendorName,
        changeOrder: null,
        group: 'Invoices',
      });

      const budgetObjInvoice = createFullBudgetObject({
        budgetTotals,
        totalAmt: formatNumber(amountInvoice.toFixed(2)),
        costCode,
        qtyAmt: '1',
        rateAmt: formatNumber(amountInvoice.toFixed(2)),
        description: getCostCodeDescriptionFromNumber(
          costCode,
          costCodeNameList
        ),
        vendor: vendorName,
        changeOrder: null,
        group: 'Invoices',
      });

      budgetActuals[costCode] = budgetObj;

      if (isInvoice) {
        invoiceBudgetActuals.invoice[uuid][costCode] = budgetObjInvoice;
        if (invoiceIds) {
          invoiceIds.push(uuid);
        }
        budgetActuals[costCode] = {
          ...budgetActuals[costCode],
          invoiceIds: [...new Set(invoiceIds)],
        };
      }
      if (isLaborFee) {
        invoiceBudgetActuals.laborFee[uuid][costCode] = budgetObjInvoice;
        if (laborFeeIds) {
          laborFeeIds.push(uuid);
        }
        budgetActuals[costCode] = {
          ...budgetActuals[costCode],
          laborFeeIds: [...new Set(laborFeeIds)],
        };
      }
    }
  });
};

const handleWholeInvoice = ({
  invoice,
  budgetTotals,
  costCodeNameList,
  budgetActuals,
  budgetActualsChangeOrders,
  invoiceBudgetActuals,
  invoiceBudgetActualsChangeOrders,
}: {
  invoice: MakeRequired<InvoiceItem, 'processedData'>;
  budgetTotals: BudgetTotalsV2;
  costCodeNameList: SelectMenuOptions[];
  budgetActuals: CurrentActualsV2;
  budgetActualsChangeOrders: CurrentActualsChangeOrdersV2;
  invoiceBudgetActuals: InvoiceCurrentActualsV2;
  invoiceBudgetActualsChangeOrders: InvoiceCurrentActualsChangeOrdersV2;
}) => {
  // grab cost code, if a change order and amount for the whole invoice
  // always subtract the tax from the amount.
  const costCode = invoice.processedData.cost_code as string;

  if (
    Object.keys(budgetTotals).findIndex(
      (v) => v == costCode || v == (+costCode).toFixed(4)
    ) === -1
  )
    return;

  const changeOrder: { name: string; uuid: string } | null =
    invoice.processedData?.change_order;
  let amount =
    +invoice.processedData.total_amount.replaceAll(',', '') -
    +invoice.processedData.total_tax_amount.replaceAll(',', '');

  let amountInvoice =
    +invoice.processedData.total_amount.replaceAll(',', '') -
    +invoice.processedData.total_tax_amount.replaceAll(',', '');

  // CHANGE ORDER
  if (changeOrder) {
    // init the invoice change order object on these objects
    budgetActualsChangeOrders[changeOrder.uuid] =
      budgetActualsChangeOrders[changeOrder.uuid] || {};
    invoiceBudgetActualsChangeOrders[changeOrder.uuid] =
      invoiceBudgetActualsChangeOrders[changeOrder.uuid] || {};

    invoiceBudgetActualsChangeOrders[changeOrder.uuid][invoice.doc_id] =
      invoiceBudgetActualsChangeOrders[changeOrder.uuid][invoice.doc_id] || {};

    amount = iterateAmountOnCostCode({
      budgetObj: budgetActualsChangeOrders,
      costCode,
      isCredit: invoice.processedData.is_credit,
      isInvoice: false,
      isLaborFee: false,
      uuid: invoice.doc_id,
      amount,
      changeOrder,
    });
    amountInvoice = iterateAmountOnCostCode({
      budgetObj: invoiceBudgetActualsChangeOrders,
      costCode,
      isCredit: invoice.processedData.is_credit,
      isInvoice: true,
      isLaborFee: false,
      uuid: invoice.doc_id,
      amount: amountInvoice,
      changeOrder,
    });

    const invoiceIds = budgetActualsChangeOrders[changeOrder.uuid]?.[costCode]
      ?.invoiceIds
      ? budgetActualsChangeOrders[changeOrder.uuid][costCode].invoiceIds
      : [];
    const budgetObj = createFullBudgetObject({
      budgetTotals,
      totalAmt: formatNumber(amount.toFixed(2)),
      costCode,
      qtyAmt: '1',
      rateAmt: formatNumber(amount.toFixed(2)),
      description: getCostCodeDescriptionFromNumber(costCode, costCodeNameList),
      vendor: invoice.processedData.vendor?.name ?? '',
      changeOrder: changeOrder.name,
      group: 'Change Orders',
    });
    const budgetObjInvoice = createFullBudgetObject({
      budgetTotals,
      totalAmt: formatNumber(amountInvoice.toFixed(2)),
      costCode,
      qtyAmt: '1',
      rateAmt: formatNumber(amountInvoice.toFixed(2)),
      description: getCostCodeDescriptionFromNumber(costCode, costCodeNameList),
      vendor: invoice.processedData.vendor?.name ?? '',
      changeOrder: changeOrder.name,
      group: 'Change Orders',
    });
    budgetActualsChangeOrders[changeOrder.uuid][costCode] = budgetObj;
    invoiceBudgetActualsChangeOrders[changeOrder.uuid][invoice.doc_id][
      costCode
    ] = budgetObjInvoice;
    if (invoiceIds) {
      invoiceIds.push(invoice.doc_id);
    }
    budgetActualsChangeOrders[changeOrder.uuid][costCode] = {
      ...budgetActualsChangeOrders[changeOrder.uuid][costCode],
      invoiceIds: [...new Set(invoiceIds)],
    };
  }
  // NOT A CHANGE ORDER
  else {
    // collect change orders and normal data separatly
    const invoiceIds = budgetActuals[costCode]?.invoiceIds
      ? budgetActuals[costCode].invoiceIds
      : [];
    amount = iterateAmountOnCostCode({
      budgetObj: budgetActuals,
      costCode,
      isCredit: invoice.processedData.is_credit,
      isInvoice: false,
      isLaborFee: false,
      uuid: invoice.doc_id,
      amount,
      changeOrder,
    });

    amountInvoice = iterateAmountOnCostCode({
      budgetObj: invoiceBudgetActuals,
      costCode,
      isCredit: invoice.processedData.is_credit,
      isInvoice: true,
      isLaborFee: false,
      uuid: invoice.doc_id,
      amount: amountInvoice,
      changeOrder,
    });

    const budgetObj = createFullBudgetObject({
      budgetTotals,
      totalAmt: formatNumber(amount.toFixed(2)),
      costCode,
      qtyAmt: '1',
      rateAmt: formatNumber(amount.toFixed(2)),
      description: getCostCodeDescriptionFromNumber(costCode, costCodeNameList),
      vendor: invoice.processedData.vendor?.name ?? '',
      changeOrder: null,
      group: 'Invoices',
    });
    const budgetObjInvoice = createFullBudgetObject({
      budgetTotals,
      totalAmt: formatNumber(amountInvoice.toFixed(2)),
      costCode,
      qtyAmt: '1',
      rateAmt: formatNumber(amountInvoice.toFixed(2)),
      description: getCostCodeDescriptionFromNumber(costCode, costCodeNameList),
      vendor: invoice.processedData.vendor?.name ?? '',
      changeOrder: null,
      group: 'Invoices',
    });
    budgetActuals[costCode] = budgetObj;
    invoiceBudgetActuals.invoice[invoice.doc_id][costCode] = budgetObjInvoice;
    if (invoiceIds) {
      invoiceIds.push(invoice.doc_id);
    }
    budgetActuals[costCode] = {
      ...budgetActuals[costCode],
      invoiceIds: [...new Set(invoiceIds)],
    };
  }
};

const handleError = ({
  invoice,
  dispatch,
}: {
  invoice: MakeRequired<InvoiceItem, 'processedData'>;
  dispatch: ThunkDispatch<unknown, unknown, AnyAction>;
}) => {
  console.error(
    `Some invoices don't have necessary information: 
        Vendor: ${invoice.processedData.vendor?.name}; ID: ${invoice.processedData.invoice_id}
        Amount: ${invoice.processedData.total_amount}`
  );
  dispatch(
    uiActions.setModalContent({
      openModal: true,
      message: `The invoice (Vendor: ${invoice.processedData.vendor?.name}; ID: ${invoice.processedData.invoice_id});
        Amount: ${invoice.processedData.total_amount} is missing 
        necessary information such as cost code, total, and/or tax. 
        You cannot build a client's bill without all necessary information.`,
      title: 'Warning',
    })
  );
  throw new Error('An invoice is missing necessary information');
};

type BudgetObject =
  | CurrentActualsV2
  | CurrentActualsChangeOrdersV2
  | InvoiceCurrentActualsV2
  | InvoiceCurrentActualsChangeOrdersV2;

type ChangeOrder = { [invoiceId: string]: CurrentActualsV2 } | CurrentActualsV2;

const iterateAmountOnCostCode = ({
  budgetObj,
  costCode,
  isCredit,
  isInvoice,
  isLaborFee,
  uuid,
  amount,
  changeOrder,
}: {
  budgetObj: BudgetObject;
  costCode: string;
  isCredit: boolean;
  isInvoice: boolean;
  isLaborFee: boolean;
  uuid: string;
  amount: number;
  changeOrder: { uuid: string; name: string } | null;
}): number => {
  const existingBudgetData = getExistingBudgetData(
    budgetObj,
    changeOrder,
    uuid,
    costCode,
    isInvoice,
    isLaborFee
  );

  if (existingBudgetData) {
    return calculateAmount(isCredit, existingBudgetData, amount);
  } else {
    return isCredit ? -amount : amount;
  }
};

const getExistingBudgetData = (
  budgetObj: BudgetObject,
  changeOrder: { uuid: string; name: string } | null,
  uuid: string,
  costCode: string,
  isInvoice: boolean,
  isLaborFee: boolean
): CurrentActualsItemV2 => {
  if (changeOrder) {
    const coBudget = budgetObj[changeOrder.uuid] as ChangeOrder;
    if (uuid in coBudget) {
      return (coBudget as { [invoiceId: string]: CurrentActuals })[uuid][
        costCode
      ];
    }
    return (coBudget as CurrentActualsV2)[costCode];
  }
  if (isInvoice) {
    return (budgetObj as InvoiceCurrentActualsV2).invoice[uuid][costCode];
  }
  if (isLaborFee) {
    return (budgetObj as InvoiceCurrentActualsV2).laborFee[uuid][costCode];
  }
  return (budgetObj as CurrentActualsV2)[costCode];
};

const calculateAmount = (
  isCredit: boolean,
  existingActuals: CurrentActualsItemV2,
  amount: number
): number => {
  const processedAmount = +existingActuals.totalAmt.replaceAll(',', '');
  return isCredit ? processedAmount - amount : processedAmount + amount;
};

export const calculateBillTotal = ({
  projectSummary,
  subTotal,
}: {
  projectSummary: ProjectSummaryItem;
  subTotal: string | number;
}) => {
  let subTotalNumber: number;
  if (typeof subTotal === 'string') {
    subTotalNumber = +subTotal.replaceAll(',', '');
  } else {
    subTotalNumber = subTotal;
  }
  const profitPercent = projectSummary.profitPercent as string;
  const boTaxPercent = projectSummary.boTax as string;
  const salesTaxPercent = projectSummary.salesTax as string;
  const liabilityRate = projectSummary.insuranceRate as string;

  const profit = subTotalNumber * (+profitPercent / 100);
  const liability = ((subTotalNumber + profit) / 1000) * +liabilityRate;
  const boTax = (subTotalNumber + profit + liability) * (+boTaxPercent / 100);
  const salesTax =
    (subTotalNumber + profit + liability + boTax) * (+salesTaxPercent / 100);

  const total = subTotalNumber + profit + liability + boTax + salesTax;

  return {
    profit: +profit.toFixed(2),
    liability: +liability.toFixed(2),
    boTax: +boTax.toFixed(2),
    salesTax: +salesTax.toFixed(2),
    total: +total.toFixed(2),
  };
};

// Extracted calculation logic
export const getBillProfitTaxes = ({
  projectSummary,
  total,
}: {
  projectSummary: ProjectSummaryItem;
  total: string | number;
}): ProfitTaxes => {
  return calculateBillTotal({
    projectSummary,
    subTotal: total,
  });
};

// Extracted object creation logic
export const createBillProfitTaxesObject = ({
  profitTaxes,
  projectSummary,
  prefix = '',
}: {
  profitTaxes: ProfitTaxes;
  projectSummary: ProjectSummaryItem;
  prefix: string;
}) => {
  const descriptions = {
    profit: { name: 'Overhead and Profit', key: 'profitPercent' },
    liability: {
      name: "Builder's Risk and Liability Insurance (Rate per $1,000)",
      key: 'insuranceRate',
    },
    boTax: { name: 'Business and Occupation Tax', key: 'boTax' },
    salesTax: { name: 'Sales Tax', key: 'salesTax' },
  };

  return Object.entries(descriptions).reduce(
    (acc: BudgetProfitTaxesObject, [key, description]) => {
      const totalsKey = key as keyof ProfitTaxes;
      const projectSummaryKey = description.key as keyof ProjectSummaryItem;
      const actualKey = `${prefix}${totalsKey}`;
      acc[actualKey] = {
        totalAmt: profitTaxes[totalsKey],
        rateAmt: projectSummary[projectSummaryKey] as string,
        qtyAmt: '1',
        description: description.name,
      };
      return acc;
    },
    {}
  );
};

// Extracted actuals updating logic
export const updateActuals = ({
  billProfitTaxesObject,
  actuals,
  summaryCostCodes,
  budgetTotals,
}: {
  billProfitTaxesObject: BudgetProfitTaxesObject;
  actuals: CurrentActualsV2 | CurrentActualsChangeOrdersV2 | null;
  summaryCostCodes: Record<string, string>;
  budgetTotals: BudgetTotalsV2;
}) => {
  if (!actuals) return;
  Object.entries(billProfitTaxesObject).forEach(([key, value]) => {
    actuals[summaryCostCodes[key]] = createFullBudgetObject({
      budgetTotals,
      costCode: summaryCostCodes[key],
      totalAmt: formatNumber(value.totalAmt.toFixed(2)),
      description: value.description,
      qtyAmt: value.qtyAmt,
      rateAmt: formatNumber(parseFloat(value.rateAmt).toFixed(2)),
      vendor: '',
      changeOrder: null,
      group: key.includes('changeOrder') ? 'Change Orders' : 'Invoices',
    });
  });
};
