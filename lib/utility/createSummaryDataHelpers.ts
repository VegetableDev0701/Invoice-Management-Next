import { SUMMARY_COST_CODES } from '../globals';
import {
  AggregatedBudgetTotals,
  CurrentActualsV2,
} from '../models/budgetCostCodeModel';
import { ChangeOrderContent } from '../models/changeOrderModel';
import {
  ChangeOrderData,
  ContractsData,
  InputElement,
  LaborData,
  ProjectFormData,
  VendorData,
  isInputElementWithAddressElements,
  isInputElementWithItems,
} from '../models/formDataModel';
import { FormState } from '../models/formStateModels';

import {
  ChangeOrderSummary,
  ChangeOrderSummaryItem,
  ClientBillSummaryItem,
  LaborLineItem,
  LaborSummaryItem,
  ProjectSummaryItem,
  VendorSummaryItem,
} from '../models/summaryDataModel';

import { formatNumber } from './formatter';
import { extractLineItems, groupLineItems } from './invoiceHelpers';

const getTargetValue = (
  targetId: string,
  inputElements: InputElement[]
): string | number | boolean | null | object | undefined => {
  for (const element of inputElements) {
    if (isInputElementWithItems(element)) {
      const foundItem = element.items.find((item) => item.id === targetId);
      if (foundItem) {
        return foundItem.value;
      }
    }
    if (isInputElementWithAddressElements(element)) {
      for (const addressElement of element.addressElements) {
        const foundItem = addressElement.items.find(
          (item) => item.id === targetId
        );
        if (foundItem) {
          return foundItem.value;
        }
      }
    }
  }
  return undefined;
};

export const setTargetValue = ({
  targetId,
  inputElements,
  setValue,
}: {
  targetId: string;
  inputElements: InputElement[];
  setValue: any;
}): void => {
  for (const element of inputElements) {
    if (isInputElementWithItems(element)) {
      const foundItem = element.items.find((item) => item.id === targetId);
      if (foundItem) {
        foundItem.value = setValue;
      }
    }
    if (isInputElementWithAddressElements(element)) {
      for (const addressElement of element.addressElements) {
        const foundItem = addressElement.items.find(
          (item) => item.id === targetId
        );
        if (foundItem) {
          foundItem.value = setValue;
        }
      }
    }
  }
};

