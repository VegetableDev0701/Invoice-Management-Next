import { Items } from '../models/formDataModel';
import { BoundingBox, InvoiceTableRow } from '../models/invoiceDataModels';
import { ChangeOrderSummary } from '../models/summaryDataModel';

export function getCurrentInvoiceData(
  item: Items,
  currentData: InvoiceTableRow
) {
  if (item.id === 'invoice-number') {
    return {
      ...item,
      ...{ value: currentData.invoice_id },
    };
  } else if (item.id === 'vendor-name') {
    return {
      ...item,
      ...{ value: currentData.vendor_name },
    };
  } else if (item.id === 'project-name') {
    return {
      ...item,
      ...{ value: currentData.project },
    };
  } else if (item.id === 'cost-code') {
    return {
      ...item,
      ...{ value: currentData.cost_code?.[0] },
    };
  } else if (item.id === 'total-tax') {
    return {
      ...item,
      ...{ value: currentData.total_tax_amount },
    };
  } else if (item.id === 'invoice-total') {
    return {
      ...item,
      ...{ value: currentData.total_amount },
    };
  } else if (item.id === 'change-order') {
    return {
      ...item,
      ...{
        value: currentData?.change_order?.name
          ? currentData.change_order.name
          : 'None',
      },
    };
  } else if (item.id === 'approver') {
    return {
      ...item,
      ...{ value: currentData.approver },
    };
  } else if (item.id === 'date-received') {
    if (currentData?.date_received) {
      const reFormattedDate = currentData.date_received;
      return {
        ...item,
        ...{ value: reFormattedDate },
      };
    }
    return { ...item };
  } else if (item.id === 'credit') {
    return {
      ...item,
      ...{ value: currentData.is_credit },
    };
  } else if (item.id === 'line-item-toggle') {
    return {
      ...item,
      ...{ value: currentData.line_items_toggle },
    };
  } else {
    return item;
  }
}

// export function processLineItems(
//   lineItems: {
//     [key: string]: string | null | number | { [key: string]: number[] };
//   }[]
// ) {
//   const items: {
//     [key: number]: {
//       type: string;
//       value: string;
//       boundingBox: { [key: string]: number[] };
//       page: number;
//       topHeight: number;
//     };
//   } = {};
//   let count = 1;
//   lineItems?.forEach((item, i) => {
//     if (!lineItems) return;
//     if (
//       item.entity_type_minor === 'description' ||
//       item.entity_type_minor === 'amount' ||
//       item.entity_type_minor === null
//     ) {
//       const page = item.page_reference as number;
//       const boundingBox = item.bounding_box as { [key: string]: number[] };
//       const topHeight = boundingBox['ul'][1];
//       items[count] = {
//         type: item.entity_type_minor as string,
//         value: (item.entity_value_raw as string).replaceAll("'", '`'),
//         page,
//         boundingBox,
//         topHeight,
//       };
//       count++;
//     }
//   });
//   if (Object.keys(items).length === 0) {
//     return null;
//   } else {
//     return items;
//   }
// }

export function getChangeOrderIdFromName({
  changeOrdersSummary,
  changeOrderName,
}: {
  changeOrdersSummary: ChangeOrderSummary;
  changeOrderName: string;
}): string {
  const changeOrder = Object.values(changeOrdersSummary).find((co) => {
    return co.name === changeOrderName;
  });
  if (!changeOrder) {
    throw new Error(`${changeOrderName} was not found.`);
  }
  // there is no way we can have a change order name that that doesn't exist
  // and we are TODO forcing no duplicates in the C/O naming convention
  return changeOrder.uuid as string;
}

// export function getChangeOrderIdFromInvoiceId({
//   obj,
//   invoiceId,
// }: {
//   obj: ChangeOrderSummary;
//   invoiceId: string;
// }) {

//   for (let changeOrderId of Object.keys(obj)) {
//     let contentKeys = Object.keys(obj[changeOrderId].content).map(
//       (contentKey) => {
//         return contentKey.includes('::')
//           ? contentKey.split('::')[1]
//           : contentKey;
//       }
//     )
//     if (c)
//     // remove duplicates
//     contentKeys = [...new Set(contentKeys)]
//     if (
//       contentKeys.find(
//         (contentKey) => contentKey === invoiceId
//       )
//     ) {
//       return changeOrderId;
//     }
//   }
//   return null;
// }

export function createSectionBox({
  boundingBox,
  buffer,
}: {
  boundingBox: BoundingBox[] | null | undefined;
  buffer?: number;
}) {
  if (!boundingBox || boundingBox.length === 0) return null;
  let [x, y] = boundingBox[0].ul;
  let width = boundingBox[0].ur[0] - x;
  let height = boundingBox[0].lr[1] - y;
  if (buffer) {
    x = x - x * buffer;
    y = y - y * buffer;
    width = width + width * buffer;
    height = height + height * buffer;
  }
  const page = boundingBox[0].page;
  return { x, y, width, height, page };
}
