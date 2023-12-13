import { useAppSelector as useSelector } from '@/store/hooks';
import Notification from './Notification';

export default function NotificationWrapper() {
  const notification = useSelector((state) => state.ui.notification);
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none z-50 fixed inset-0 flex items-end px-4 py-6 mx-4 sm:items-start sm:p-6 sm:pt-6"
    >
      <div className="z-50 fixed w-[400px] right-0">
        <div className="flex flex-col gap-2 drop-shadow-lg">
          {notification.messages?.map((item) => (
            <Notification
              key={item.id}
              id={item.id}
              content={item.content as string}
              icon={
                (item.icon || 'success') as
                  | 'success'
                  | 'error'
                  | 'save'
                  | 'trash'
              }
              duration={item.autoHideDuration || notification.defaultDuration}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
