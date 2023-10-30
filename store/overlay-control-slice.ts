import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '.';
import {
  ChangeOrderData,
  LaborData,
  VendorData,
} from '@/lib/models/formDataModel';
import { FormData } from '@/lib/models/types';
import { createSectionBox } from '@/lib/utility/processInvoiceHelpers';
import { ContractEntry } from '@/lib/models/summaryDataModel';
import { BoundingBox } from '@/lib/models/invoiceDataModels';

interface OverlayGroup {
  [key: string]: OverlayContent;
}

export interface OverlayContent {
  overlayTitle?: string;
  overlaySubtitle?: string;
  open?: boolean;
  isSave?: boolean;
  currentData?: FormData | { [key: string]: any } | null;
  currentId?: string | null | undefined;
  isNameDuped?: boolean;
  currentBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  } | null;
}

export const getCurrentProjectData = createAsyncThunk(
  'overlay/getCurrentProjectData',
  async (
    {
      id,
      projectId,
      stateKey,
    }: { id: string; projectId: string; stateKey: string },
    { getState, dispatch }
  ) => {
    try {
      const state = getState() as RootState;
      const formData: LaborData | ChangeOrderData | ContractEntry =
        state.projects[projectId][
          stateKey as 'labor' | 'contracts' | 'change-orders'
        ][id];
      dispatch(
        overlaySlice.actions.setCurrentOverlayData({
          data: {
            currentData: formData,
            currentId: id,
          },
          stateKey,
        })
      );
    } catch (error: any) {
      console.error(error);
    }
  }
);
export const getCurrentVendor = createAsyncThunk(
  'overlay/getCurrentVendor',
  async ({ vendorId }: { vendorId: string }, { getState, dispatch }) => {
    try {
      const state = getState() as RootState;
      const vendor: VendorData = state.data.vendors[vendorId];
      dispatch(
        overlaySlice.actions.setCurrentOverlayData({
          data: {
            currentData: vendor,
            currentId: vendorId,
          },
          stateKey: 'vendors',
        })
      );
    } catch (error: any) {
      console.error(error);
    }
  }
);

const overlayIntitialState: OverlayGroup = {
  labor: {
    overlayTitle: '',
    overlaySubtitle: '',
    open: false,
    isSave: true,
    currentData: null,
    currentId: null,
  },
  contracts: {
    overlayTitle: '',
    overlaySubtitle: '',
    open: false,
    isSave: true,
    currentData: null,
    currentId: null,
  },
  'change-orders': {
    overlayTitle: '',
    overlaySubtitle: '',
    open: false,
    isSave: true,
    currentData: null,
    currentId: null,
    isNameDuped: false,
  },
  vendors: {
    overlayTitle: '',
    overlaySubtitle: '',
    open: false,
    isSave: true,
    currentData: null,
    currentId: null,
  },
  'process-invoices': {
    overlayTitle: '',
    overlaySubtitle: '',
    open: false,
    isSave: true,
    currentData: null,
    currentId: null,
    currentBoundingBox: null,
  },
};

const overlaySlice = createSlice({
  name: 'overlay',
  initialState: overlayIntitialState,
  reducers: {
    setOverlayContent(
      state,
      action: PayloadAction<{ data: OverlayContent; stateKey: string }>
    ) {
      const { data, stateKey } = action.payload;
      const newData = Object.entries(data).reduce(
        (obj: { [key: string]: string | boolean }, [key, value]) => {
          if (value !== undefined) {
            obj[key] = value;
          }
          return obj;
        },
        {}
      );
      state[stateKey] = { ...state[stateKey], ...newData };
    },
    setCurrentOverlayData(
      state,
      action: PayloadAction<{
        data: {
          currentData: LaborData | ChangeOrderData | ContractEntry | null;
          currentId: string | null;
        };
        stateKey: string;
      }>
    ) {
      const { data, stateKey } = action.payload;
      state[stateKey] = { ...state[stateKey], ...data };
    },
    setCurrentInvoiceEntityBox(
      state,
      action: PayloadAction<{
        boundingBox: BoundingBox[] | null | undefined;
        buffer?: number;
      }>
    ) {
      const { boundingBox } = action.payload;
      const boundingBoxSection = createSectionBox({ boundingBox });
      if (boundingBoxSection) {
        let { x, y, width, height, page } = boundingBoxSection;
        page = page as number;
        state['process-invoices'].currentBoundingBox = {
          x,
          y,
          width,
          height,
          page,
        };
      }
    },
    removeCurrentInvoiceEntityBox(state) {
      state['process-invoices'].currentBoundingBox = null;
    },
  },
});

export default overlaySlice;
export const overlayActions = overlaySlice.actions;
