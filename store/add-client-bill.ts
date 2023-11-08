import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '.';
import { uiActions } from './ui-slice';
import {
  ChangeOrderSummary,
  ClientBillSummary,
  LaborSummary,
  LaborSummaryItem,
} from '@/lib/models/summaryDataModel';
import {
  calculateTotals,
  createBillProfitTaxesObject,
  createBudgetActualsObject,
  getBillProfitTaxes,
  updateActuals,
} from '@/lib/utility/budgetHelpers';
import { projectDataActions } from './projects-data-slice';
import { companyDataActions } from './company-data-slice';
import { createSingleClientBillSummary } from '@/lib/utility/createSummaryDataHelpers';
import { fetchWithRetry } from '@/lib/utility/ioUtils';
import { SUMMARY_COST_CODES } from '@/lib/globals';
import { snapshotCopy } from '@/lib/utility/utils';
import {
  addNewChangeOrderValuesToPreviousData,
  createB2AChangeOrderChartData,
  createB2AChartDataV2,
  addActualsToTotalsV2,
} from '@/lib/utility/chartHelpers';
import {
  CurrentActualsV2,
  InvoiceCurrentActualsChangeOrdersV2,
  InvoiceCurrentActualsV2,
} from '@/lib/models/budgetCostCodeModel';
import {
  InvoiceItem,
  Invoices,
  InvoiceLineItemItem,
} from '@/lib/models/invoiceDataModels';
import { ChartDataV2 } from '@/lib/models/chartDataModels';

