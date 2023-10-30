import { useAppSelector as useSelector } from '@/store/hooks';
import Notification from './Notification';

export default function NotificationWrapper() {
  const notification = useSelector((state) => state.ui.notification);

  return (
    <>
      {notification.openNotification !== undefined && (
        <Notification
          openNotification={notification.openNotification}
          content={notification.content as string}
          icon={notification.icon as 'success' | 'error' | 'save' | 'trash'}
        />
      )}
      {notification.openNotification === undefined && (
        <Notification
          openNotification={false}
          content={notification.content as string}
          icon={notification.icon as 'success' | 'error' | 'save' | 'trash'}
        />
      )}
    </>
  );
}
