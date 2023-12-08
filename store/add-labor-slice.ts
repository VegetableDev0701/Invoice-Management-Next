import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
  FormState,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import { RESET_STATE } from '@/lib/globals';

const initialAddLaborFormState: FormState = {
  numCostCodes: { value: 1 },
};

const addLaborFormSlice = createSlice({
  name: 'addLaborForm',
  initialState: initialAddLaborFormState,
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
      return initialAddLaborFormState;
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
    setCurrentCostCode(state, action: PayloadAction<number>) {
      state.numCostCodes.value = action.payload;
    },
    incrementCostCodes(state) {
      (state.numCostCodes.value as number)++;
    },
    decrementCostCodes(state) {
      (state.numCostCodes.value as number)--;
    },
    setCostCodes(state, action: PayloadAction<number>) {
      state.numCostCodes.value = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, (state) => initialAddLaborFormState);
  },
});

export default addLaborFormSlice;
export const addLaborFormActions = addLaborFormSlice.actions;
