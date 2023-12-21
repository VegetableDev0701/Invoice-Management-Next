import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { RootState } from '@/store/index';
import { uiActions } from './ui-slice';
import { companyDataActions } from './company-data-slice';
import { sseActions } from './sse-slice';
import { projectDataActions } from './projects-data-slice';
import { addUpdatedChangeOrderContent } from './add-change-order';

import {
  InvoiceProject,
  InvoiceTableRow,
  Invoices,
  InvoiceLineItem,
  InvoiceLineItemItem,
  ProcessedInvoiceData,
  InvoiceItem,
} from '@/lib/models/invoiceDataModels';
import { FormStateItemV2, FormStateV2 } from '@/lib/models/formStateModels';
import { CostCodeObjType } from '@/lib/models/projectDataModel';
import { isObjectEmpty, snapshotCopy } from '@/lib/utility/utils';
import {
  ChangeOrderSummary,
  SummaryProjects,
  VendorSummary,
} from '@/lib/models/summaryDataModel';
import { extractLineItems, groupLineItems } from '@/lib/utility/invoiceHelpers';
import {
  ChangeOrderContent,
  ChangeOrderContentItem,
} from '@/lib/models/changeOrderModel';
import { getChangeOrderIdFromName } from '@/lib/utility/processInvoiceHelpers';
import { formatNumber } from '@/lib/utility/formatter';
import { fetchWithRetry } from '@/lib/utility/ioUtils';
import { RESET_STATE } from '@/lib/globals';

export const getSignedUrlInvoice = createAsyncThunk(
  'invoiceUpdates/getSignedUrl',
  async ({
    companyId,
    invoice,
  }: {
    companyId: string;
    invoice: InvoiceTableRow;
  }) => {
    try {
      const response = await fetch(
        `/api/${companyId}/invoices/get-signed-url`,
        {
          method: 'GET',
          headers: {
            docId: invoice.doc_id,
            filenames: JSON.stringify(invoice.gcs_img_uri),
          },
        }
      );
      const data = await response.json();
      return {
        invoiceId: invoice.doc_id,
        signedUrls: data.signed_urls,
        expiration: data.expiration,
      };
    } catch (error) {
      console.error(error);
    }
  }
);

export const autoAssignSelectedInvoices = createAsyncThunk(
  'invoiceUpdates/autoAssignSelectedInvoices',
  async (invoicesToUpdate: InvoiceTableRow[], thunkAPI) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const allInvoices = { ...state.data.invoices.allInvoices }; // Access invoices from data slice
      const invoiceProjects = { ...state.invoice.invoiceProjects }; // Access invoiceProjects from invoice slice

      const updatedInvoices = invoicesToUpdate.map((invoice) => {
        const predicted_project = allInvoices[invoice.doc_id].predicted_project;

        if (
          predicted_project.name !== null &&
          predicted_project.name !== 'unknown'
        ) {
          invoiceProjects[invoice.doc_id] = {
            name: predicted_project.name,
            address: predicted_project.address,
            // project_key: predicted_project.project_key,
            uuid: predicted_project.uuid,
          };
          return {
            [invoice.doc_id]: invoiceProjects[invoice.doc_id],
          };
        }
        return { [invoice.doc_id]: null };
      });
      // Dispatch an action to update the state
      thunkAPI.dispatch(invoiceSlice.actions.updateInvoices(updatedInvoices));
    } catch (error) {
      console.error(error);
    }
  }
);

export const deleteInvoices = createAsyncThunk(
  'invoiceUpdates/deleteInvoices',
  async (
    {
      companyId,
      invoicesToDelete,
    }: { companyId: string; invoicesToDelete: string[] },
    thunkAPI
  ) => {
    try {
      const response = await fetch(
        `/api/${companyId}/invoices/delete-invoices`,
        {
          method: 'DELETE',
          body: JSON.stringify(invoicesToDelete),
        }
      );
      if (!response.ok) {
        throw new Error(`Something went wrong: ${response.status}`);
      }

      if (response.status >= 200 && response.status < 300) {
        thunkAPI.dispatch(
          sseActions.setWhatToListenFor({
            sseContentType: 'delete-invoices',
          })
        );
      }
      const data = await response.json();
      thunkAPI.dispatch(
        uiActions.notify({
          content: data.message,
          icon: 'trash',
        })
      );
    } catch (error) {
      console.error(error);
    }
  }
);

