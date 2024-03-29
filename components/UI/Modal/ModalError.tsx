import React, { Fragment, useEffect, useState } from 'react';
import ReactDom from 'react-dom';
import { Dialog, Transition } from '@headlessui/react';

import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAppDispatch as useDispatch } from '@/store/hooks';
import { ErrorModal, uiActions } from '@/store/ui-slice';

function Modal(props: ErrorModal) {
  const { openModal, message, title, logout } = props;

  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(openModal);
  }, [openModal]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative font-sans"
        onClose={() => {
          dispatch(uiActions.setModalContent({ openModal: false }));
          dispatch(uiActions.setLoadingState({ isLoading: false }));
          setOpen(openModal);
          if (logout) {
            window.location.href = '/api/auth/logout';
          }
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-10" />
        </Transition.Child>

        <div
          className="fixed z-20 inset-0 overflow-y-auto"
          onClick={() => {
            dispatch(uiActions.setModalContent({ openModal: false }));
            dispatch(uiActions.setLoadingState({ isLoading: false }));
            setOpen(openModal);
            if (logout) {
              window.location.href = '/api/auth/logout';
            }
          }}
        >
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => {
                      dispatch(uiActions.setModalContent({ openModal: false }));
                      dispatch(uiActions.setLoadingState({ isLoading: false }));
                      setOpen(openModal);
                      if (logout) {
                        window.location.href = '/api/auth/logout';
                      }
                    }}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon
                      className="h-7 w-7 text-stak-orange"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-semibold leading-6 text-gray-900"
                    >
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-lg text-gray-500">{message}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-3xl border border-transparent bg-stak-dark-green px-8 py-2 text-semi font-semibold text-white shadow-sm hover:bg-stak-dark-green-hover hover:shadow-xl focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      dispatch(uiActions.setModalContent({ openModal: false }));
                      dispatch(uiActions.setLoadingState({ isLoading: false }));
                      setOpen(openModal);
                      if (logout) {
                        window.location.href = '/api/auth/logout';
                      }
                    }}
                  >
                    {logout ? 'Logout' : 'OK'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function ModalError(props: ErrorModal) {
  const [portal, setPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const portalRoot = document.getElementById('portal');
    if (portalRoot) {
      setPortal(portalRoot);
    }
  }, []);

  if (!portal) return null;

  return (
    <>
      {portal &&
        ReactDom.createPortal(
          <Modal
            openModal={props.openModal}
            message={props.message}
            title={props.title}
            logout={props.logout}
          />,
          portal
        )}
    </>
  );
}
