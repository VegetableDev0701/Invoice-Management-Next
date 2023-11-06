import { useMemo } from 'react';
import {
  BillWorkDescription,
  BillWorkDescriptionV2,
  SubTotals,
  SubTotalsV2,
  WorkDescriptionContentItem,
} from '../models/clientBillModel';
import {
  CurrentActuals,
  CurrentActualsChangeOrders,
  CurrentActualsChangeOrdersV2,
  CurrentActualsV2,
  InvoiceCurrentActualsChangeOrders,
  InvoiceCurrentActualsChangeOrdersV2,
} from '../models/budgetCostCodeModel';
import {
  ChangeOrderSummary,
  ClientBillSummaryItem,
} from '../models/summaryDataModel';
import { SUMMARY_COST_CODES } from '../globals';

export const useCreateClientBillWorkDescription = ({
  tableData,
  subTotals,
  clientBillSummary,
  changeOrderSummary,
  currentActualsChangeOrders,
}: {
  tableData: BillWorkDescriptionV2 | null;
  subTotals: SubTotalsV2 | null;
  clientBillSummary: ClientBillSummaryItem;
  changeOrderSummary: ChangeOrderSummary;
  currentActualsChangeOrders: CurrentActualsChangeOrdersV2;
}) => {
  const profitTaxesOrders = ['profit', 'boTax', 'liability'];
  // const profitTaxesCostCodes = Object.values(SUMMARY_COST_CODES)

  const groupedRowCategories = ['Labor and Fees', 'Invoices', 'Change Orders'];
  const clientBillWorkDescription: {
    [group: string]: Record<string, WorkDescriptionContentItem[]>;
  } | null = useMemo(() => {
    let workDescriptionRows: {
      [group: string]: WorkDescriptionContentItem[];
    } = {};
    let changeOrderDescriptions: {
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
              let { qtyAmt, description, rateAmt, vendor, totalAmt } =
                actualsItem;
              qtyAmt = qtyAmt as string;
              rateAmt = rateAmt as string;
              currentGroupRows.push({
                qtyAmt,
                description,
                rateAmt,
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
              });
              changeOrderDescriptions[changeOrderId] = currentGroupRows;

              Object.values(invoiceObj).forEach((currentActual) => {
                Object.entries(currentActual).forEach(
                  ([costCode, actualsItem]) => {
                    let { qtyAmt, description, rateAmt, vendor, totalAmt } =
                      actualsItem;
                    qtyAmt = qtyAmt as string;
                    rateAmt = rateAmt as string;
                    currentGroupRows.push({
                      qtyAmt,
                      description,
                      rateAmt,
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
                const changeOrderItem =
                  currentActualsChangeOrders[changeOrderId][
                    SUMMARY_COST_CODES[key as 'profit' | 'boTax' | 'liability']
                  ];
                const rateAmt =
                  changeOrderItem.description === 'Overhead and Profit' ||
                  changeOrderItem.description === 'Business and Occupation Tax'
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
              // space
              profitTaxesObject.push({
                description: '',
                rateAmt: '',
                vendor: '',
                totalAmt: '',
                qtyAmt: '',
                costCode: '',
              });

              currentGroupRows.push(...profitTaxesObject);

              // here calculating the totals be each change order but need to show the subtotal breakdown
              // currentGroupRows.push({
              //   qtyAmt: '',
              //   description: `${changeOrderSummary[changeOrderId].name} Subtotal`,
              //   rateAmt: '',
              //   vendor: '',
              //   totalAmt: formatNumber(
              //     (
              //       clientBillSummary.totalsByChangeOrder as Record<
              //         string,
              //         number
              //       >
              //     )[changeOrderId].toFixed(2)
              //   ),
              //   costCode: '',
              // });
              changeOrderDescriptions[changeOrderId] = currentGroupRows;
            }
          );

          // Now we sort the changeOrderDescriptions by change order name:
          let sortedChangeOrderDescriptions: {
            [changeOrderId: string]: WorkDescriptionContentItem[];
          } = {};
          let sortedChangeOrderIds = Object.keys(changeOrderDescriptions).sort(
            (a, b) => {
              // Get the description of each change order and then compare
              return changeOrderDescriptions[a][0].description.localeCompare(
                changeOrderDescriptions[b][0].description
              );
            }
          );
          sortedChangeOrderIds.forEach((key) => {
            sortedChangeOrderDescriptions[key] = changeOrderDescriptions[key];
          });

          changeOrderDescriptions = sortedChangeOrderDescriptions;
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
            let { description, rateAmt, totalAmt, vendor } = actualsItem;
            rateAmt =
              description === 'Overhead and Profit' ||
              description === 'Business and Occupation Tax'
                ? `${rateAmt} %`
                : (rateAmt as string);
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
        // Object.entries(subTotals.changeOrders).forEach(
        //   ([costCode, actualsItem]) => {
        //     let { description, rateAmt, totalAmt, vendor } = actualsItem;
        //     rateAmt =
        //       description === 'Overhead and Profit' ||
        //       description === 'Business and Occupation Tax'
        //         ? `${rateAmt} %`
        //         : (rateAmt as string);
        //     if (description !== 'Sales Tax') {
        //       currentGroupRowsChangeOrders.push({
        //         qtyAmt: '',
        //         description,
        //         rateAmt,
        //         vendor,
        //         totalAmt,
        //         costCode,
        //       });
        //     }
        //   }
        // );
        // TODO Add in the sales tax for the project and the total invoice amount
        changeOrderDescriptions['Subtotal'] = currentGroupRowsChangeOrders;
      }

      return {
        budgeted: workDescriptionRows,
        changeOrders: changeOrderDescriptions,
      };
    } else {
      return null;
    }
  }, [tableData]);
  return clientBillWorkDescription;
};
