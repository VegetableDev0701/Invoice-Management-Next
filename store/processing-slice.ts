import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProcessingState {
  estimatedTime: number;
  totalFiles: number;
  currentTaskId: string;
  cancelButton: boolean;
  retryButton: boolean;
  allDataFetched: boolean;
}

const initialState: ProcessingState = {
  estimatedTime: 0,
  totalFiles: 0,
  currentTaskId: '',
  cancelButton: false,
  retryButton: false,
  allDataFetched: false,
};

const processingSlice = createSlice({
  name: 'processing',
  initialState,
  reducers: {
    setFetchedProjectsStatus(state, action: PayloadAction<boolean>) {
      state.allDataFetched = action.payload;
    },
  },
});

export const processingActions = processingSlice.actions;
export default processingSlice;
