import { useAppSelector as useSelector } from '@/store/hooks';
import Notification from './Notification';

export default function NotificationWrapper() {
  const notification = useSelector((state) => state.ui.notification);

  return (
    <div className="z-50 fixed">
      <div className="flex flex-col gap-5">
        {notification.messages.map((item, index) => (
          <Notification
            key={index}
            openNotification={true}
            content={item.content as string}
            icon={
              (item.icon || 'success') as 'success' | 'error' | 'save' | 'trash'
            }
          />
        ))}
      </div>
    </div>
  );
}
