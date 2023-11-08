import { useEffect } from 'react';
import { ResponseData } from './use-http';
import { useAppDispatch as useDispatch } from '@/store/hooks';
import { uiActions } from '@/store/ui-slice';
import { overlayActions } from '@/store/overlay-control-slice';

interface Props {
  response: Response | null;
  successJSON: ResponseData | string | null;
  isOverlay: boolean;
  error?: Record<string, string> | null;
  overlayStateKey?: string;
}

export default function useSetNotification({
  response,
  successJSON,
  isOverlay,
  error,
  overlayStateKey,
}: Props) {
  const dispatch = useDispatch();
  useEffect(() => {
    if (error) {
      dispatch(
        uiActions.setModalContent({
          openModal: true,
          message: error.message,
          title: 'Error',
        })
      );
    } else if (response) {
      if (response.ok) {
        dispatch(
          uiActions.setNotificationContent({
            content: (successJSON as ResponseData).message,
            icon: 'success',
            openNotification: true,
          })
        );
      }
      if (!response.ok) {
        if (isOverlay && overlayStateKey) {
          dispatch(
            overlayActions.setOverlayContent({
              data: { open: true },
              stateKey: overlayStateKey,
            })
          );
        }
        const message =
          'Something went wrong with the upload, please try again.';
        dispatch(
          uiActions.setNotificationContent({
            content: message,
            icon: 'error',
            openNotification: true,
          })
        );
      }
    }
  }, [response]);
}
