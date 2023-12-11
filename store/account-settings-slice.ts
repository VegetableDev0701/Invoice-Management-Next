import { RESET_STATE } from '@/lib/globals';
import {
  FormStateV2,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

const initialAcccountSettingsState: FormStateV2 = {};

const accountSettingsFormSlice = createSlice({
  name: 'accountSettingsForm',
  initialState: initialAcccountSettingsState,
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
      return initialAcccountSettingsState;
    },
    setIsTouchedState(state, action: PayloadAction<IsTouchedPayload>) {
      const { inputKey, isTouched, isValid } = action.payload;
      state[inputKey] = {
        ...state[inputKey],
        isValid: isValid,
        isTouched: isTouched,
      };
    },
    resetFormValidation(state) {
      return resetAllFormValidation(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, (_state) => initialAcccountSettingsState);
  },
});

export default accountSettingsFormSlice;
export const accountSettingsFormActions = accountSettingsFormSlice.actions;
