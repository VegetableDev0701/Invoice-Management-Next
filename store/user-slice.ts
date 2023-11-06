import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { User } from '@/lib/models/formStateModels';

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
});
export default userSlice;
export const userActions = userSlice.actions;
