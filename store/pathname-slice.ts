import { RESET_STATE } from '@/lib/globals';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface InitialPathState {
  currentPath: string;
}
const initialPathState: InitialPathState = { currentPath: '/' };

const currentPathSlice = createSlice({
  name: 'path',
  initialState: initialPathState,
  reducers: {
    setCurrentPath(state, action: PayloadAction<InitialPathState>) {
      const { currentPath } = action.payload;
      state.currentPath = currentPath;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, (_state) => initialPathState);
  },
});

export default currentPathSlice;
export const pathActions = currentPathSlice.actions;
