import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { User } from '@/lib/models/formStateModels';
import { RESET_STATE } from '@/lib/globals';

const initialUserState = {} as User;

const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    setUserState(state, action: PayloadAction<User>) {
      const user = action.payload;
      return user;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, () => initialUserState);
  },
});
export default userSlice;
export const userActions = userSlice.actions;
