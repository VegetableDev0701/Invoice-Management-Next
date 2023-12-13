import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { addUpdatedChangeOrderContent } from './add-change-order';
import { uiActions } from './ui-slice';
import { projectDataActions } from './projects-data-slice';

import {
  ChangeOrderSummary,
  ProjectSummary,
  SummaryProjects,
  VendorSummary,
  VendorSummaryItem,
} from '@/lib/models/summaryDataModel';
import {
  costCodeData2NLevel,
  createCostCodeList,
} from '@/lib/utility/costCodeHelpers';
import { RootState } from '.';
import {
  SelectMenuOptions,
  VendorData,
  Vendors,
} from '@/lib/models/formDataModel';
import { getChangeOrderIdFromName } from '@/lib/utility/processInvoiceHelpers';
import {
  CostCodeTreeData,
  TreeData,
  CostCodesData,
} from '@/lib/models/budgetCostCodeModel';
import { fetchWithRetry } from '@/lib/utility/ioUtils';
import { processingActions } from './processing-slice';
import { CostCodeObjType } from '@/lib/models/projectDataModel';
import { FormState, FormStateItem } from '@/lib/models/formStateModels';
import {
  extractLineItems,
  groupLineItems,
  sortLineItems,
} from '@/lib/utility/invoiceHelpers';
import { formatNumber } from '@/lib/utility/formatter';
import {
  InvoiceItem,
  InvoiceProject,
  Invoices,
  InvoiceLineItem,
  InvoiceLineItemItem,
  ProcessedInvoiceData,
} from '@/lib/models/invoiceDataModels';
import {
  ChangeOrderContent,
  ChangeOrderContentItem,
} from '@/lib/models/changeOrderModel';
import { ExtendedCompanyData, Forms } from '@/lib/models/companyDataModel';
import { isObjectEmpty, snapshotCopy } from '@/lib/utility/utils';
import { RESET_STATE } from '@/lib/globals';

export const fetchCompanyData = createAsyncThunk(
  'companyDataAsync/fetch',
  async (
    { companyId }: { companyId: string; projectId?: string },
    thunkAPI
  ) => {
    // when we start grabbing data set this to false until all data is complete
    thunkAPI.dispatch(processingActions.setFetchedProjectsStatus(false));
    try {
      const urls = {
        vendors: `/api/${companyId}/vendors/get-all-vendors`,
        forms: `/api/${companyId}/get-all-forms`,
        costCodes: `/api/${companyId}/get-cost-codes`,
        invoices: `/api/${companyId}/invoices/get-all-invoices`,
      };

      const promises = Object.values(urls).map((url) =>
        fetchWithRetry(url, { method: 'GET' })
      );
      const results = await Promise.allSettled(promises);
      const data = Object.keys(urls).reduce<any>((acc, key, index) => {
        if (results[index].status === 'fulfilled') {
          const fulfilledResult = results[index] as PromiseFulfilledResult<any>;
          acc[key] = fulfilledResult;
        } else if (results[index].status === 'rejected') {
          const rejectedResult = results[index] as PromiseRejectedResult;
          console.error(`Error fetching ${key}:`, rejectedResult.reason);
        }
        return acc;
      }, {});

      return data;
    } catch (error) {
      console.error(error);
      return {
        status: (error as Error).message,
        code: (error as Error).message,
        error: (error as Error).message,
      };
    }
  }
);

/**
 * This thunk will update an invoice when it first gets ingested into the
 * system and first classified to a project.
 */
export const updateInvoices = createAsyncThunk(
  'invoiceUpdates/updateInvoices',
  async (invoicesToUpdate: string[], thunkAPI) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const allInvoices: Invoices = {
        ...state.data.invoices.allInvoices,
      };
      const invoiceProjects: { [invoiceId: string]: InvoiceProject } = {
        ...state.invoice.invoiceProjects,
      };
      // if none of the selected invoices have an updated project STOP
      const intersection = invoicesToUpdate.filter((item) =>
        Object.keys(invoiceProjects).includes(item)
      );
      if (intersection.length === 0) {
        return false;
      }
      if (!isObjectEmpty(invoiceProjects)) {
        const updatedAllInvoices: Invoices = invoicesToUpdate.reduce(
          (obj: Invoices, invoiceId: string) => {
            if (allInvoices[invoiceId] && invoiceProjects[invoiceId]) {
              obj[invoiceId] = {
                ...allInvoices[invoiceId],
                project: invoiceProjects[invoiceId],
              };
            }
            return obj;
          },
          {}
        );
        return updatedAllInvoices;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }
);

