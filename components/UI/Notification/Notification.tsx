import { useEffect, useRef, useState } from 'react';
import { useAppDispatch as useDispatch } from '@/store/hooks';
import { uiActions } from '@/store/ui-slice';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  TrashIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/20/solid';

interface Props {
  id: string;
  content: string;
  duration: number;
  icon: 'success' | 'error' | 'trash' | 'save';
}

export default function Notification(props: Props) {
  const dispatch = useDispatch();
  const { content, icon, duration, id } = props;
  const contentElement = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState('auto');
  const [opacity, setOpacity] = useState('0%');
  const [show, setShow] = useState(false);

  const hideNotification = () => {
    if (show) return;
    setShow(false);
    setOpacity('0%');
    setHeight('0px');
    setTimeout(() => {
      dispatch(uiActions.removeNotification(id));
    }, 1000);
  };

  useEffect(() => {
    setShow(true);
    setOpacity('100%');
    setTimeout(() => {
      hideNotification();
    }, duration - 200);
  }, []);

  useEffect(() => {
    if (contentElement.current) {
      setHeight(`${contentElement.current.scrollHeight}px`);
    }
  }, [contentElement]);

  return (
    <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
      <div
        ref={contentElement}
        style={{ height: height, opacity: opacity, borderRadius: '0.5rem' }}
        className="overflow-hidden transition-all duration-[500ms]"
      >
        <div className="pointer-events-auto mx-6 my-[0.1rem] w-[28rem] max-w-md overflow-hidden rounded-lg bg-stak-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {icon === 'success' && (
                  <CheckCircleIcon
                    className="h-6 w-6 text-stak-dark-green"
                    aria-hidden="true"
                  />
                )}
                {icon === 'error' && (
                  <ExclamationTriangleIcon
                    className="h-6 w-6 text-red-600"
                    aria-hidden="true"
                  />
                )}
                {icon === 'trash' && (
                  <TrashIcon
                    className="h-6 w-6 text-stak-dark-green"
                    aria-hidden="true"
                  />
                )}
                {icon === 'save' && (
                  <CloudArrowUpIcon
                    className="h-6 w-6 text-stak-dark-green"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-lg font-medium text-stak-dark-gray">
                  {typeof content === 'string' ? content : ''}
                </p>
              </div>
              <div className="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-stak-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-0 focus:ring-offset-0"
                  onClick={() => {
                    hideNotification();
                  }}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
