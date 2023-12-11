import { RESET_STATE } from '@/lib/globals';
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
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, (_state) => initialState);
  },
});

export const processingActions = processingSlice.actions;
export default processingSlice;