export const patchInvoiceUpdates = createAsyncThunk(
  'invoiceUpdates/patchInvoiceUpdates',
  async (
    {
      companyId,
      invoicesToUpdate,
    }: { companyId: string; invoicesToUpdate: string[] },
    thunkAPI
  ) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const invoiceProjects = { ...state.invoice.invoiceProjects };

      const filteredInvoiceProjects: { [invoiceId: string]: InvoiceProject } =
        {};
      invoicesToUpdate.forEach((id) => {
        if (invoiceProjects[id]) {
          filteredInvoiceProjects[id] = invoiceProjects[id];
        }
      });

      const data = await fetchWithRetry(
        `/api/${companyId}/invoices/update-projects`,
        {
          method: 'PATCH',
          body: JSON.stringify(filteredInvoiceProjects),
        }
      );
      thunkAPI.dispatch(
        uiActions.notify({
          content: data.message,
          icon: 'save',
        })
      );
    } catch (error) {
      thunkAPI.dispatch(
        uiActions.notify({
          content:
            'Something went wrong with saving projects to invoices. Please try again.',
          icon: 'error',
        })
      );
      console.error(error);
      return;
    }
  }
);

export const addProcessedInvoiceData = createAsyncThunk(
  'invoiceUpdates/addProcessedInvoiceData',
  async (
    {
      companyId,
      invoiceId,
      projectName,
      snapShotFormState,
    }: {
      companyId: string;
      invoiceId: string;
      projectName: string | null;
      snapShotFormState: FormState;
    },
    thunkAPI
  ) => {
    // thunkAPI.dispatch(uiActions.lockUI());
    try {
      const state = thunkAPI.getState() as RootState;
      const processInvoiceFormState = state.addProcessInvoiceForm;
      const costCodeList: CostCodeObjType[] = state.data.costCodeList;
      const costCodeNameList: CostCodeObjType[] = state.data.costCodeNameList;
      const vendorsSummary: VendorSummary | object =
        state.data.vendorsSummary.allVendors;
      const snapShotLineItems: InvoiceLineItem | undefined = state.data.invoices
        .allInvoices[invoiceId]?.processedData?.line_items
        ? snapshotCopy(
            (
              state.data.invoices.allInvoices[invoiceId]
                .processedData as ProcessedInvoiceData
            ).line_items
          )
        : {};

      const isProjectNameChanged =
        processInvoiceFormState?.['project-name']?.value &&
        projectName !== processInvoiceFormState['project-name'].value
          ? true
          : false;

      const isUnassignProject =
        processInvoiceFormState?.['project-name']?.value === 'Unassign';

      const matchedVendorSummary =
        !isObjectEmpty(vendorsSummary) &&
        Object.values(vendorsSummary).find((vendor) => {
          if (processInvoiceFormState?.['vendor-name']?.value) {
            return (
              vendor.vendorName ===
              processInvoiceFormState?.['vendor-name']?.value
            );
          }
        });

      // check if the current chosen project in the processed invoice form
      // is the same as the project the invoice is currently associated with
      const currentProjectName =
        isProjectNameChanged && !isUnassignProject
          ? (processInvoiceFormState?.['project-name']?.value as string)
          : projectName;

      // grab the project data for the current project associated with the clicked invoice
      const projectData = Object.values(
        state.data.projectsSummary.allProjects as SummaryProjects
      ).filter((project) => project.projectName === currentProjectName)[0];

      const changeOrdersSummary = state.projects[projectData.uuid as string][
        'change-orders-summary'
      ] as ChangeOrderSummary;

      const processedInvoiceData = {
        invoice_id:
          (processInvoiceFormState?.['invoice-number']?.value as string) ??
          null,
        vendor: {
          name:
            (processInvoiceFormState?.['vendor-name']?.value as string) ?? null,
          uuid: matchedVendorSummary?.uuid ?? null,
        },
        cost_code:
          processInvoiceFormState?.['cost-code']?.value &&
          processInvoiceFormState['cost-code'].value !== 'None' &&
          processInvoiceFormState['cost-code'].value !== ''
            ? (processInvoiceFormState['cost-code'].value as string)
            : null,
        total_tax_amount:
          (processInvoiceFormState?.['total-tax']?.value as string) ?? null,
        total_amount:
          (processInvoiceFormState?.['invoice-total']?.value as string) ?? null,
        approver:
          (processInvoiceFormState?.['approver']?.value as string) ?? null,
        is_credit:
          (processInvoiceFormState?.['credit']?.value as boolean) ?? false,
        date_received:
          (processInvoiceFormState?.['date-received']?.value as string) ?? null,
        invoice_date:
          (processInvoiceFormState?.['invoice-date']?.value as string) ?? null,
        line_items_toggle:
          (processInvoiceFormState?.['line-item-toggle']?.value as boolean) ??
          false,
        billable:
          (processInvoiceFormState?.['billable']?.value as boolean) ?? true,
      };

      const numLineItems = +(state.addProcessInvoiceForm.numLineItems.value as
        | string
        | number);
      // filter out the line items from the rest of the processed invoice state
      const lineItems = extractLineItems({
        formState: processInvoiceFormState,
        numLineItems,
      }) as Record<string, FormStateItem>;

      // create an object with the line items data with the key === line item number
      // change orders require the {name, uuid} object so we can show the name but
      // use the uuid in teh background
      let groupedLineItems: InvoiceLineItem = {};
      if (lineItems) {
        const lineItemBoundingBoxes =
          state.data.invoices.allInvoices[invoiceId]?.line_items_gpt;

        groupedLineItems = groupLineItems({
          lineItems,
          changeOrdersSummary,
          lineItemBoundingBoxes,
          isProjectNameChanged,
        });
      }

      // This code ensures that a change order is set for either the entire invoice or an individual line item, but not both.
      // It prevents conflicting change orders. TODO However, utilizing the line-item-toggle to clear any whole invoice change order
      // when saving with the toggle switch open can improve user experience by eliminating the need for error modals in such cases.
      try {
        if (
          Object.values(groupedLineItems).some((lineItem) => {
            return lineItem.change_order !== null;
          }) &&
          processInvoiceFormState['change-order'].value !== 'None' &&
          processInvoiceFormState['change-order'].value !== '' &&
          processInvoiceFormState['change-order'].value !== null
        ) {
          thunkAPI.dispatch(
            uiActions.setModalContent({
              openModal: true,
              title: 'Warning',
              message:
                'You cannot set a change order for the whole invoice AND any of the line items. The whole invoice will include all line items and this may not be the desired result.',
            })
          );
          throw new Error(
            'Cannot have change orders for a line item and the entire invoice.'
          );
        }
      } catch (error) {
        console.error(error);
        return;
      }

      const changeOrderContentList: {
        [changeOrderId: string]: ChangeOrderContent;
      }[] = [];

      const isChangeOrderNone = (lineItem: InvoiceLineItemItem) =>
        lineItem.change_order === null;

      const isNoLineItemsSelected =
        Object.values(groupedLineItems).every(isChangeOrderNone);

      // If the line item toggle is open, then the whole invoice change order is automatically
      // set to null so that there can be no conflicts.
      const wholeInvoiceChangeOrderValue = isProjectNameChanged
        ? null
        : processInvoiceFormState['change-order'].value;

      const wholeInvoiceCostCodeValue =
        processInvoiceFormState['cost-code'].value;

      // NO LINE ITEMS
      if (
        isNoLineItemsSelected &&
        wholeInvoiceChangeOrderValue &&
        wholeInvoiceChangeOrderValue !== 'None' &&
        wholeInvoiceCostCodeValue
      ) {
        const id = costCodeList.find(
          (value) => value.label === (wholeInvoiceCostCodeValue as string)
        );

        // neither of these should ever happen but just to be sure
        if (!id) {
          throw new Error(
            `${wholeInvoiceCostCodeValue} was not matched to a cost code id.`
          );
        }
        const description = costCodeNameList.find(
          (value: CostCodeObjType) => id && value.id === id.id
        );
        if (!description) {
          throw new Error(`${id} was not matched to a cost code name.`);
        }

        // you cannot choose a cost code when processing invoices that do not
        // already exist so we can force the description type here.
        // If the project name changes, i.e. the invoice was assigned to the wrong project,
        // we would just negate any change order designation so skip this step. Change orders
        // are associated with projects so all change order assignments get reset for that invoice.
        if (!isProjectNameChanged) {
          changeOrderContentList.push({
            [getChangeOrderIdFromName({
              changeOrdersSummary,
              changeOrderName: wholeInvoiceChangeOrderValue as string,
            })]: {
              [invoiceId]: {
                costCode: wholeInvoiceCostCodeValue as string,
                totalAmt: formatNumber(
                  (+(
                    processInvoiceFormState['invoice-total'].value as string
                  ).replaceAll(',', '')).toFixed(2)
                ),
                qtyAmt: '1',
                rateAmt: formatNumber(
                  (+(
                    processInvoiceFormState['invoice-total'].value as string
                  ).replaceAll(',', '')).toFixed(2)
                ),
                description: (description as CostCodeObjType).label,
                vendor: processInvoiceFormState['vendor-name'].value as string,
                uuid: invoiceId,
                isInvoice: true,
                isLaborFee: null,
              },
            },
          });
        }
      }
      // LINE ITEMS
      else {
        const dataObj: {
          [changeOrderId: string]: ChangeOrderContent;
        } = {};
        Object.entries(groupedLineItems).forEach(
          ([lineItemNumber, lineItem]) => {
            const changeOrder = lineItem.change_order;
            // check if we are changing the project assignment for this invoice and skip
            // any change order operations if this is case
            if (changeOrder !== null && !isProjectNameChanged) {
              const newItem: ChangeOrderContentItem = {
                costCode: lineItem.cost_code as string,
                totalAmt: formatNumber(
                  (+(lineItem.amount as string).replaceAll(',', '')).toFixed(2)
                ),
                description: lineItem.work_description as string,
                vendor: processInvoiceFormState['vendor-name'].value as string,
                qtyAmt: '1',
                rateAmt: formatNumber(
                  (+(lineItem.amount as string).replaceAll(',', '')).toFixed(2)
                ),
                uuid: invoiceId,
                isInvoice: true,
                isLaborFee: null,
              };
              const key = `${lineItemNumber}::${invoiceId}`;
              dataObj[changeOrder.uuid] = {
                ...dataObj[changeOrder.uuid],
                [key]: newItem,
              };
            }
          }
        );
        changeOrderContentList.push(dataObj);

        processedInvoiceData;
      }

      const changeOrderContent = changeOrderContentList.reduce((acc, curr) => {
        return { ...acc, ...curr };
      });

      // add the change order content to the change orders summary data for use in the change order tab
      thunkAPI.dispatch(
        projectDataActions.addChangeOrderContent({
          content: changeOrderContent,
          projectId: projectData.uuid as string,
          formState: processInvoiceFormState,
          snapShotFormState,
          lineItems,
          itemId: invoiceId,
        })
      );
      // update content on change order summary
      thunkAPI.dispatch(
        addUpdatedChangeOrderContent({
          companyId,
          projectId: projectData.uuid as string,
        })
      );

      // in the following logic groupedLineItems and the new or current ones,
      // while snapShotLineItems are the old ones to compare to
      type ChangeOrderCont = { name: string; uuid: string };
      let changeOrderObj: ChangeOrderCont | null = null;
      let updatedLineItems: InvoiceLineItem = {};

      // Check if formState contains a value for this change order.
      // If it does, it implies the change order applies to the entire invoice.
      // Consequently, we set all line item change orders to null when the entire invoice change order is set.
      // Additionally, there's a check for the line-item-toggle switch.
      // This allows setting a whole invoice change order even if line items have their own change orders.
      if (
        processInvoiceFormState?.['change-order']?.value &&
        processInvoiceFormState['change-order'].value !== 'None' &&
        !isProjectNameChanged
      ) {
        // You can't select a change order unless it already exists in the data so this
        // can never be undefined or null so force with !
        const changeOrder = Object.values(changeOrdersSummary).find(
          (changeOrder) => {
            return (
              changeOrder.name === processInvoiceFormState['change-order'].value
            );
          }
        )!;
        changeOrderObj = {
          uuid: changeOrder.uuid as string,
          name: changeOrder.name as string,
        };
        // make all line items change orders null
        updatedLineItems = Object.fromEntries(
          Object.entries(groupedLineItems).map(([key, value]) => {
            return [key, { ...value, change_order: null }];
          })
        );
      }
      // Here we check if the any line items were added or
      else if (
        groupedLineItems &&
        Object.keys(groupedLineItems).length > 0 &&
        Object.keys(snapShotLineItems as InvoiceLineItem).length !== 0
      ) {
        Object.entries(groupedLineItems).forEach(([item]) => {
          updatedLineItems[item] = {
            ...groupedLineItems[item],
            page: groupedLineItems[item].page || null,
            bounding_box: groupedLineItems[item].bounding_box || null,
          };
        });
        // no current line items exist, just take the new ones
      } else {
        changeOrderObj = null;
        updatedLineItems = groupedLineItems; // which will equal just {}
      }
      const processedInvoiceDataUpdated: ProcessedInvoiceData = {
        ...processedInvoiceData,
        ...{ change_order: changeOrderObj },
        ...{ line_items: updatedLineItems },
      };

      const project =
        processInvoiceFormState?.['project-name']?.value === 'Unassign'
          ? {
              address: null,
              uuid: null,
              name: null,
            }
          : {
              address: projectData['address'],
              uuid: projectData['uuid'],
              name: projectData['projectName'],
            };

      thunkAPI.dispatch(
        companyDataActions.addProcessedInvoiceData({
          isProcessed: state.addProcessInvoiceForm.isUpdated.value as boolean,
          invoiceId,
          project,
          processedInvoiceData: processedInvoiceDataUpdated,
        })
      );

      const data = await fetchWithRetry(
        `/api/${companyId}/invoices/update-invoice-data`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            isProcessed: state.addProcessInvoiceForm.isUpdated.value,
            invoiceId,
            project,
            processedInvoiceData: processedInvoiceDataUpdated,
          }),
        }
      );

      thunkAPI.dispatch(
        uiActions.notify({
          content: data.message,
          icon: 'save',
        })
      );
    } catch (error) {
      thunkAPI.dispatch(
        uiActions.notify({
          content:
            'Something went wrong with saving processed invoice. Please try again.',
          icon: 'error',
        })
      );
      console.error(error);
      return;
    }
    // finally {
    //   thunkAPI.dispatch(uiActions.unLockUI());
    // }
  }
);