export const generateLineItems = createAsyncThunk(
  'invoiceUpdates/generateLineItems',
  async (
    {
      companyId,
      invoiceId,
      projectId,
      lineItemsObject,
    }: {
      companyId: string;
      invoiceId: string;
      projectId: string;
      lineItemsObject: {
        [key: number]: { type: string; value: string; topHeight: number };
      };
    },
    thunkAPI
  ) => {
    try {
      const response = await fetch(
        `/api/${companyId}/projects/${projectId}/get-line-items`,
        {
          method: 'POST',
          body: JSON.stringify(lineItemsObject),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok) {
        throw new Error(
          `Error patching GPT processed line items: ${response.status}`
        );
      }
      const data = await response.json();
      thunkAPI.dispatch(invoiceSlice.actions.setLineItems(data.data));
      thunkAPI.dispatch(
        companyDataActions.addGPTLineItems({
          line_items: data.data,
          invoiceId: invoiceId,
        })
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
);

export const sendGeneratedLineItemsToFirestore = createAsyncThunk(
  'invoiceUpdates/sendGeneratedLineItemsToFirestore',
  async (
    { companyId, invoiceId }: { companyId: string; invoiceId: string },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    if (state.invoice?.clickedInvoice?.line_items_gpt) {
      try {
        const line_items_gpt = state.invoice.clickedInvoice.line_items_gpt;
        const response = await fetch(
          `/api/${companyId}/invoices/post-gpt-line-items`,
          {
            method: 'PATCH',
            body: JSON.stringify(line_items_gpt),
            headers: { invoiceId: invoiceId },
          }
        );
        if (!response.ok) {
          throw new Error(`Something went wrong: ${response.status}`);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
);

export const updateInvoiceData = createAsyncThunk(
  'invoiceUpdates/clientBillData',
  async (
    {
      invoiceId,
      companyId,
      projectName,
      snapShotInvoice,
      snapShotFormState,
    }: {
      invoiceId: string;
      companyId: string;
      projectName: string | null;
      snapShotInvoice: InvoiceItem;
      snapShotFormState: FormStateV2;
    },
    thunkAPI
  ) => {
    try {
      const state = thunkAPI.getState() as RootState;
      // because of how the componenets render, we need to take a snapshot of the current invoice
      // when moving through each process invoice step without closing the overlay.
      const processInvoiceFormState = state.invoice
        .currentInvoiceSnapShot as FormStateV2 & { doc_id: string };
      const costCodeList: CostCodeObjType[] = state.data.costCodeList;
      const costCodeNameList: CostCodeObjType[] = state.data.costCodeNameList;
      const vendorsSummary: VendorSummary | object =
        state.data.vendorsSummary.allVendors;
      const snapShotLineItems: InvoiceLineItem | undefined = snapShotInvoice
        ?.processedData?.line_items
        ? snapshotCopy(
            (snapShotInvoice.processedData as ProcessedInvoiceData).line_items
          )
        : null;
      const projectData = Object.values(
        state.data.projectsSummary.allProjects as SummaryProjects
      ).filter((project) => project.projectName === projectName)[0];

      const changeOrdersSummary = state.projects[projectData.uuid as string][
        'change-orders-summary'
      ] as ChangeOrderSummary;

      const matchedVendorSummary =
        !isObjectEmpty(vendorsSummary) &&
        Object.values(vendorsSummary).find((vendor) => {
          if (vendor && processInvoiceFormState?.['vendor-name']?.value) {
            return (
              vendor.vendorName ===
              processInvoiceFormState?.['vendor-name']?.value
            );
          }
        });

      const processedInvoiceData = {
        invoice_id: processInvoiceFormState?.['invoice-number']?.value
          ? (processInvoiceFormState['invoice-number'].value as string)
          : '',
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
        total_tax_amount: processInvoiceFormState?.['total-tax']?.value
          ? (processInvoiceFormState['total-tax'].value as string)
          : '',
        total_amount: processInvoiceFormState?.['invoice-total']?.value
          ? (processInvoiceFormState['invoice-total'].value as string)
          : '',
        approver: processInvoiceFormState?.['approver']?.value
          ? (processInvoiceFormState['approver'].value as string)
          : '',
        is_credit: processInvoiceFormState?.['credit']?.value
          ? (processInvoiceFormState['credit'].value as boolean)
          : false,
        date_received: processInvoiceFormState?.['date-received']?.value
          ? (processInvoiceFormState['date-received'].value as string)
          : '',
        line_items_toggle: processInvoiceFormState?.['line-item-toggle']?.value
          ? (processInvoiceFormState['line-item-toggle'].value as boolean)
          : false,
        billable: snapShotInvoice.processedData?.billable || false,
      };

      const numLineItems = +(state.addProcessInvoiceForm.numLineItems.value as
        | string
        | number);
      // filter out the line items from the rest of the processed invoice state
      const lineItems = extractLineItems({
        formState: processInvoiceFormState,
        numLineItems,
      }) as Record<string, FormStateItemV2>;

      // create an object with the line items data with the key === line item number
      // change orders require the {name, uuid} object so we can show the name but
      // use the uuid in teh background
      let groupedLineItems: InvoiceLineItem = {};
      if (lineItems) {
        const lineItemBoundingBoxes = snapShotInvoice?.line_items_gpt;

        groupedLineItems = groupLineItems({
          lineItems,
          changeOrdersSummary,
          lineItemBoundingBoxes,
        });
      }

      // Check to make sure that the user has not selected a change order for any line items
      // and the whole invoice. This wouldn't make sense becuase the whole invoice line item would
      // cover all line items, and this will not be the desired behavior.
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

      const wholeInvoiceChangeOrderValue =
        processInvoiceFormState['change-order'].value;
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

        // niether of these should ever happen but just to be sure
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
        // already exist so we can force the description type here
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
      // LINE ITEMS
      else {
        const dataObj: {
          [changeOrderId: string]: ChangeOrderContent;
        } = {};
        Object.entries(groupedLineItems).forEach(
          ([lineItemNumber, lineItem]) => {
            const changeOrder = lineItem.change_order;
            if (changeOrder !== null) {
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

      // in teh following logic groupedLineItems and the new or current ones,
      // while snapShotLineItems are the old ones to compare to
      type ChangeOrderCont = { name: string; uuid: string };
      let changeOrderObj: ChangeOrderCont | null = null;
      let updatedLineItems: InvoiceLineItem = {};
      // if the formState has a value for this change-order we know that it is for
      // the whole invoice, and therefore no line items can have a change order on them
      if (
        processInvoiceFormState?.['change-order']?.value &&
        processInvoiceFormState['change-order'].value !== 'None'
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
      // if the line items have not been edited at all, don't have to check them for updates
      else if (
        groupedLineItems &&
        !isObjectEmpty(groupedLineItems) &&
        !isObjectEmpty(snapShotLineItems as InvoiceLineItem)
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
        ...{ line_items: groupedLineItems },
      };

      return {
        ...snapShotInvoice,
        processedData: processedInvoiceDataUpdated,
      };
    } catch (error) {
      thunkAPI.dispatch(
        uiActions.notify({
          content:
            'Something went wrong with updating invoice data. Please try again.',
          icon: 'error',
        })
      );
      console.error(error);
      return;
    }
  }
);

/**
 * When we update the invoie name or address in project details this new project name and address
 * must get propogated to each invoice project object so that it shows up correctly
 * in the processing invoice step and we make sure that all data is in alignment.
 */
export const updateInvoiceProjectObject = createAsyncThunk(
  'invoiceUpdates/updateInvoiceProjectData',
  async (
    {
      projectId,
      companyId,
      newProjectName,
      newProjectAddress,
    }: {
      projectId: string;
      companyId: string;
      newProjectName: string;
      newProjectAddress: string;
    },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    // const projectSummary = state.data.projectsSummary.allProjects[projectId];
    // const newProjectName = projectSummary.projectName;
    // const newProjectAddress = projectSummary.address;
    const invoicesToUpdate = Object.entries(state.data.invoices.allInvoices)
      .filter(([_, invoice]) => invoice.project.uuid === projectId)
      .reduce((updatedInvoices, [invoiceId, invoice]) => {
        const updatedInvoice = {
          ...invoice,
          project: {
            ...invoice.project,
            name: newProjectName,
            address: newProjectAddress,
          },
        };
        updatedInvoices[invoiceId] = updatedInvoice;
        return updatedInvoices;
      }, {} as Invoices);

    thunkAPI.dispatch(
      companyDataActions.updateInvoiceProjectObject(invoicesToUpdate)
    );
    try {
      // create the invoice project object
      const updateInvoiceProjects = Object.entries(invoicesToUpdate).reduce(
        (acc, [invoiceId, invoice]) => {
          acc[invoiceId] = invoice.project;
          return acc;
        },
        {} as { [invoiceId: string]: InvoiceProject }
      );
      const data = await fetchWithRetry(
        `/api/${companyId}/invoices/update-projects`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateInvoiceProjects),
        }
      );
      thunkAPI.dispatch(
        uiActions.notify({
          content: data.message,
          icon: 'save',
        })
      );
    } catch (error: any) {
      thunkAPI.dispatch(
        uiActions.notify({
          content:
            'Something went wrong with updating projects info for the invoices. Please try again.',
          icon: 'error',
        })
      );
    }
  }
);

export interface InvoiceState {
  isLoading: boolean;
  signedUrls: {
    [invoiceId: string]: { signedUrls: string[]; expiration: string };
  };
  invoiceRowNumber?: number;
  clickedInvoice: InvoiceTableRow | null;
  isRowClicked: boolean;
  invoiceProjects: { [invoiceId: string]: InvoiceProject };
  anyInvoiceUpdated: boolean;
  filteredData: Invoices[];
  isDeleted: boolean;
  isApproved: boolean;
  currentInvoiceSnapShot?: FormStateV2 & { doc_id: string };
}

const initialInvoiceState: InvoiceState = {
  isLoading: false,
  isRowClicked: false,
  invoiceRowNumber: undefined,
  clickedInvoice: null,
  signedUrls: {},
  invoiceProjects: {},
  anyInvoiceUpdated: false,
  filteredData: [],
  isDeleted: false,
  isApproved: false,
  currentInvoiceSnapShot: {} as FormStateV2 & { doc_id: string },
};

const invoiceSlice = createSlice({
  name: 'invoiceUpdates',
  initialState: initialInvoiceState,
  reducers: {
    setClicked(
      state,
      action: PayloadAction<{
        invoice: InvoiceTableRow | null;
        isRowClicked: boolean;
        rowNumber?: number;
      }>
    ) {
      const { invoice, isRowClicked, rowNumber } = action.payload;
      state.clickedInvoice = invoice;
      state.isRowClicked = isRowClicked;
      state.invoiceRowNumber = rowNumber;

      if (isRowClicked) {
        state.currentInvoiceSnapShot = {} as FormStateV2 & {
          doc_id: string;
        };
      }
    },
    getInvoiceSnapshot(
      state,
      action: PayloadAction<{ formState: FormStateV2; doc_id: string }>
    ) {
      const { formState, doc_id } = action.payload;
      state.currentInvoiceSnapShot = { ...formState, doc_id } as FormStateV2 & {
        doc_id: string;
      };
    },
    updateInvoiceProject(
      state,
      action: PayloadAction<{ [invoiceId: string]: InvoiceProject }>
    ) {
      state.invoiceProjects = { ...state.invoiceProjects, ...action.payload };
    },
    updateInvoices: (
      state,
      action: PayloadAction<{ [invoiceId: string]: InvoiceProject | null }[]>
    ) => {
      const updatedInvoiceProjects = action.payload;
      const newInvoiceProjects: { [invoiceId: string]: InvoiceProject }[] = [];
      updatedInvoiceProjects.forEach((invoice) => {
        const [key, value] = Object.entries(invoice)[0];
        if (value) {
          newInvoiceProjects.push({ [key]: value });
        }
      });
      const reducedObj = newInvoiceProjects.reduce((obj, item) => {
        return { ...obj, ...item };
      }, {});
      state.invoiceProjects = { ...state.invoiceProjects, ...reducedObj };
      state.anyInvoiceUpdated = true;
    },
    setFilteredData: (state, action: PayloadAction<Invoices[]>) => {
      state.filteredData = action.payload;
    },
    setLineItems: (state, action: PayloadAction<InvoiceLineItem>) => {
      if (state.clickedInvoice) {
        state.clickedInvoice.line_items_gpt = action.payload;
      }
    },
    updateInvoiceApproval: (state, action: PayloadAction<boolean>) => {
      if (state.clickedInvoice) {
        const approval = action.payload ? 'Yes' : 'No';
        state.clickedInvoice.approved = approval;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, () => initialInvoiceState);
    builder.addCase(getSignedUrlInvoice.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getSignedUrlInvoice.fulfilled, (state, action) => {
      const { invoiceId, signedUrls, expiration } = action.payload as {
        invoiceId: string;
        signedUrls: string[];
        expiration: string;
      };
      state.signedUrls[invoiceId] = { signedUrls, expiration };
      state.isLoading = false;
    });
    builder.addCase(getSignedUrlInvoice.rejected, (state, action) => {
      console.error(action.error);
      state.isLoading = false;
    });
  },
});

export default invoiceSlice;
export const invoiceActions = invoiceSlice.actions;
