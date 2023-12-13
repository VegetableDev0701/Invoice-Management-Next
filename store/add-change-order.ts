import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  FormState,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import { fetchWithRetry } from '@/lib/utility/ioUtils';
import { uiActions } from './ui-slice';
import { RootState } from '.';
import { snapshotCopy } from '@/lib/utility/utils';
import { ChangeOrderSummary } from '@/lib/models/summaryDataModel';
import { ChangeOrderContent } from '@/lib/models/changeOrderModel';
import { ChangeOrderData } from '@/lib/models/formDataModel';
import { updateProjectDataInChangeOrders } from '@/lib/utility/changeOrderHelpers';
import { createSingleChangeOrderSummary } from '@/lib/utility/createSummaryDataHelpers';
import { projectDataActions } from './projects-data-slice';
import { RESET_STATE } from '@/lib/globals';

export const addUpdatedChangeOrderContent = createAsyncThunk(
  'addChangeOrder/updateContent',
  async (
    {
      companyId,
      projectId,
      updatedContent,
    }: {
      companyId: string;
      projectId: string;
      updatedContent?: {
        [changeOrderId: string]: {
          content: ChangeOrderContent;
        };
      };
    },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    const changeOrderSummary: ChangeOrderSummary = snapshotCopy(
      state.projects[projectId]['change-orders-summary']
    );
    let dataToSend: {
      [changeOrderId: string]: {
        content: ChangeOrderContent;
      };
    } = {};
    // subset the data to just the change order keys and their `content`
    // to send to the backend
    if (updatedContent) {
      dataToSend = updatedContent;
    } else {
      Object.entries(changeOrderSummary).forEach(
        ([changeOrderId, changeOrderValue]) => {
          dataToSend[changeOrderId] = {
            content: changeOrderValue.content as ChangeOrderContent,
          };
        }
      );
    }

    try {
      await fetchWithRetry(
        `/api/${companyId}/projects/${projectId}/update-change-order-content`,
        { method: 'PATCH', body: JSON.stringify(dataToSend) }
      );
    } catch (error) {
      thunkAPI.dispatch(
        uiActions.notify({
          content:
            'Something went wrong with updating change order content. Please try again.',
          icon: 'error',
        })
      );
      console.error(error);
      return;
    }
  }
);

export const updateProjectDataInChangeOrdersThunk = createAsyncThunk(
  'addChangeOrder/updateContent',
  async (
    {
      companyId,
      projectId,

      newProjectName,
      newProjectAddress,
      newProjectCity,
      newProjectState,
      newProjectZip,
      newProjectOwnerName,
    }: {
      companyId: string;
      projectId: string;
      newProjectName: string;
      newProjectAddress: string;
      newProjectCity: string;
      newProjectState: string;
      newProjectZip: string;
      newProjectOwnerName: string;
    },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    const changeOrderFormData = state.projects[projectId]['change-orders'];
    const changeOrderSummary =
      state.projects[projectId]['change-orders-summary'];
    const updateChangeOrderFormData = Object.entries(
      changeOrderFormData
    ).reduce(
      (acc, [changeOrderId, changeOrderFormData]) => {
        acc[changeOrderId] = updateProjectDataInChangeOrders({
          formData: changeOrderFormData,
          newProjectName,
          newProjectAddress,
          newProjectCity,
          newProjectState,
          newProjectZip,
          newProjectOwnerName,
        });
        return acc;
      },
      {} as { [changeOrderId: string]: ChangeOrderData }
    );

    const updateChangeOrderSummaryData = Object.entries(
      changeOrderSummary
    ).reduce((acc, [changeOrderId, changeOrderSummary]) => {
      const changeOrderFormData = updateChangeOrderFormData[changeOrderId];
      acc[changeOrderId] = createSingleChangeOrderSummary({
        changeOrder: changeOrderFormData,
        changeOrderId: changeOrderFormData.uuid as string,
        content: changeOrderSummary.content,
      });
      return acc;
    }, {} as ChangeOrderSummary);

    thunkAPI.dispatch(
      projectDataActions.updateBulkChangeOrderFormData({
        updateChangeOrderFormData,
        projectId: projectId,
        stateKey: 'change-orders',
      })
    );
    thunkAPI.dispatch(
      projectDataActions.updateBulkChangeOrderSummaryData({
        updateChangeOrderSummaryData,
        projectId: projectId,
        stateKey: 'change-orders-summary',
      })
    );
    try {
      const data = await fetchWithRetry(
        `/api/${companyId}/projects/${projectId}/update-bulk-change-orders`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullData: updateChangeOrderFormData,
            summaryData: updateChangeOrderSummaryData,
          }),
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
            'Something went wrong with updating change order content. Please try again.',
          icon: 'error',
        })
      );
    }
  }
);

const initialAddChangeOrderFormState: FormState = {};

const addChangeOrderFormSlice = createSlice({
  name: 'addChangeOrderForm',
  initialState: initialAddChangeOrderFormState,
  reducers: {
    setFormElement(state, action: PayloadAction<SetFormElementPayload>) {
      const { inputValue, inputKey, isValid } = action.payload;
      state[inputKey] = {
        ...state[inputKey],
        value: inputValue,
        isValid: isValid,
      };
    },
    clearFormState() {
      return initialAddChangeOrderFormState;
    },
    setIsTouchedState(state, action: PayloadAction<IsTouchedPayload>) {
      const { inputKey, isTouched, isValid } = action.payload;
      state[inputKey] = {
        ...state[inputKey],
        value: state[inputKey]?.value ? state[inputKey].value : '',
        isValid: isValid,
        isTouched: isTouched,
      };
    },
    resetFormValidation(state) {
      return resetAllFormValidation(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, () => initialAddChangeOrderFormState);
  },
});

export default addChangeOrderFormSlice;
export const addChangeOrderFormActions = addChangeOrderFormSlice.actions;