export const approveInvoice = createAsyncThunk(
  'invoiceUpdates/approveInvoice',
  async (
    {
      companyId,
      invoiceId,
      isApproved,
    }: {
      companyId: string;
      invoiceId: string;
      isApproved: boolean;
    },
    thunkAPI
  ) => {
    try {
      const data = await fetchWithRetry(
        `/api/${companyId}/invoices/approve-invoice`,
        {
          method: 'PATCH',
          body: invoiceId,
          headers: {
            isapproved: isApproved.toString(),
          },
        }
      );

      thunkAPI.dispatch(
        uiActions.notify({
          content: data.message,
          icon: 'save',
        })
      );
      // thunkAPI.dispatch(
      //   companyDataActions.approveInvoiceState({ invoiceId, isApproved })
      // );
      // thunkAPI.dispatch(invoiceActions.updateInvoiceApproval(isApproved));
    } catch (error) {
      thunkAPI.dispatch(
        uiActions.notify({
          content:
            'Something went wrong with saving processed invoice. Please try again.',
          icon: 'error',
        })
      );
      console.error(error);
      return;
    }
  }
);

// run this when deleting an invoice
export const removeInvoiceFromChangeOrderThunk = createAsyncThunk(
  'invoiceUpdates/removeInvoiceFromChangeOrder',
  async (
    {
      projectId,
      invoiceChangeOrders,
      companyId,
    }: {
      projectId: string;
      invoiceChangeOrders: { [changeOrderId: string]: string[] };
      companyId: string;
    },
    thunkAPI
  ) => {
    Object.entries(invoiceChangeOrders).forEach(
      ([changeOrderId, invoiceIds]) => {
        thunkAPI.dispatch(
          projectDataActions.removeInvoiceIdFromChangeOrder({
            changeOrderId,
            invoiceId: invoiceIds,
            projectId,
          })
        );
      }
    );
    try {
      const data = await fetchWithRetry(
        `/api/${companyId}/projects/${projectId}/remove-invoices-from-change-order`,
        {
          method: 'PATCH',
          body: JSON.stringify(invoiceChangeOrders),
        }
      );

      thunkAPI.dispatch(
        uiActions.notify({
          content: data.message,
          icon: 'success',
        })
      );
    } catch (error) {
      console.error(error);
    }
  }
);

