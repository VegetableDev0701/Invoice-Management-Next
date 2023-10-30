import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface InitialUIState {
  isLoading: boolean;
}

interface Notification {
  openNotification?: boolean;
  content?: string;
  icon?: 'success' | 'error' | 'trash' | 'save';
}

interface ErrorModal {
  openModal: boolean;
  message: string;
  title: string;
}

interface ProcessingNotification {
  openNotification: boolean;
  content?: string;
}

export const initialUIState: InitialUIState &
  Record<'notification', Notification> &
  Record<'errorModal', ErrorModal> &
  Record<'processingNotification', ProcessingNotification> = {
  isLoading: false,
  notification: { openNotification: false, content: '', icon: 'success' },
  errorModal: { openModal: false, message: '', title: '' },
  processingNotification: { openNotification: false, content: '' },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUIState,
  reducers: {
    setLoadingState(state, action: PayloadAction<{ isLoading: boolean }>) {
      const { isLoading } = action.payload;
      state.isLoading = isLoading;
    },
    setNotificationContent(state, action: PayloadAction<Notification>) {
      const { content, icon, openNotification } = action.payload;
      if (content) {
        state.notification.content = content;
      }
      if (icon) {
        state.notification.icon = icon;
      }
      if (openNotification !== undefined) {
        state.notification.openNotification = openNotification;
      }
    },
    setProcessingNotificationContent(
      state,
      action: PayloadAction<ProcessingNotification>
    ) {
      const { openNotification, content } = action.payload;

      state.processingNotification.openNotification = openNotification;
      if (content) {
        state.processingNotification.content = content;
      }
    },
    setModalContent(
      state,
      action: PayloadAction<{
        openModal: boolean;
        message?: string;
        title?: string;
      }>
    ) {
      const { openModal, message, title } = action.payload;
      state.errorModal.openModal = openModal;
      if (message && title) {
        state.errorModal.message = message;
        state.errorModal.title = title;
      }
    },
  },
});

export default uiSlice;
export const uiActions = uiSlice.actions;
