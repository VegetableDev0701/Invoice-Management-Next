import { useMemo } from 'react';
import {
  ChangeOrderContent,
  ChangeOrderContentItem,
  ChangeOrderTableRows,
} from '../models/changeOrderModel';
import {
  InvoiceLineItemItem,
  Invoices,
  InvoiceLineItem,
  ProcessedInvoiceData,
} from '../models/invoiceDataModels';
import {
  ChangeOrderSummary,
  LaborLineItem,
  LaborLineItemItem,
  LaborSummary,
  LaborSummaryItem,
} from '../models/summaryDataModel';
import { formatNumber } from './formatter';
import { sortTableData } from './tableHelpers';

export const createChangeOrderContentFromLaborFees = ({
  laborFeeSummary,
}: {
  laborFeeSummary: LaborSummaryItem;
  changeOrdersSummary: ChangeOrderSummary;
}) => {
  const result = Object.entries(laborFeeSummary.line_items).reduce(
    (
      acc: { [changeOrderId: string]: ChangeOrderContent },
      [lineItemNumber, lineItemObj]
    ) => {
      if (lineItemObj.change_order) {
        const changeOrderId = lineItemObj.change_order.uuid;
        const laborId = laborFeeSummary.uuid;
        const itemKey = `${lineItemNumber}::${laborId}`;
        const content: ChangeOrderContentItem = {
          qtyAmt: lineItemObj.number_of_hours,
          description: lineItemObj.work_description,
          costCode: lineItemObj.cost_code,
          rateAmt: laborFeeSummary.rate,
          uuid: laborFeeSummary.uuid,
          vendor: laborFeeSummary.name,
          totalAmt: formatNumber(
            +laborFeeSummary.rate * +lineItemObj.number_of_hours
          ),
          isLaborFee: true,
          isInvoice: null,
        };

        acc[changeOrderId] = acc[changeOrderId] || {};
        acc[changeOrderId][itemKey] = content;
      }
      return acc;
    },
    {}
  );

  return result;
};

export const createRemoveCoFromData = ({
  allInvoices,
  changeOrdersSummary,
  laborSummary,
  removeChangeOrderIds,
}: {
  allInvoices: Invoices;
  changeOrdersSummary: ChangeOrderSummary;
  laborSummary: LaborSummary;
  removeChangeOrderIds: string[];
}) => {
  const deleteCOFromDataObj = createDeleteCOFromDataObj({
    changeOrdersSummary,
    removeChangeOrderIds,
  });
  const { invoicesToUpdate, laborToUpdate } = createDataToUpdateObj({
    deleteCOFromDataObj,
    allInvoices,
    laborSummary,
  });

  const updateProcessedData = createUpdateProcessedData({ invoicesToUpdate });

  return { invoicesToUpdate, updateProcessedData, laborToUpdate };
};

const createDeleteCOFromDataObj = ({
  changeOrdersSummary,
  removeChangeOrderIds,
}: {
  changeOrdersSummary: ChangeOrderSummary;
  removeChangeOrderIds: string[];
}) => {
  const deleteCOFromDataObj = Object.entries(changeOrdersSummary)
    .filter(([_, changeOrderObj]) =>
      removeChangeOrderIds.includes(changeOrderObj.uuid)
    )
    .reduce(
      (acc: { [uuid: string]: string[] }, [changeOrderId, changeOrderObj]) => {
        const uuids = [
          ...new Set(
            Object.values(changeOrderObj.content).map((content) => content.uuid)
          ),
        ];
        uuids.forEach((uuid) => {
          if (acc[uuid]) {
            acc[uuid].push(changeOrderId);
          } else {
            acc[uuid] = [changeOrderId];
          }
        });
        return acc;
      },
      {}
    );

  return deleteCOFromDataObj;
};

