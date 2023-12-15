// import { nanoid } from '@/lib/config';
import { RESET_STATE } from '@/lib/globals';
import { Notification, NotificationContainer } from '@/lib/models/uiModels';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface InitialUIState {
  isLoading: boolean;
  lockUI: boolean;
  tasksInProgress: {
    [taskId: string]: boolean;
  };
}

export interface ErrorModal {
  openModal: boolean;
  message?: string;
  title?: string;
  logout?: boolean;
}

interface ProcessingNotification {
  openNotification: boolean;
  content?: string;
}

export const initialUIState: InitialUIState &
  Record<'notification', NotificationContainer> &
  Record<'errorModal', ErrorModal> &
  Record<'processingNotification', ProcessingNotification> = {
  isLoading: false,
  lockUI: false,
  tasksInProgress: {},
  notification: {
    messages: [],
    defaultDuration: 3000,
    defaultIcon: 'success',
  },
  errorModal: { openModal: false, message: '', title: '', logout: false },
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
    setTaskLoadingState(
      state,
      action: PayloadAction<{ taskId: string; isLoading: boolean }>
    ) {
      const { taskId, isLoading } = action.payload;
      state.tasksInProgress[taskId] = isLoading;
    },
    lockUI(state) {
      state.lockUI = true;
    },
    unLockUI(state) {
      state.lockUI = false;
    },
    notify(state, action: PayloadAction<Omit<Notification, 'id'>>) {
      const { content, icon, autoHideDuration } = action.payload;
      const id = 'id' + Math.random().toString(16).slice(2);
      state.notification = {
        ...state.notification,
        messages: [
          ...state.notification.messages,
          {
            // id: nanoid(),
            id: id,
            content: content,
            icon:
              icon ||
              (state.notification.defaultIcon as
                | 'success'
                | 'error'
                | 'trash'
                | 'save'),
            autoHideDuration:
              autoHideDuration || state.notification.defaultDuration,
          },
        ],
      };
    },
    removeNotification(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.notification = {
        ...state.notification,
        messages: [
          ...state.notification.messages.filter((msg) => msg.id !== id),
        ],
      };
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
        logout?: boolean;
      }>
    ) {
      const { openModal, message, title, logout } = action.payload;
      state.errorModal.openModal = openModal;
      if (message) {
        state.errorModal.message = message;
      }
      if (title) {
        state.errorModal.title = title;
      }
      state.errorModal.logout = logout ?? false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, () => initialUIState);
  },
});

export default uiSlice;
export const uiActions = uiSlice.actions;