export const removeChangeOrderFromInvoiceThunk = createAsyncThunk(
  'invoiceUpdates/removeChangeOrderFromInvoice',
  async (
    {
      removeFromObj,
    }: {
      removeFromObj: { [invoiceId: string]: string[] };
    },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    const allInvoices: Invoices = snapshotCopy(state.data.invoices.allInvoices);
    const invoicesToUpdate: Invoices = {};
    Object.entries(removeFromObj).forEach(([invoiceId, changeOrderIds]) => {
      if (allInvoices[invoiceId]) {
        const currentInvoiceProcessedData = allInvoices[invoiceId]
          .processedData as ProcessedInvoiceData;
        // can't assign change orders to line items AND the whole invoice.
        // whole invoice check
        if (allInvoices[invoiceId].processedData?.change_order) {
          invoicesToUpdate[invoiceId] = {
            ...allInvoices[invoiceId],
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
          currentInvoiceProcessedData.line_items && // null check
          Object.keys(currentInvoiceProcessedData.line_items as InvoiceLineItem) // empty object check
            .length > 0
        ) {
          const lineItems =
            currentInvoiceProcessedData.line_items as InvoiceLineItem;
          const updatedLineItems: InvoiceLineItem = Object.fromEntries(
            Object.entries(lineItems).filter(([_, item]) => {
              if (item.change_order) {
                return !changeOrderIds.includes(item.change_order.uuid);
              }
            })
          );

          invoicesToUpdate[invoiceId] = {
            ...allInvoices[invoiceId],
            processedData: {
              ...currentInvoiceProcessedData, // processedData is optional but at this point we know it to exist
              line_items: updatedLineItems,
            },
          };
        }
        // dispatch this to the reducer
        state.data.invoices.allInvoices = {
          ...state.data.invoices.allInvoices,
          ...invoicesToUpdate,
        };
        // send the needed data to update invoice to the backend here
        throw new Error('STOP');
        return true;
      } else {
        console.error(`${invoiceId}: Does not exists`);
        return false;
      }
    });
  }
);

const initialDataState = {
  forms: {} as Forms,
  invoices: { status: '', allInvoices: {} as Invoices },
  vendors: { status: '', allVendors: {} as Vendors },
  projectsSummary: { status: '', allProjects: {} },
  vendorsSummary: { status: '', allVendors: {} },
  costCodes: {} as CostCodesData,
  costCodeList: [] as SelectMenuOptions[],
  costCodeNameList: [] as SelectMenuOptions[],
} as ExtendedCompanyData;

export interface NewItem {
  number: string;
  name: string;
  divisionNumber?: number;
  subDivNumber?: number;
}

export const companyDataSlice = createSlice({
  name: 'data',
  initialState: initialDataState,
  reducers: {
    // Cost Codes
    setCostCodeData(state, action: PayloadAction<CostCodesData>) {
      const costCodes = action.payload;
      state.costCodes = { ...costCodes, updated: true };
    },
    changeUpdateStatus(state, action: PayloadAction<boolean>) {
      state.costCodes.updated = action.payload;
    },
    changeUpdateTreeStatus(state, action: PayloadAction<CostCodeTreeData>) {
      const newData: string = JSON.stringify(action.payload.data);
      state.treeData = {
        data: JSON.parse(newData) as TreeData,
        updated: action.payload.updated,
      };
    },
    // Project Summary
    addToProjectsSummaryData(state, action: PayloadAction<ProjectSummary>) {
      const summaryProjectData = action.payload;
      state.projectsSummary.allProjects = {
        ...state.projectsSummary.allProjects,
        ...summaryProjectData,
      };
    },
    removeProjectSummary(state, action: PayloadAction<string[]>) {
      const allProjectsSummary: ProjectSummary = {
        ...state.projectsSummary.allProjects,
      };
      const updatedProjectsSummary: ProjectSummary = Object.keys(
        allProjectsSummary
      )
        .filter((projectId) => !action.payload.includes(projectId))
        .reduce((obj: ProjectSummary, key: string) => {
          obj[key] = allProjectsSummary[key];
          return obj;
        }, {});
      state.projectsSummary.allProjects = { ...updatedProjectsSummary };
    },
    changeSummaryProjectStatus(
      state,
      action: PayloadAction<{ changeStatusTo: boolean; projectIds: string[] }>
    ) {
      const { changeStatusTo, projectIds } = action.payload;

      const allProjectsSummary = { ...state.projectsSummary.allProjects };

      const updatedProjectsSummary: ProjectSummary = Object.keys(
        allProjectsSummary
      )
        .filter((projectId) => projectIds.includes(projectId))
        .reduce((obj: ProjectSummary, key: string) => {
          const projectChangeStatus = {
            ...allProjectsSummary[key],
          };
          projectChangeStatus.isActive = changeStatusTo;
          obj[key] = {
            ...allProjectsSummary[key],
            ...projectChangeStatus,
          };
          return obj;
        }, {});

      state.projectsSummary.allProjects = {
        ...allProjectsSummary,
        ...updatedProjectsSummary,
      };
    },

    // Vendor Summary
    addToVendorsSummaryData(state, action: PayloadAction<VendorSummary>) {
      const summaryVendorData = action.payload;
      state.vendorsSummary.allVendors = {
        ...state.vendorsSummary.allVendors,
        ...summaryVendorData,
      };
    },
    addNewVendor(
      state,
      action: PayloadAction<{
        newVendor: VendorData;
        vendorId: string;
      }>
    ) {
      const { newVendor, vendorId } = action.payload;
      state.vendors.allVendors[vendorId] = { ...newVendor };
    },
    addNewVendorsBulk(state, action: PayloadAction<Vendors>) {
      state.vendors.allVendors = { ...action.payload };
    },
    removeVendorsFromState(state, action: PayloadAction<string[]>) {
      const allVendorsSummary: VendorSummary = {
        ...state.vendorsSummary.allVendors,
      };
      const allVendors: Vendors = {
        ...state.vendors.allVendors,
      };

      const updatedVendors: Vendors = Object.keys(allVendors)
        .filter((vendorId) => !action.payload.includes(vendorId))
        .reduce((obj: Vendors, key: string) => {
          obj[key] = allVendors[key];
          return obj;
        }, {});

      const updatedVendorsSummary: VendorSummary = Object.keys(
        allVendorsSummary
      )
        .filter((vendorId) => !action.payload.includes(vendorId))
        .reduce((obj: VendorSummary, key: string) => {
          obj[key] = allVendorsSummary[key];
          return obj;
        }, {});
      state.vendors.allVendors = { ...updatedVendors };
      state.vendorsSummary.allVendors = { ...updatedVendorsSummary };
    },

    // Invoices
    addInvoicesFromWS(state, action: PayloadAction<Invoices>) {
      const newInvoices: Invoices = action.payload;
      // we want to preserve the order of line_items_1, line_item_2, etc.
      // because they are in order from top to bottom for each page of the invoice
      Object.entries(newInvoices).forEach(
        ([invoiceId, invoiceObj]: [string, InvoiceItem]) => {
          if (invoiceObj?.line_items_gpt) {
            const orderedLineItemKeys = Object.keys(
              invoiceObj.line_items_gpt
            ).sort((a: string, b: string) => {
              const numA = Number(a.split('_').pop());
              const numB = Number(b.split('_').pop());
              return numA - numB;
            });

            const line_items_gpt = orderedLineItemKeys.reduce(
              (obj: InvoiceLineItem, key) => {
                obj[key] = invoiceObj.line_items_gpt[key];
                return obj;
              },
              {}
            );
            const updatedInvoice = { ...invoiceObj, line_items_gpt };
            newInvoices[invoiceId] = updatedInvoice;
          }
        }
      );

      state.invoices.allInvoices = {
        ...newInvoices,
        ...state.invoices?.allInvoices,
      };
    },

    removeInvoicesFromState(state, action: PayloadAction<string[]>) {
      const allInvoices: Invoices = {
        ...state.invoices.allInvoices,
      };

      const updatedInvoices: Invoices = Object.keys(allInvoices)
        .filter((invoiceId) => !action.payload.includes(invoiceId))
        .reduce((obj: Invoices, key: string) => {
          obj[key] = allInvoices[key];
          return obj;
        }, {});
      state.invoices.allInvoices = updatedInvoices;
    },
    updateInvoiceProjectObject(state, action: PayloadAction<Invoices>) {
      const allInvoices: Invoices = { ...state.invoices.allInvoices };
      state.invoices.allInvoices = { ...allInvoices, ...action.payload };
    },
    updateProcessedVendor(
      state,
      action: PayloadAction<{
        invoiceId: string;
        vendor: {
          name: string | null;
          uuid: string | null;
        };
      }>
    ) {
      const { invoiceId, vendor } = action.payload;
      state.invoices.allInvoices[invoiceId].processedData = {
        ...(state.invoices.allInvoices[invoiceId]
          .processedData as ProcessedInvoiceData),
        ...{ vendor },
      };
    },
    addProcessedInvoiceData(
      state,
      action: PayloadAction<{
        isProcessed: boolean;
        invoiceId: string;
        project: {
          address: string | null;
          uuid: string | null;
          name: string | null;
        };
        processedInvoiceData: ProcessedInvoiceData;
      }>
    ) {
      const { isProcessed, invoiceId, project, processedInvoiceData } =
        action.payload;

      state.invoices.allInvoices[invoiceId] = {
        ...state.invoices.allInvoices[invoiceId],
        ...{ project },
        ...{ processedData: processedInvoiceData },
        ...{ processed: isProcessed },
      };
    },
    // TODO refactor this logic so that the following function can be used to complete this task as well
    removeChangeOrderIdFromInvoice(
      state,
      action: PayloadAction<{ invoiceIds: string[] }>
    ) {
      const { invoiceIds } = action.payload;
      const invoicesToUpdate: Invoices = {};
      invoiceIds.forEach(
        (id) =>
          (invoicesToUpdate[id] = {
            ...state.invoices.allInvoices[id],
            processedData: {
              ...(state.invoices.allInvoices[id]
                .processedData as ProcessedInvoiceData),
              change_order: null,
            },
          })
      );
      state.invoices.allInvoices = {
        ...state.invoices.allInvoices,
        ...invoicesToUpdate,
      };
    },
    removeChangeOrderIdsFromInvoices(
      state,
      action: PayloadAction<{ invoicesToUpdate: Invoices }>
    ) {
      const { invoicesToUpdate } = action.payload;
      state.invoices.allInvoices = {
        ...state.invoices.allInvoices,
        ...invoicesToUpdate,
      };
    },
    addGPTLineItems(
      state,
      action: PayloadAction<{
        line_items: InvoiceLineItem;
        invoiceId: string;
      }>
    ) {
      const { line_items, invoiceId } = action.payload;
      state.invoices.allInvoices[invoiceId] = {
        ...state.invoices.allInvoices[invoiceId],
        ...{ line_items_gpt: line_items },
      };
    },
    approveInvoiceState(
      state,
      action: PayloadAction<{ invoiceId: string; isApproved: boolean }>
    ) {
      const { invoiceId, isApproved } = action.payload;
      state.invoices.allInvoices[invoiceId].approved = isApproved;
    },
    removeInvoicesAttachedToClientBill(
      state,
      action: PayloadAction<{ invoiceIds: string[] }>
    ) {
      const { invoiceIds } = action.payload;
      const allInvoices = state.invoices.allInvoices as Invoices;
      const removedInvoices = Object.fromEntries(
        Object.entries(allInvoices).filter(([_, invoice]) => {
          return !invoiceIds.includes(invoice.doc_id);
        })
      );
      state.invoices.allInvoices = { ...removedInvoices };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(RESET_STATE, (state) => initialDataState)
      .addCase(updateInvoices.fulfilled, (state, action) => {
        state.invoices.allInvoices = {
          ...state.invoices.allInvoices,
          ...action.payload,
        };
      })
      .addCase(updateInvoices.rejected, () => {
        // state.invoices.allInvoices = {
        //   ...state.invoices.allInvoices,
        //   ...action.payload,
        // };
      })
      .addCase(
        fetchCompanyData.fulfilled,
        (state, action: PayloadAction<any>) => {
          const baseForms = JSON.parse(action.payload.forms.value);
          const forms = {
            status: action.payload.forms.status,
            ...baseForms,
          } as Forms;
          state.forms = { ...forms };

          const allInvoices: Invoices = JSON.parse(
            action.payload.invoices.value
          );

          // we want to preserve the order of line_items_1, line_item_2, etc.
          // because they are in order from top to bottom for each page of the invoice

          Object.entries(allInvoices).forEach(
            ([invoiceId, invoice]: [string, InvoiceItem]) => {
              const sorted_line_items_gpt = invoice.line_items_gpt
                ? sortLineItems(invoice.line_items_gpt)
                : {};
              const sorted_line_items: InvoiceLineItem | object | null = invoice
                .processedData?.line_items
                ? sortLineItems(invoice.processedData.line_items)
                : null;

              const updatedProcessedData = sorted_line_items
                ? ({
                    ...invoice.processedData,
                    line_items: sorted_line_items,
                  } as ProcessedInvoiceData)
                : (invoice.processedData as ProcessedInvoiceData);

              const updatedInvoice: InvoiceItem = {
                ...invoice,
                line_items_gpt: sorted_line_items_gpt,
                ...(updatedProcessedData && {
                  processedData: updatedProcessedData,
                }),
              };

              allInvoices[invoiceId] = updatedInvoice;
            }
          );

          state.invoices = {
            ...{
              status: action.payload.invoices.status as string,
              allInvoices,
            },
          };

          const vendorsPayload: {
            [id: string]: {
              'vendor-details': VendorData;
              'vendor-summary': VendorSummaryItem;
            };
          } = JSON.parse(action.payload.vendors.value);

          const vendorsDetailsPayload = Object.fromEntries(
            Object.entries(vendorsPayload).map(
              ([key, value]: [
                string,
                {
                  'vendor-details': VendorData;
                  'vendor-summary': VendorSummaryItem;
                },
              ]) => [key, value['vendor-details']]
            )
          );

          const vendorsSummaryPayload = Object.fromEntries(
            Object.entries(vendorsPayload).map(
              ([key, value]: [
                string,
                {
                  'vendor-details': VendorData;
                  'vendor-summary': VendorSummaryItem;
                },
              ]) => [key, value['vendor-summary']]
            )
          );

          state.vendors = {
            ...{
              status: action.payload.vendors.status,
              allVendors: { ...vendorsDetailsPayload } || {},
            },
          };

          state.vendorsSummary = {
            ...{
              status: action.payload.vendors.status,
              allVendors: { ...vendorsSummaryPayload } || {},
            },
          };

          const costCodes = costCodeData2NLevel(
            JSON.parse(action.payload.costCodes.value)
          );
          const codes = {
            status: action.payload.costCodes.status,
            ...costCodes,
          };

          state.costCodes = codes;

          const { costCodeList, costCodeNameList } =
            createCostCodeList(costCodes);
          state.costCodeList = costCodeList;
          state.costCodeNameList = costCodeNameList;
        }
      );
  },
});

export const companyDataActions = companyDataSlice.actions;