const createDataToUpdateObj = ({
  deleteCOFromDataObj,
  allInvoices,
  laborSummary,
}: {
  deleteCOFromDataObj: {
    [uuid: string]: string[];
  };
  allInvoices: Invoices;
  laborSummary: LaborSummary;
}) => {
  const invoicesToUpdate: Invoices = {};
  const laborToUpdate: LaborSummary = {};
  Object.entries(deleteCOFromDataObj).forEach(([uuid, changeOrderIds]) => {
    if (allInvoices[uuid]) {
      const currentInvoiceProcessedData = allInvoices[uuid]
        .processedData as ProcessedInvoiceData;
      // can't assign change orders to line items AND the whole invoice
      // whole invoice check
      if (currentInvoiceProcessedData.change_order !== null) {
        invoicesToUpdate[uuid] = {
          ...allInvoices[uuid],
          processedData: {
            ...currentInvoiceProcessedData,
            change_order: null,
          },
        };
      }

      // an invoice cannot have a change order on the whole invoice AND
      // a line item so if we reach this point, we know the change order exists on
      // the line item. Running the check just for an extra layer of protection
      else if (
        currentInvoiceProcessedData.line_items !== null &&
        Object.keys(currentInvoiceProcessedData.line_items as InvoiceLineItem) // empty object check
          .length > 0
      ) {
        let lineItems =
          currentInvoiceProcessedData.line_items as InvoiceLineItem;
        const updatedLineItems: InvoiceLineItem = Object.fromEntries(
          Object.entries(lineItems).map(
            ([itemId, item]: [string, InvoiceLineItemItem]) => {
              if (
                item.change_order !== null &&
                changeOrderIds.includes(item.change_order.uuid)
              ) {
                return [itemId, { ...lineItems[itemId], change_order: null }];
              } else {
                return [itemId, item];
              }
            }
          )
        );

        invoicesToUpdate[uuid] = {
          ...allInvoices[uuid],
          processedData: {
            ...currentInvoiceProcessedData, // processedData is optional but at this point we know it to exist
            line_items: updatedLineItems,
          },
        };
      }
    }
    if (laborSummary[uuid]) {
      let lineItems = laborSummary[uuid].line_items as LaborLineItem;
      const updatedLineItems: LaborLineItem = Object.fromEntries(
        Object.entries(lineItems).map(
          ([itemId, item]: [string, LaborLineItemItem]) => {
            if (
              item.change_order !== null &&
              changeOrderIds.includes(item.change_order.uuid)
            ) {
              return [itemId, { ...lineItems[itemId], change_order: null }];
            } else {
              return [itemId, item];
            }
          }
        )
      );

      laborToUpdate[uuid] = {
        ...laborSummary[uuid],
        line_items: updatedLineItems,
      };
    }
  });
  return { invoicesToUpdate, laborToUpdate };
};

const createUpdateProcessedData = ({
  invoicesToUpdate,
}: {
  invoicesToUpdate: Invoices;
}) => {
  const updateProcessedData = Object.entries(invoicesToUpdate).reduce(
    (
      acc: { [invoiceId: string]: { processedData: ProcessedInvoiceData } },
      [invoiceId, invoiceItem]
    ) => {
      const { processedData } = invoiceItem;
      acc[invoiceId] = {
        processedData: processedData as ProcessedInvoiceData,
      };
      return acc;
    },
    {}
  );
  return updateProcessedData;
};

// custom hook
export const useCreateChangeOrderTable = ({
  groupedRowCategories,
  clickedChangeOrderId,
  sortKey,
  sortOrder,
  tableData,
}: {
  groupedRowCategories: string[];
  clickedChangeOrderId: string;
  sortKey: string | null;
  sortOrder: 'asc' | 'desc';
  tableData: ChangeOrderSummary | null;
}) => {
  const groupedRows = useMemo(() => {
    let tableRows: ChangeOrderTableRows | null = {};
    let groupedRows: Record<string, ChangeOrderContentItem[]> | null = {};

    if (tableData) {
      Object.entries(tableData).forEach(([changeOrderId, value]) => {
        // assert type here because if table data doesn't exist will be null, and if
        // it does will build this object
        (tableRows as ChangeOrderTableRows)[changeOrderId] = Object.values(
          value.content as { [itemId: string]: ChangeOrderContentItem }
        );
      });
    } else {
      tableRows = null;
    }

    const rows =
      clickedChangeOrderId && tableRows
        ? tableRows[clickedChangeOrderId]
        : null;

    groupedRowCategories.forEach((category) => {
      if (!rows) {
        groupedRows = null;
      } else if (sortKey === null) {
        if (category.toLowerCase().includes('labor') && groupedRows !== null) {
          groupedRows[category] = rows.filter((row) => row.isLaborFee);
        } else if (
          category.toLowerCase().includes('invoice') &&
          groupedRows !== null
        ) {
          groupedRows[category] = rows.filter((row) => row.isInvoice);
        }
      } else {
        if (category.toLowerCase().includes('labor') && groupedRows !== null) {
          groupedRows[category] = sortTableData(
            rows.filter((row) => row.isLaborFee),
            sortKey,
            sortOrder
          );
        } else if (
          category.toLowerCase().includes('invoice') &&
          groupedRows !== null
        ) {
          groupedRows[category] = sortTableData(
            rows.filter((row) => row.isInvoice),
            sortKey,
            sortOrder
          );
        } else {
          groupedRows = null;
        }
      }
    });
    return groupedRows;
  }, [tableData, sortKey, sortOrder, clickedChangeOrderId]);

  return groupedRows;
};
