import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import {
  FormStateV2,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import { RESET_STATE } from '@/lib/globals';

const initialSingleClientBillInvoiceState: FormStateV2 = {
  numRecurringFees: { value: 0 },
  isUpdated: { value: false },
};

const singleClientBillInvoiceSlice = createSlice({
  name: 'singleClientBillInvoice',
  initialState: initialSingleClientBillInvoiceState,
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
      return initialSingleClientBillInvoiceState;
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
      if (Object.prototype.hasOwnProperty.call(state, 'isUpdated')) {
        state.isUpdated.value = action.payload
      }
    },
    resetFormValidation(state) {
      return resetAllFormValidation(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, () => initialSingleClientBillInvoiceState);
  },
});

export default singleClientBillInvoiceSlice;
export const singleClientBillInvoiceFormActions = singleClientBillInvoiceSlice.actions;
