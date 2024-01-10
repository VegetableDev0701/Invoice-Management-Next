import { useMemo } from 'react';

import { useAppSelector as useSelector } from '@/store/hooks';

import {
  BillWorkDescriptionV2,
  SubTotalsV2,
  WorkDescriptionContentItem,
} from '../models/clientBillModel';
import {
  CurrentActualsChangeOrdersV2,
  CurrentActualsV2,
  InvoiceCurrentActualsChangeOrdersV2,
} from '../models/budgetCostCodeModel';
import {
  ChangeOrderSummary,
  ClientBillSummaryItem,
  ProjectSummary,
  ProjectSummaryItem,
} from '../models/summaryDataModel';
import { SUMMARY_COST_CODES } from '../globals';
import { Items } from '../models/formDataModel';
import { FormStateV2 } from '../models/formStateModels';

export const useCreateClientBillWorkDescription = ({
  tableData,
  subTotals,
  clientBillSummary,
  changeOrderSummary,
  currentActualsChangeOrders,
  projectId,
}: {
  tableData: BillWorkDescriptionV2 | null;
  subTotals: SubTotalsV2 | null;
  clientBillSummary: ClientBillSummaryItem;
  changeOrderSummary: ChangeOrderSummary;
  currentActualsChangeOrders: CurrentActualsChangeOrdersV2;
  projectId: string;
}) => {
  const projectSummary = useSelector(
    (state) =>
      (state.data.projectsSummary.allProjects as ProjectSummary)[projectId]
  ) as ProjectSummaryItem;
  const profitTaxesOrders = ['profit', 'boTax', 'liability', 'salesTax'];
  const groupedRowCategories = ['Labor and Fees', 'Invoices', 'Change Orders'];

  const clientBillWorkDescription: {
    [group: string]: Record<string, WorkDescriptionContentItem[]>;
  } | null = useMemo(() => {
    const workDescriptionRows: {
      [group: string]: WorkDescriptionContentItem[];
    } = {};
    let changeOrderDescriptionRows: {
      [changeOrderId: string]: WorkDescriptionContentItem[];
    } = {};
    if (tableData) {
      groupedRowCategories.forEach((group) => {
        let iterateData: { [invoiceId: string]: CurrentActualsV2 } = {};
        let changeOrdersIterateData: InvoiceCurrentActualsChangeOrdersV2 = {};
        if (group === 'Labor and Fees') {
          iterateData = { ...tableData.actuals.laborFee };
        } else if (group === 'Invoices') {
          iterateData = { ...tableData.actuals.invoice };
        } else if (group === 'Change Orders') {
          changeOrdersIterateData = { ...tableData.actualsChangeOrders };
        }
        if (Object.keys(iterateData).length > 0) {
          const currentGroupRows: WorkDescriptionContentItem[] = [];
          Object.values(iterateData).forEach((currentActual) => {
            Object.entries(currentActual).forEach(([costCode, actualsItem]) => {
              const { qtyAmt, description, rateAmt, vendor, totalAmt } =
                actualsItem;
              currentGroupRows.push({
                qtyAmt: String(qtyAmt),
                description,
                rateAmt: String(rateAmt),
                vendor,
                totalAmt,
                costCode,
              });
            });
            if (group === 'Labor and Fees') {
              workDescriptionRows[group] = currentGroupRows.sort(
                (a, b) => +a['costCode'] - +b['costCode']
              );
            } else if (group === 'Invoices') {
              workDescriptionRows[group] = currentGroupRows.sort((a, b) =>
                a['vendor'].localeCompare(b['vendor'])
              );
            }
          });
        }
        // CHANGE ORDERS
        if (Object.keys(changeOrdersIterateData).length > 0) {
          Object.entries(changeOrdersIterateData).forEach(
            ([changeOrderId, invoiceObj]) => {
              let currentGroupRows: WorkDescriptionContentItem[] = [];
              currentGroupRows.push({
                qtyAmt: '',
                description: `${changeOrderSummary[changeOrderId].name} - ${changeOrderSummary[changeOrderId].workDescription}`,
                rateAmt: '',
                vendor: '',
                totalAmt: '',
                costCode: '',
                rowType: 'changeOrderTitle',
              });
              changeOrderDescriptionRows[changeOrderId] = currentGroupRows;

              Object.values(invoiceObj).forEach((currentActual) => {
                Object.entries(currentActual).forEach(
                  ([costCode, actualsItem]) => {
                    const { qtyAmt, description, rateAmt, vendor, totalAmt } =
                      actualsItem;
                    currentGroupRows.push({
                      qtyAmt: String(qtyAmt),
                      description,
                      rateAmt: String(rateAmt),
                      vendor,
                      totalAmt,
                      costCode,
                    });
                  }
                );
              });
              currentGroupRows = currentGroupRows.sort((a, b) =>
                a['vendor'].localeCompare(b['vendor'])
              );
              let profitTaxesObject: WorkDescriptionContentItem[] = [];
              profitTaxesOrders.forEach((key) => {
                // don't show sales tax for individual change orders
                if (key === 'salesTax') return;
                const changeOrderItem =
                  currentActualsChangeOrders[changeOrderId][
                    SUMMARY_COST_CODES[key as 'profit' | 'boTax' | 'liability']
                  ];
                const rateAmt =
                  changeOrderItem.description === 'Overhead and Profit' ||
                  changeOrderItem.description ===
                    'Business and Occupation Tax' ||
                  changeOrderItem.description === 'Sales Tax'
                    ? `${changeOrderItem.rateAmt} %`
                    : (changeOrderItem.rateAmt as string);
                profitTaxesObject.push({
                  description: changeOrderItem.description,
                  rateAmt: rateAmt,
                  vendor: '',
                  totalAmt: changeOrderItem.totalAmt,
                  qtyAmt: '',
                  costCode:
                    SUMMARY_COST_CODES[key as 'profit' | 'boTax' | 'liability'],
                });
              });
              profitTaxesObject = profitTaxesObject.sort((a, b) => {
                return +a['costCode'] - +b['costCode'];
              });

              currentGroupRows.push(...profitTaxesObject);
              changeOrderDescriptionRows[changeOrderId] = currentGroupRows;
            }
          );

          // Now we sort the changeOrderDescriptions by change order name:
          const sortedChangeOrderDescriptions: {
            [changeOrderId: string]: WorkDescriptionContentItem[];
          } = {};
          const sortedChangeOrderIds = Object.keys(
            changeOrderDescriptionRows
          ).sort((a, b) => {
            // Get the description of each change order and then compare
            return changeOrderDescriptionRows[a][0].description.localeCompare(
              changeOrderDescriptionRows[b][0].description
            );
          });
          sortedChangeOrderIds.forEach((key) => {
            sortedChangeOrderDescriptions[key] =
              changeOrderDescriptionRows[key];
          });

          changeOrderDescriptionRows = sortedChangeOrderDescriptions;
        }
      });

      // FOR SUBTOTALS
      const currentGroupRows: WorkDescriptionContentItem[] = [];
      currentGroupRows.push({
        qtyAmt: '',
        description: 'Subtotal',
        rateAmt: '',
        vendor: '',
        totalAmt: clientBillSummary.subTotal,
        costCode: '',
      });
      if (subTotals) {
        Object.entries(subTotals.budgeted).forEach(
          ([costCode, actualsItem]) => {
            const { description, totalAmt, vendor } = actualsItem;
            const rateAmt =
              description === 'Overhead and Profit' ||
              description === 'Business and Occupation Tax'
                ? `${actualsItem.rateAmt} %`
                : (actualsItem.rateAmt as string);
            if (description !== 'Sales Tax') {
              currentGroupRows.push({
                qtyAmt: '',
                description,
                rateAmt,
                vendor,
                totalAmt,
                costCode,
              });
            }
          }
        );
        workDescriptionRows['Subtotal'] = currentGroupRows;

        const currentGroupRowsChangeOrders: WorkDescriptionContentItem[] = [];
        currentGroupRowsChangeOrders.push({
          qtyAmt: '',
          description: 'Change Order Subtotal',
          rateAmt: '',
          vendor: '',
          totalAmt: clientBillSummary.changeOrders,
          costCode: '',
        });
        // TODO Add in the sales tax for the project and the total invoice amount
        changeOrderDescriptionRows['Subtotal'] = currentGroupRowsChangeOrders;
      }

      const finalTotalRows = [
        {
          qtyAmt: '',
          description: 'Sales Tax',
          rateAmt: `${Number(projectSummary.salesTax).toFixed(2)} %`,
          vendor: '',
          totalAmt: clientBillSummary.budgetedSalesTax,
          costCode: '',
        },
        {
          qtyAmt: '',
          description: 'Total',
          rateAmt: '',
          vendor: '',
          totalAmt: clientBillSummary.total,
          costCode: '',
        },
      ];

      return {
        budgeted: workDescriptionRows,
        changeOrders: changeOrderDescriptionRows,
        total: { total: finalTotalRows },
      };
    } else {
      return null;
    }
  }, [tableData]);
  return clientBillWorkDescription;
};

export function getCurrentBillTitle({
  item,
  currentData,
}: {
  item: Items;
  currentData: FormStateV2;
}) {
  if (item.id === 'bill-month') {
    return { ...item, value: currentData['bill-month'].value };
  } else if (item.id === 'bill-year') {
    return { ...item, value: currentData['bill-year'].value };
  } else {
    return item;
  }
}
