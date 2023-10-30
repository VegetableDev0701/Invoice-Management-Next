import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { RootState } from '@/store/index';

import { uiActions } from './ui-slice';
import { companyDataActions } from './company-data-slice';
import { sseActions } from './sse-slice';
import {
  InvoiceProject,
  InvoiceTableRow,
  Invoices,
  InvoiceLineItem,
} from '@/lib/models/invoiceDataModels';

export interface InvoiceState {
  isLoading: boolean;
  signedUrls: {
    [invoiceId: string]: { signedUrls: string[]; expiration: string };
  };
  invoiceRowNumber: number | undefined;
  clickedInvoice: InvoiceTableRow | null;
  isRowClicked: boolean;
  invoiceProjects: { [invoiceId: string]: InvoiceProject };
  anyInvoiceUpdated: boolean;
  filteredData: Invoices[];
  isDeleted: boolean;
  isApproved: boolean;
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
};

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
    } catch (error: any) {
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
        uiActions.setNotificationContent({
          content: data.message,
          icon: 'trash',
          openNotification: true,
        })
      );
    } catch (error: any) {
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
        const data = await response.json();
        // Want this step to happen completely in the background and no notification
        // to the user since this is not triggered by them.
        // thunkAPI.dispatch(
        //   uiActions.setNotificationContent({
        //     content: data.message,
        //     icon: 'success',
        //   })
        // );
        // thunkAPI.dispatch(
        //   uiActions.setOpenNotification({ openNotification: true })
        // );
      } catch (error: any) {
        // thunkAPI.dispatch(
        //   uiActions.setNotificationContent({
        //     content: 'Something went wrong with saving GPT LineItems.',
        //     icon: 'error',
        //   })
        // );
        // thunkAPI.dispatch(
        //   uiActions.setOpenNotification({ openNotification: true })
        // );
        console.error(error);
      }
    }
  }
);

const invoiceSlice = createSlice({
  name: 'invoiceUpdates',
  initialState: initialInvoiceState,
  reducers: {
    setClickedInvoice(
      state,
      action: PayloadAction<{
        invoice: InvoiceTableRow | null;
        isRowClicked: boolean;
        invoiceRowNumber?: number;
      }>
    ) {
      const { invoice, isRowClicked, invoiceRowNumber } = action.payload;
      state.clickedInvoice = invoice;
      state.isRowClicked = isRowClicked;
      state.invoiceRowNumber = invoiceRowNumber;
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
      let newInvoiceProjects: { [invoiceId: string]: InvoiceProject }[] = [];
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
