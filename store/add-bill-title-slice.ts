import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
  FormStateV2,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import { RESET_STATE } from '@/lib/globals';

const initialBillTitle: FormStateV2 = {
  month: { value: '' },
  year: { value: '' },
};

const addBillTitleSlice = createSlice({
  name: 'addBillTitle',
  initialState: initialBillTitle,
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
      return initialBillTitle;
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
      state.isUpdated.value = action.payload;
    },
    resetFormValidation(state) {
      return resetAllFormValidation(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, () => initialBillTitle);
  },
});

export default addBillTitleSlice;
export const addBillTitleActions = addBillTitleSlice.actions;
