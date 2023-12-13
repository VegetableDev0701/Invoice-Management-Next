import { RESET_STATE } from '@/lib/globals';
import {
  FormState,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

const initialOnboardUser: FormState = {};

const onboardUserFormSlice = createSlice({
  name: 'onboardUserForm',
  initialState: initialOnboardUser,
  reducers: {
    setFormElement(state, action: PayloadAction<SetFormElementPayload>) {
      const { inputValue, inputKey, isValid } = action.payload;
      state[inputKey] = {
        ...state[inputKey],
        value: inputValue,
        isValid: isValid,
      };
    },
    clearFormState(_) {
      return initialOnboardUser;
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
    builder.addCase(RESET_STATE, (state) => initialOnboardUser);
  },
});

export default onboardUserFormSlice;
export const onboardUserActions = onboardUserFormSlice.actions;
