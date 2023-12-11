import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { RESET_STATE } from '@/lib/globals';

interface SSEState {
  isSuccess: boolean;
  sseUrl: string;
  sseContent: { sseContentType: string; projectId?: string };
}

const initialSSEState: SSEState = {
  isSuccess: false,
  sseUrl: '',
  sseContent: { sseContentType: '', projectId: '' },
};

const sseSlice = createSlice({
  name: 'sse',
  initialState: initialSSEState,
  reducers: {
    setUploadFileSuccess(state, action: PayloadAction<boolean>) {
      state.isSuccess = action.payload;
    },
    setSSEUrl(state, action: PayloadAction<string>) {
      state.sseUrl = action.payload;
    },
    setWhatToListenFor(
      state,
      action: PayloadAction<{ sseContentType: string; projectId?: string }>
    ) {
      const { sseContentType, projectId } = action.payload;
      state.sseContent = { sseContentType, projectId };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, (_state) => initialSSEState);
  },
});

export default sseSlice;
export const sseActions = sseSlice.actions;
