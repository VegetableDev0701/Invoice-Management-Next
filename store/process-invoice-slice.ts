import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import {
  FormStateV2,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import { RESET_STATE } from '@/lib/globals';

const initialSingleInvoiceFormState: FormStateV2 = {
  numRecurringFees: { value: 0 },
  isUpdated: { value: false },
};

const singleInvoiceFormSlice = createSlice({
  name: 'singleInvoiceForm',
  initialState: initialSingleInvoiceFormState,
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
      return initialSingleInvoiceFormState;
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
    setIsUpdatedState(state, action: PayloadAction<boolean>) {
      console.log('setIsUpdatedState', state.isUpdated);
      Object.prototype.hasOwnProperty.call(state, 'isUpdated')
        ? (state.isUpdated.value = action.payload)
        : true;
    },
    resetFormValidation(state) {
      console.log('state', state);
      return resetAllFormValidation(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, () => initialSingleInvoiceFormState);
  },
});

export default singleInvoiceFormSlice;
export const singleInvoiceFormActions = singleInvoiceFormSlice.actions;
