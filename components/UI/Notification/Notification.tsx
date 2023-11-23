import { Fragment, useEffect, useState } from 'react';

import { useAppDispatch as useDispatch } from '@/store/hooks';
import { uiActions } from '@/store/ui-slice';

import { Transition } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  TrashIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/20/solid';

interface Props {
  content: string;
  timeOpenMS?: number;
  icon: 'success' | 'error' | 'trash' | 'save';
}

export default function Notification(props: Props) {
  const { content, icon, timeOpenMS } = props;
  const [show, setShow] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    setShow(openNotification);
    setTimeout(() => {
      // dispatch(uiActions.setNotificationContent({ openNotification: false }));
      setShow(openNotification);
    }, timeOpenMS || 2500);
  }, []);

  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className="pointer-events-none inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 sm:pt-6"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
          <Transition
            show={show}
            as={Fragment}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-lg bg-stak-white shadow-lg ring-1 ring-black ring-opacity-5">
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
                      {content}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-shrink-0">
                    <button
                      type="button"
                      className="inline-flex rounded-md bg-stak-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-0 focus:ring-offset-0"
                      onClick={() => {
                        dispatch(
                          uiActions.setNotificationContent({
                            openNotification: false,
                          })
                        );
                        setShow(openNotification);
                      }}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  );
}
