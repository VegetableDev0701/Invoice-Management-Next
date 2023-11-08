import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import {
  FormState,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';

const initialProcessInvoiceFormState: FormState = {
  numLineItems: { value: 0 },
  isUpdated: { value: false },
};

const addProcessInvoiceFormSlice = createSlice({
  name: 'addProcessInvoice',
  initialState: initialProcessInvoiceFormState,
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
      return initialProcessInvoiceFormState;
    },
    setIsTouchedState(state, action: PayloadAction<IsTouchedPayload>) {
      const { inputKey, isTouched, isValid } = action.payload;
      state[inputKey] = {
        ...state[inputKey],
        value: state[inputKey]?.value ? state[inputKey].value : '',
        isValid: isValid,
        isTouched: isTouched,
      };
      state.isUpdated.value = true;
    },
    resetFormValidation(state) {
      return resetAllFormValidation(state);
    },
    removeRecurringFeeState(
      state,
      action: PayloadAction<{ inputKey: string }>
    ) {
      const { inputKey } = action.payload;
      delete state[inputKey];
    },
    incrementLineItem(state) {
      (state.numLineItems.value as number)++;
      state.isUpdated.value = true;
    },
    decrementLineItem(state) {
      (state.numLineItems.value as number)--;
      state.isUpdated.value = true;
    },
    setCurrentLineItem(state, action: PayloadAction<number>) {
      state.numLineItems.value = action.payload;
    },
    setLineItem(state, action: PayloadAction<number>) {
      state.numLineItems.value = action.payload;
    },
  },
});

export default addProcessInvoiceFormSlice;
export const addProcessInvoiceFormActions = addProcessInvoiceFormSlice.actions;
