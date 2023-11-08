import { FormState, FormStateItem } from '../models/formStateModels';
import {
  InvoiceLineItem,
  InvoiceLineItemItem,
} from '../models/invoiceDataModels';
import { ChangeOrderSummary } from '../models/summaryDataModel';
import { isKeyOfLineItemItem } from '../models/types';
import { formatNumber } from './formatter';
import { getChangeOrderIdFromName } from './processInvoiceHelpers';

export const extractLineItems = ({
  formState,
  numLineItems,
}: {
  formState: FormState;
  numLineItems: number;
}) => {
  const lineItems = Object.fromEntries(
    Object.entries(formState).filter(([key]) => {
      const [number] = key.split('-');
      return (
        !isNaN(parseInt(number)) &&
        (!isNaN(parseInt(number)) ? parseInt(number) <= numLineItems : false)
      );
    })
  );
  const sortedLineItems = sortLineItems(lineItems);
  return sortedLineItems;
};

export const sortLineItems = <T extends { [key: string]: any }>(
  lineItems: T
): T => {
  const sortedKeys = Object.keys(lineItems).sort((a, b) => {
    const numA = parseInt(a.split('_').pop() as string);
    const numB = parseInt(b.split('_').pop() as string);
    return numA - numB;
  });

  // Construct the sorted object
  const sortedObj: Partial<T> = {};
  for (const key of sortedKeys) {
    sortedObj[key as keyof T] = lineItems[key as keyof T];
  }

  return sortedObj as T;
};

export const groupLineItems = ({
  lineItems,
  changeOrdersSummary,
  lineItemBoundingBoxes,
  laborRate,
}: {
  lineItems: { [key: string]: FormStateItem };
  changeOrdersSummary: ChangeOrderSummary;
  lineItemBoundingBoxes?: InvoiceLineItem;
  laborRate?: string;
}) => {
  const groupedLineItems: InvoiceLineItem = {};
  Object.entries(lineItems).forEach(([key, value]) => {
    const [prefix, ...suffixParts] = key.split('-');
    const lineItemKey = `line_item_${prefix}`;
    // hyphens screw up pythons naming convention and messes up the
    // data model in fastapi. i have been using a hyphen notation used for html
    // element ids, but have to switch here...fml
    const suffix = suffixParts.join('_') as keyof InvoiceLineItemItem;
    if (!groupedLineItems?.[lineItemKey]) {
      groupedLineItems[lineItemKey] = {} as InvoiceLineItemItem;
    }
    // check for a change order, if it exists (suffix === 'change_order' and all the other
    // conditionals in the first bit, keep it, otherwise take the data for the other
    // suffix values and set change_order to null
    if (suffix === 'change_order') {
      groupedLineItems[lineItemKey][suffix] =
        value?.value && value.value === 'None'
          ? null
          : {
              name: value.value as string,
              uuid: getChangeOrderIdFromName({
                changeOrdersSummary,
                changeOrderName: value.value as string,
              }),
            };
    } else if (suffix === 'cost_code') {
      groupedLineItems[lineItemKey][suffix] =
        value?.value && value.value === 'None' ? null : (value.value as string);
    } else {
      if (isKeyOfLineItemItem(suffix)) {
        // the above function checks for a proper key, hack workaround to TS
        (groupedLineItems[lineItemKey][suffix] as any) = value.value as string;
      }
    }
    if (
      lineItemBoundingBoxes &&
      lineItemBoundingBoxes?.[lineItemKey]?.bounding_box
    ) {
      groupedLineItems[lineItemKey].bounding_box =
        lineItemBoundingBoxes[lineItemKey].bounding_box;
      groupedLineItems[lineItemKey].page =
        lineItemBoundingBoxes[lineItemKey].page;
    }
    if (laborRate && suffix === 'number_of_hours') {
      groupedLineItems[lineItemKey].amount = formatNumber(
        +value.value * +laborRate
      );
    }
  });
  return groupedLineItems;
};
