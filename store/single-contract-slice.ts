import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import {
  FormStateV2,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import { RESET_STATE } from '@/lib/globals';

const initialsingleContractFormState: FormStateV2 = {
  numRecurringFees: { value: 0 },
};

const singleContractFormSlice = createSlice({
  name: 'singleContractForm',
  initialState: initialsingleContractFormState,
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
      return initialsingleContractFormState;
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
      console.log('state', state);
      return resetAllFormValidation(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, () => initialsingleContractFormState);
  },
});

export default singleContractFormSlice;
export const singleContractFormActions = singleContractFormSlice.actions;
