import { PayloadAction, createSlice, current } from '@reduxjs/toolkit';

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
});

export default currentPathSlice;
export const pathActions = currentPathSlice.actions;
