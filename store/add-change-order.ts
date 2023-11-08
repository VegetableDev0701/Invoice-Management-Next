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
        uiActions.setNotificationContent({
          content:
            'Something went wrong with updating change order content. Please try again.',
          icon: 'error',
          openNotification: true,
        })
      );
      console.error(error);
      return;
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
});

export default addChangeOrderFormSlice;
export const addChangeOrderFormActions = addChangeOrderFormSlice.actions;
