import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  FormState,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import { uiActions } from './ui-slice';

export const deleteVendors = createAsyncThunk(
  'vendorUpdates/deleteVendors',
  async (
    {
      companyId,
      vendorsToDelete,
    }: { companyId: string; vendorsToDelete: string[] },
    thunkAPI
  ) => {
    try {
      const response = await fetch(`/api/${companyId}/vendors/delete-vendors`, {
        method: 'DELETE',
        body: JSON.stringify(vendorsToDelete),
      });
      if (!response.ok) {
        throw new Error(`Something went wrong: ${response.status}`);
      }
      const data = await response.json();
      thunkAPI.dispatch(
        uiActions.notify({
          content: data.message,
          icon: 'trash',
        })
      );
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const initialAddVendorFormState: FormState = {};

const addVendorFormSlice = createSlice({
  name: 'addVendorForm',
  initialState: initialAddVendorFormState,
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
      return initialAddVendorFormState;
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

export default addVendorFormSlice;
export const addVendorFormActions = addVendorFormSlice.actions;
