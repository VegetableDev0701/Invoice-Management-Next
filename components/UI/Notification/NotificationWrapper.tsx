import { useAppSelector as useSelector } from '@/store/hooks';
import Notification from './Notification';

export default function NotificationWrapper() {
  const notification = useSelector((state) => state.ui.notification);

  console.log('dionY [NotificationWrapper] notification: ', notification);
  return (
    <div className="z-50 fixed w-[400px] right-0">
      <div className="flex flex-col">
        {notification.messages?.map((item) => (
          <Notification
            key={item.id}
            id={item.id}
            content={item.content as string}
            icon={
              (item.icon || 'success') as 'success' | 'error' | 'save' | 'trash'
            }
            duration={item.autoHideDuration || notification.defaultDuration}
          />
        ))}
      </div>
    </div>
  );
}
