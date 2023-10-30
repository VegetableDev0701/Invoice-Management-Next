import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { InitialUserState, User } from '@/lib/models/formStateModels';

const initialUserState: InitialUserState = {
  user: undefined,
};

const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    setUserState(state, action: PayloadAction<User>) {
      const user = action.payload;
      state.user = { ...user };
    },
  },
});
export default userSlice;
export const userActions = userSlice.actions;