// TODO Fix delete bill logic
export const deleteClientBillDataFromB2A = createAsyncThunk(
  'addClientBill/deleteClientBill',
  async (
    {
      projectId,
      companyId,
      clientBillId,
    }: { projectId: string; companyId: string; clientBillId: string },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    const budget = state.projects[projectId].budget;
    // 1. Save the client bill actual data before adding it to previous totals to firestore
    // 2. pull that data
    try {
      const data = await fetchWithRetry(
        `/api/${companyId}/projects/${projectId}/get-single-client-bill`,
        {
          method: 'GET',
          headers: {
            clientBillId,
            isOnlyCurrentActuals: 'true',
          },
        }
      );
      const currentActuals = JSON.parse(data).currentActuals;

      const currentBudgetedTotal: number = state.projects[projectId].b2a
        ?.currentBudgetedTotal
        ? +state.projects[projectId].b2a.currentBudgetedTotal.value
        : 0;

      const totals = calculateTotals({
        budget: currentActuals,
        isChangeOrder: false,
      });

      const result = createB2AChartDataV2({
        budget,
        costCodeTotals: currentActuals,
        currentBudgetedTotal,
        initActualsToZeros: true,
      });
      if (!result) return false;
      const { chartData: actualsChartData } = result;

      // add old actuals to this invoice current actuals
      const updatedB2AData = addActualsToTotalsV2({
        budget,
        totals: state.projects[projectId].b2a.b2aChartData as ChartDataV2,
        actuals: actualsChartData,
        isDeleteBill: true,
      });

      thunkAPI.dispatch(
        projectDataActions.addFullData({
          newData: {
            b2aChartData: updatedB2AData,
            currentBudgetedTotal: {
              value:
                currentBudgetedTotal -
                +Number(totals.total.replaceAll(',', '')).toFixed(2),
            },
          },
          projectId,
          stateKey: 'b2a',
        })
      );
      // TODO doesn't currently look like we are pushing the updated `FullData` after
      // deleting a bill to the database so it is not persisting.
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
);

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export const createBudgetActuals = createAsyncThunk(
  'addClientBill/createBudgetActuals',
  async (
    {
      projectId,
      companyId,
      clientBillId,
    }: {
      projectId: string;
      companyId: string;
      clientBillId: string;
    },
    { getState, dispatch }
  ) => {
    try {
      const state = getState() as RootState;
      const projectSummary = state.data.projectsSummary.allProjects[projectId];
      const budget = state.projects[projectId].budget;
      const budgetTotalsV2 = state.addBudgetForm.budgetV2;
      const allInvoices: Invoices = state.data.invoices.allInvoices;
      const currentLaborSummary = state.projects[projectId]['labor-summary'];
      const changeOrdersSummary =
        state.projects[projectId]['change-orders-summary'];
      const previousCurrentActualsChangeOrders =
        state.projects[projectId].b2a?.updatedCurrentActualsChangeOrders;
      const costCodeNameList = state.data.costCodeNameList;

      // filter all invoices down to this project only
      const projectInvoices = (
        Object.values(allInvoices) as MakeRequired<
          InvoiceItem,
          'processedData'
        >[]
      ).filter((invoice) => invoice.project.uuid === projectId);

      // make sure any labor calculated is `current` (right now 10/11/23, i don't think a labor can be `not current`)
      const projectLaborFees: LaborSummaryItem[] = Object.values(
        currentLaborSummary
      ).filter((laborFee) => laborFee.currentLabor);

      if (
        projectLaborFees.some(
          (laborFee) =>
            Object.values(laborFee.line_items).some(
              (item) => item.cost_code === '' || item.cost_code === 'None'
            ) || laborFee.totalAmt === ''
        )
      ) {
        dispatch(
          uiActions.setModalContent({
            openModal: true,
            message:
              "All Labor and Fees must have a cost cost and amount before building the client's bill. Please update missing information.",
            title: 'Warning',
          })
        );
        return false;
      }
      // check if either all of the line_items are missing cost code and amounts OR the
      // invoice as a whole is missing cost code and amount. Will pass if all line items are
      // filled in OR if the whole invoice is filled in for those fields.
      if (
        projectInvoices.some((invoice) => {
          return (
            invoice.processedData &&
            invoice.processedData.line_items &&
            (
              Object.values(
                invoice.processedData.line_items
              ) as InvoiceLineItemItem[]
            ).some((item) => {
              return item.cost_code === null || item.amount === '';
            }) &&
            (invoice.processedData.cost_code === null ||
              invoice.processedData.total_amount === '')
          );
        })
      ) {
        dispatch(
          uiActions.setModalContent({
            openModal: true,
            message:
              "All Invoices must have a cost cost and amount before building the client's bill. Please update missing information.",
            title: 'Warning',
          })
        );
        return false;
      }

      if (projectInvoices.some((invoice) => !invoice.approved)) {
        dispatch(
          uiActions.setModalContent({
            openModal: true,
            message:
              "All invoices must be approved before building the client's bill.",
            title: 'Warning',
          })
        );
        return false;
      }

      // Create the actuals for this client's bill for just the invoices
      // and labor. this will be used to calculate the tax, profit etc.
      // then update this `currentActuals` with that data
      // the currentActuals data includes. Keep change orders separate returned
      // in two objects named accordingly.
      const {
        budgetActuals: currentActuals,
        budgetActualsChangeOrders: currentActualsChangeOrders,
        billTitle,
        numInvoices,
        numChangeOrders,
        // totalLaborFeesAmountWithoutChangeOrders,
        invoiceBudgetActuals: invoiceCurrentActuals,
        invoiceBudgetActualsChangeOrders: invoiceCurrentActualsChangeOrders,
      } = createBudgetActualsObject({
        projectInvoices,
        projectLaborFees,
        budgetTotals: budgetTotalsV2,
        changeOrdersSummary: changeOrdersSummary as ChangeOrderSummary,
        costCodeNameList,
        dispatch,
      });

      // This should be the grand total of the project. This would be the value we calculate project
      // completion percentage from
      const currentBudgetedTotal: number = state.projects[projectId].b2a
        ?.currentBudgetedTotal
        ? +state.projects[projectId].b2a.currentBudgetedTotal.value
        : 0;

      let budgetedTotals = calculateTotals({
        budget: currentActuals,
        isChangeOrder: false,
      });
      let changeOrderTotals = calculateTotals({
        budget: currentActualsChangeOrders,
        isChangeOrder: true,
      });

      // use this subtotal before adding profits in the client bill summary
      // make a deep copy just to be certain this value does not get changed
      // on reference
      const budgetedSubTotal: string = snapshotCopy(budgetedTotals.total);

      // Calculate the profit, liability and taxes, for all invoices and labor
      // that are not change orders
      const budgetedProfitTaxes = getBillProfitTaxes({
        projectSummary,
        total: budgetedTotals.total,
      });
      const currentBudgetedProfitTaxesObject = createBillProfitTaxesObject({
        profitTaxes: budgetedProfitTaxes,
        projectSummary,
        prefix: '',
      });

      // update the currentActuals with the tax, profit, liability etc.
      updateActuals({
        billProfitTaxesObject: currentBudgetedProfitTaxesObject,
        actuals: currentActuals,
        summaryCostCodes: SUMMARY_COST_CODES,
        budgetTotals: budgetTotalsV2,
      });

      // Same for CHANGE ORDERS, need to keep them separate; for ALL change orders combined
      const changeOrderProfitTaxes = getBillProfitTaxes({
        projectSummary,
        total: changeOrderTotals.total,
      });
      const currentChangeOrderProfitTaxesObject = createBillProfitTaxesObject({
        profitTaxes: changeOrderProfitTaxes,
        projectSummary,
        prefix: '',
      });
      if (!currentActualsChangeOrders?.['profitTaxesLiability']) {
        currentActualsChangeOrders['profitTaxesLiability'] = {};
      }
      updateActuals({
        billProfitTaxesObject: currentChangeOrderProfitTaxesObject,
        actuals: currentActualsChangeOrders?.['profitTaxesLiability'],
        summaryCostCodes: SUMMARY_COST_CODES,
        budgetTotals: budgetTotalsV2,
      });

      // create the profit subtotals taxes for EACH CHANGE ORDER
      // good to have all this separate for each change order in case we want to
      // show this data for each change order indenpendently
      Object.entries(
        changeOrderTotals.changeOrderTotals as {
          [changeOrderID: string]: number;
        }
      ).forEach(([changeOrderId, total]) => {
        const tempChangeOrderProfitTaxes = getBillProfitTaxes({
          projectSummary,
          total,
        });
        const tempChangeOrderProfitTaxesObject = createBillProfitTaxesObject({
          profitTaxes: tempChangeOrderProfitTaxes,
          projectSummary,
          prefix: '',
        });
        updateActuals({
          billProfitTaxesObject: tempChangeOrderProfitTaxesObject,
          actuals: currentActualsChangeOrders[changeOrderId],
          summaryCostCodes: SUMMARY_COST_CODES,
          budgetTotals: budgetTotalsV2,
        });
      });

      const snapShotCurrentActuals: CurrentActualsV2 =
        snapshotCopy(currentActuals);
      const snapShotCurrentActualsChangeOrders: InvoiceCurrentActualsV2 =
        snapshotCopy(currentActualsChangeOrders);

      // snapshot the  data at this point, to keep the currentActuals for both data,
      // change orders and no change orders, for each bill to be used to reverse all calculations
      // if user needs to delete a client bill.
      // also include the invoice form of the data.
      // after this point we start aggregating this current data with previous data for the B2A reports and charts.

      try {
        await fetchWithRetry(
          `/api/${companyId}/projects/${projectId}/add-client-bill`,
          {
            method: 'POST',
            body: JSON.stringify({
              currentActuals: snapShotCurrentActuals,
              currentActualsChangeOrders: snapShotCurrentActualsChangeOrders,
            }),
            headers: {
              clientBillId,
            },
          }
        );
      } catch (error) {
        dispatch(uiActions.setLoadingState({ isLoading: false }));
        console.error(error);
      }

      // Add the profit, liability and taxes to the overall totals.
      // Those are calculated on the subtotals above.
      budgetedTotals = calculateTotals({
        budget: currentActuals,
        isChangeOrder: false,
      });

      // the change ChangeOrderFormState has one extra level of nesting
      // where the parent level is the changeOrderId. this is different from the
      // current actuals where we aggregate everything by cost code across all invoices/labor
      changeOrderTotals = calculateTotals({
        budget: currentActualsChangeOrders,
        isChangeOrder: true,
      });

      // actualsChartData will give all the budgeted totals, and any actuals from previous bills
      // NO CHANGE ORDERS

      const result = createB2AChartDataV2({
        budget,
        costCodeTotals: currentActuals,
        currentBudgetedTotal,
        initActualsToZeros: true,
      });
      createB2AChartDataV2({
        budget,
        costCodeTotals: currentActuals,
        currentBudgetedTotal,
        initActualsToZeros: true,
      });

      if (!result) {
        dispatch(uiActions.setLoadingState({ isLoading: false }));
        dispatch(
          uiActions.setNotificationContent({
            content: 'Error when trying to create actuals data for chart.',
            openNotification: true,
            icon: 'error',
          })
        );
        return false;
      }

      const {
        chartData: actualsChartData,
        grandActualsTotal: grandActualsBudgetedTotal,
      } = result;

      // add previous actuals to this current invoice actuals
      // NO CHANGE ORDERS
      const updatedB2AData = addActualsToTotalsV2({
        budget,
        totals: state.projects[projectId].b2a.b2aChartData as ChartDataV2,
        actuals: actualsChartData,
        isDeleteBill: false,
      });

      // CHANGE ORDERS
      // if there is previous data it will add that data to the currentActualsChangeOrders
      // this will be a running sum of all change orders from previous client bills
      const { updatedCurrentActualsChangeOrders } =
        addNewChangeOrderValuesToPreviousData({
          currentActualsChangeOrders,
          previousCurrentActualsChangeOrders,
        });

      // create the data to be displayed on the chart for change orders. this will be the cumulative
      // data from current and previous change orders
      const { changeOrderChartData, grandTotal: changeOrderTotal } =
        createB2AChangeOrderChartData({
          updatedCurrentActualsChangeOrders,
          changeOrdersSummary: changeOrdersSummary as ChangeOrderSummary,
        });

      dispatch(
        projectDataActions.addFullData({
          newData: {
            b2aChartData: updatedB2AData,
            b2aChartDataChangeOrder: changeOrderChartData,
            updatedCurrentActualsChangeOrders,
            currentGrandTotal: {
              value: grandActualsBudgetedTotal + changeOrderTotal,
            },
            currentBudgetedTotal: { value: grandActualsBudgetedTotal },
            currentChangeOrderTotal: { value: changeOrderTotal },
          },
          projectId,
          stateKey: 'b2a',
        })
      );

      // combine all laborFeeIds and invoiceIds to attach to bill summary data
      // If we have broken out individual cost codes in currentActuals, we can get
      // duplicates of the laborFee or invoice Ids -> use a Set to get unique ids.
      let laborFeeIds = new Set<string>();
      let invoiceIds = new Set<string>();
      Object.values(currentActuals).forEach((curr) => {
        if (curr.laborFeeIds) {
          laborFeeIds = new Set([...laborFeeIds, ...curr.laborFeeIds]);
        }
        if (curr.invoiceIds) {
          invoiceIds = new Set([...invoiceIds, ...curr.invoiceIds]);
        }
      });
      Object.values(currentActualsChangeOrders).forEach((costCodeObj) => {
        Object.values(costCodeObj).forEach((costCodeData) => {
          if (costCodeData?.laborFeeIds) {
            laborFeeIds = new Set([
              ...laborFeeIds,
              ...costCodeData.laborFeeIds,
            ]);
          }
          if (costCodeData?.invoiceIds) {
            invoiceIds = new Set([...invoiceIds, ...costCodeData.invoiceIds]);
          }
        });
      });
      // add the cost code by invoice data, broken out between change orders and no change orders
      // to the clientBillSummary data
      const clientBillSummary = createSingleClientBillSummary({
        subTotal: budgetedSubTotal,
        currentActuals: currentActuals,
        changeOrderTotals,
        totals: budgetedTotals,
        billTitle: billTitle as string,
        uuid: clientBillId,
        numInvoices,
        numChangeOrders,
        // totalLaborFeesAmount: totalLaborFeesAmountWithoutChangeOrders.reduce(
        //   (acc, curr) => acc + curr,
        //   0
        // ),
        laborFeeIds: [...laborFeeIds], // convert Set back to array
        invoiceIds: [...invoiceIds],
      });

      dispatch(
        projectDataActions.addSummaryTableRow({
          newData: clientBillSummary,
          projectId,
          stateKey: 'client-bills-summary',
        })
      );

      // build the change order plot
      try {
        await fetchWithRetry(
          `/api/${companyId}/projects/${projectId}/add-b2achartdata`,
          {
            method: 'POST',
            body: JSON.stringify({
              b2aChartData: updatedB2AData,
              b2aChartDataChangeOrder: changeOrderChartData,
              updatedCurrentActualsChangeOrders,
              currentGrandTotal: {
                value: +(grandActualsBudgetedTotal + changeOrderTotal).toFixed(
                  2
                ),
              },
              currentBudgetedTotal: { value: grandActualsBudgetedTotal },
              currentChangeOrderTotal: { value: changeOrderTotal },
            }),
          }
        );
        dispatch(
          uiActions.setNotificationContent({
            content: 'Succesfully added and saved new client bill.',
            openNotification: true,
            icon: 'success',
          })
        );
      } catch (error) {
        console.error(error);
        dispatch(uiActions.setLoadingState({ isLoading: false }));
        dispatch(
          uiActions.setNotificationContent({
            content: 'Error when trying to save budget to actuals data.',
            openNotification: true,
            icon: 'error',
          })
        );
        return false;
      }
      dispatch(uiActions.setLoadingState({ isLoading: false }));
      return {
        clientBillObj: {
          actuals: invoiceCurrentActuals,
          actualsChangeOrders: invoiceCurrentActualsChangeOrders,
        },
      };
    } catch (error) {
      console.error(error);
      dispatch(uiActions.setLoadingState({ isLoading: false }));
    }
  }
);

export const moveAllBillData = createAsyncThunk(
  'addClientBill/moveAllBillData',
  async (
    { projectId, clientBillId }: { projectId: string; clientBillId: string },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    const projectLabor = state.projects[projectId]['labor-summary'];
    const allInvoices = {
      ...(state.data.invoices.allInvoices as Invoices),
    };

    // Update Labor, add client Bill Id to labor
    const updatedLaborSummary = Object.entries(projectLabor)
      .filter(([_, labor]) => !labor.clientBillId)
      .reduce(
        (obj: LaborSummary, [laborId, labor]: [string, LaborSummaryItem]) => {
          obj[laborId] = {
            ...labor,
            clientBillId: clientBillId,
            currentLabor: false,
          };
          return obj;
        },
        {}
      );

    const updatedInvoices = Object.entries(allInvoices)
      .filter(
        ([_, invoice]) =>
          invoice.project.uuid === projectId && !invoice['client_bill_id']
      )
      .reduce((obj: Invoices, [invoiceId, invoice]: [string, any]) => {
        obj[invoiceId] = {
          ...invoice,
          client_bill_id: clientBillId,
          is_attached_to_bill: true,
        };
        return obj;
      }, {});

    // remove invoices attached to current bill from the data.invoices.allInvoices state
    thunkAPI.dispatch(
      companyDataActions.removeInvoicesAttachedToClientBill({
        invoiceIds: Object.keys(updatedInvoices),
      })
    );

    // update the labor summary data to inlcude the client bill id and move
    // both the labor summary and and labor form data into the current client bill
    // state nested inside the project it is attached to
    thunkAPI.dispatch(
      projectDataActions.updateProjectsClientBillData({
        projectId,
        updatedLaborSummary,
        updatedInvoices,
        clientBillId,
      })
    );
  }
);

export const moveBillDataInFirestore = createAsyncThunk(
  'addClientBill/moveAllBillDataFirestore',
  async (
    {
      projectId,
      companyId,
      clientBillId,
      clientBillObj,
    }: {
      projectId: string;
      companyId: string;
      clientBillId: string;
      clientBillObj: {
        actuals: InvoiceCurrentActualsV2;
        actualsChangeOrders: InvoiceCurrentActualsChangeOrdersV2;
      };
    },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    const clientBill = state.projects[projectId]['client-bills'][clientBillId];

    // if we are moving data we have build a client bill and therefore it can't
    // be {} type, so assert it here
    const clientBillSummary = (
      state.projects[projectId]['client-bills-summary'] as ClientBillSummary
    )[clientBillId];

    const invoiceIds = Object.keys(clientBill.invoices);
    const laborIds = Object.keys(clientBill.labor);

    try {
      await fetchWithRetry(
        `/api/${companyId}/projects/${projectId}/add-client-bill`,
        {
          method: 'POST',
          body: JSON.stringify({
            invoiceIds,
            laborIds,
            clientBillObj,
            clientBillSummary,
          }),
          headers: {
            clientBillId,
          },
        }
      );
    } catch (error) {
      console.error(error);
    }
  }
);

const initialBillState = {};

const addClientBillSlice = createSlice({
  name: 'addClientBill',
  initialState: initialBillState,
  reducers: {},
});

export default addClientBillSlice;
export const addClientBillActions = addClientBillSlice.actions;