function addMonths(dateString: string, months: number) {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export const createBillDateTitle = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}, ${month}`;
};

export const createSingleProjectSummary = (
  project: ProjectFormData,
  uuid: string
): ProjectSummaryItem => {
  const projectDetails = project.mainCategories[0];
  const ownerDetails = project.mainCategories[1];

  const startDate = getTargetValue(
    'estimated-start-date',
    projectDetails.inputElements
  );
  const numberMonths = getTargetValue(
    'estimated-completion-months',
    projectDetails.inputElements
  );

  const estimatedCompletion = addMonths(
    startDate as string,
    +(numberMonths as number)
  );

  const projectTableRow: ProjectSummaryItem = {
    projectName: getTargetValue(
      'project-name',
      projectDetails.inputElements
    ) as string,
    ownerName: `${
      getTargetValue('client-first-name', ownerDetails.inputElements) as string
    } ${getTargetValue('client-last-name', ownerDetails.inputElements)}`,
    ownerPhone: getTargetValue(
      'client-phone-number',
      ownerDetails.inputElements
    ) as string,
    ownerEmail: getTargetValue(
      'client-email',
      ownerDetails.inputElements
    ) as string,
    address: getTargetValue(
      'project-address',
      projectDetails.inputElements
    ) as string,
    city: getTargetValue(
      'city-project',
      projectDetails.inputElements
    ) as string,
    state: getTargetValue(
      'state-project',
      projectDetails.inputElements
    ) as string,
    zipCode: getTargetValue(
      'zip-code-project',
      projectDetails.inputElements
    ) as string,
    profitPercent: getTargetValue(
      'overhead-profit',
      projectDetails.inputElements
    ) as string,
    insuranceRate: getTargetValue(
      'insurance-rate',
      projectDetails.inputElements
    ) as string,
    boTax: getTargetValue('bo-tax', projectDetails.inputElements) as string,
    salesTax: getTargetValue(
      'sales-tax',
      projectDetails.inputElements
    ) as string,
    permitNumber: getTargetValue(
      'permit-number',
      projectDetails.inputElements
    ) as string,
    squareFeet: getTargetValue(
      'square-feet',
      projectDetails.inputElements
    ) as string,
    projectType: getTargetValue(
      'project-type',
      projectDetails.inputElements
    ) as string,
    contractAmt: getTargetValue(
      'contract-value',
      projectDetails.inputElements
    ) as string,
    projectSuper: getTargetValue(
      'project-supervisor',
      projectDetails.inputElements
    ) as string,
    projectSuperPhone: getTargetValue(
      'project-supervisor-phone-number',
      projectDetails.inputElements
    ) as string,
    estCompletionDate: estimatedCompletion,
    isActive: true,
    uuid: uuid,
  };

  return projectTableRow;
};

export const createSingleVendorSummary = (
  vendor: VendorData,
  uuid: string
): VendorSummaryItem => {
  const vendorDetails = vendor.mainCategories[0];
  const licenseInsDetails = vendor.mainCategories[1];
  const vendorTableRow: VendorSummaryItem = {
    vendorName: getTargetValue(
      'vendor-name',
      vendorDetails.inputElements
    ) as string,
    primaryContact: getTargetValue(
      'primary-contact',
      vendorDetails.inputElements
    ) as string,
    workPhone: getTargetValue(
      'work-phone',
      vendorDetails.inputElements
    ) as string,
    cellPhone: getTargetValue(
      'cell-phone',
      vendorDetails.inputElements
    ) as string,
    email: getTargetValue('email', vendorDetails.inputElements) as string,
    address: getTargetValue(
      'vendor-address',
      vendorDetails.inputElements
    ) as string,
    city: getTargetValue('city-vendor', vendorDetails.inputElements) as string,
    state: getTargetValue(
      'state-vendor',
      vendorDetails.inputElements
    ) as string,
    zipCode: getTargetValue(
      'zip-code-vendor',
      vendorDetails.inputElements
    ) as string,
    vendorType: getTargetValue(
      'vendor-type',
      vendorDetails.inputElements
    ) as string,
    businessLicNumber: getTargetValue(
      'business-license-number',
      licenseInsDetails.inputElements
    ) as string,
    businessLicExpirationDate: getTargetValue(
      'license-expiration-date',
      licenseInsDetails.inputElements
    ) as string,
    insuranceName: getTargetValue(
      'insurance-name',
      licenseInsDetails.inputElements
    ) as string,
    insuranceExpirationDate: getTargetValue(
      'insurance-expiration-date',
      licenseInsDetails.inputElements
    ) as string,
    insuranceCoverageAmt: getTargetValue(
      'insurance-coverage-amount',
      licenseInsDetails.inputElements
    ) as string,
    landiLicNumber: getTargetValue(
      'landi-number',
      licenseInsDetails.inputElements
    ) as string,
    landiExpirationDate: getTargetValue(
      'landi-expiration-date',
      licenseInsDetails.inputElements
    ) as string,
    workersCompExpirationDate: getTargetValue(
      'workers-compensation-expiration',
      licenseInsDetails.inputElements
    ) as string,
    bondCompanyName: getTargetValue(
      'bond-company-name',
      licenseInsDetails.inputElements
    ) as string,
    bondAmt: getTargetValue(
      'bond-amount',
      licenseInsDetails.inputElements
    ) as string,
    w9OnFile: getTargetValue(
      'w9-on-file',
      licenseInsDetails.inputElements
    ) as boolean,
    uuid: uuid,
  };

  return vendorTableRow;
};

export const createSingleLaborSummary = ({
  labor,
  laborId,
  formState,
  numLineItems,
  changeOrdersSummary,
}: {
  labor: LaborData;
  laborId: string;
  formState: FormState;
  numLineItems: number;
  changeOrdersSummary: ChangeOrderSummary;
}): LaborSummaryItem => {
  const laborDetails = labor.mainCategories[0];
  const payPeriod = getTargetValue(
    'pay-period',
    laborDetails.inputElements
  ) as string;
  const name = getTargetValue(
    'employee-name',
    laborDetails.inputElements
  ) as string;
  const rate = getTargetValue(
    'rate-per-hour',
    laborDetails.inputElements
  ) as string;

  // filter out line items from the rest of the labor data
  const lineItems = extractLineItems({
    formState,
    numLineItems,
  });

  // the labor line items
  const groupedLineItems = groupLineItems({
    lineItems,
    changeOrdersSummary,
    laborRate: rate,
  }) as unknown as LaborLineItem;

  // we know there will be hours so we can assert the type
  const hours = Object.values(groupedLineItems).map(
    (item) => item.number_of_hours && +item.number_of_hours
  ) as number[];

  const laborTableRow = {
    name: name,
    rate: rate,
    payPeriod: payPeriod,
    totalAmt: (
      +rate *
      hours.reduce((total, curr) => {
        return total + curr;
      }, 0)
    ).toFixed(2),
    uuid: laborId,
    clientBillId: null,
    currentLabor: true,
    line_items: groupedLineItems,
  };

  return laborTableRow;
};

export const createSingleChangeOrderSummary = ({
  changeOrder,
  changeOrderId,
  content,
}: {
  changeOrder: ChangeOrderData;
  changeOrderId: string;
  content?: ChangeOrderContent;
}): ChangeOrderSummaryItem => {
  const changeOrderDetails = changeOrder.mainCategories[0].inputElements;
  return {
    name: getTargetValue('change-order-name', changeOrderDetails) as string,
    projectName: getTargetValue('project-name', changeOrderDetails) as string,
    clientName: getTargetValue('client-name', changeOrderDetails) as string,
    address: getTargetValue('project-address', changeOrderDetails) as string,
    workDescription: getTargetValue(
      'change-order-work-description',
      changeOrderDetails
    ) as string,
    subtotalAmt: getTargetValue('subtotal', changeOrderDetails) as string,
    date: getTargetValue('change-order-date', changeOrderDetails) as string,
    uuid: changeOrderId,
    content: content || {},
  };
};

export const createSingleContractSummary = (contracts: ContractsData) => {
  const contractDetails = contracts.mainCategories[0].inputElements;
  return {
    vendor: getTargetValue('vendor-name', contractDetails) as string,
    projectName: getTargetValue('project-name', contractDetails) as string,
    workDescription: getTargetValue(
      'work-description',
      contractDetails
    ) as string,
    contractAmt: getTargetValue('contract-amount', contractDetails) as string,
    date: getTargetValue('contract-date', contractDetails) as string,
  };
};

export const createSingleClientBillSummary = ({
  subTotal,
  currentActuals,
  changeOrderTotals,
  totals,
  billTitle,
  uuid,
  numInvoices,
  numChangeOrders,
  laborFeeIds,
  invoiceIds,
}: {
  subTotal: string;
  billTitle: string;
  currentActuals: CurrentActualsV2;
  changeOrderTotals: AggregatedBudgetTotals;
  totals: AggregatedBudgetTotals;
  uuid: string;
  numInvoices: number | null | undefined;
  numChangeOrders: number | null | undefined;
  // totalLaborFeesAmount: number | undefined;
  laborFeeIds: string[];
  invoiceIds: string[];
}): ClientBillSummaryItem => {
  const profit = currentActuals[SUMMARY_COST_CODES.profit].totalAmt;
  const liability = currentActuals[SUMMARY_COST_CODES.liability].totalAmt;
  const budgetedSalesTax = currentActuals[SUMMARY_COST_CODES.salesTax].totalAmt;
  const boTax = currentActuals[SUMMARY_COST_CODES.boTax].totalAmt;

  // const subTotalOutput = subTotal
  //   ? formatNumber((+subTotal).toFixed(2))
  //   : '0.00';
  // const changeOrdersOutput = changeOrdersTotal ? changeOrdersTotal : '0.00';
  // const profitQty = subTotalOutput;
  // const profitOutput = formatNumber((+profit).toFixed(2)) || '0.00';

  // const insuranceLiabilityOutput = formatNumber((+liability).toFixed(2)) || '0.00';
  // const insuranceLiabilityQty =

  const changeOrdersGrandTotal = Object.entries(
    changeOrderTotals.changeOrderTotals as Record<string, number>
  ).reduce((acc, [_, total]) => {
    return acc + total;
  }, 0);

  return {
    billTitle,
    changeOrders: changeOrdersGrandTotal
      ? formatNumber(changeOrdersGrandTotal.toFixed(2))
      : '0.00',
    totalsByChangeOrder: changeOrderTotals.changeOrderTotals,
    subTotal: subTotal
      ? formatNumber((+subTotal.replaceAll(',', '')).toFixed(2))
      : '0.00',
    // profitQty: subTotal ? formatNumber((+subTotal).toFixed(2)) : '0.00',
    budgetedSalesTax:
      formatNumber((+budgetedSalesTax.replaceAll(',', '')).toFixed(2)) ||
      '0.00',
    profit: formatNumber((+profit.replaceAll(',', '')).toFixed(2)) || '0.00',
    insuranceLiability:
      formatNumber((+liability.replaceAll(',', '')).toFixed(2)) || '0.00',
    boTax: formatNumber((+boTax.replaceAll(',', '')).toFixed(2)) || '0.00',
    total: changeOrderTotals.changeOrderTotals
      ? formatNumber(
          (+totals.total.replaceAll(',', '') + changeOrdersGrandTotal).toFixed(
            2
          )
        )
      : totals.total,
    numInvoices: numInvoices ? numInvoices : 0,
    numChangeOrders: numChangeOrders ? numChangeOrders : 0,
    // totalLaborFeesAmount: totalLaborFeesAmount
    //   ? formatNumber((+totalLaborFeesAmount).toFixed(2))
    //   : '0.00',
    // totalSubInvoiceAmount: totalLaborFeesAmount
    //   ? formatNumber(
    //       +(+subTotal.replaceAll(',', '') - totalLaborFeesAmount).toFixed(2)
    //     )
    //   : formatNumber((+subTotal.replaceAll(',', '')).toFixed(2)),
    uuid,
    laborFeeIds,
    invoiceIds,
    // clientBillObj: {
    //   actuals: invoiceCurrentActuals,
    //   actualsChangeOrders: invoiceCurrentActualsChangeOrders,
    // },
  };
};
