import React, { Fragment, useEffect, useState } from 'react';
import ReactDom from 'react-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Props {
  openModal: boolean;
  data: string[];
  isLoading?: boolean;
  error?: string;
  onCloseModal: () => void;
}

function Modal(props: Props) {
  const { openModal, onCloseModal, data } = props;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(openModal);
  }, [openModal]);

  // TODO add a notification on successful send, and keep the error inside the modal.

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative font-sans"
        onClose={() => {
          onCloseModal();
          setOpen(false);
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
          onClick={() => setOpen(false)}
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => {
                      onCloseModal();
                      setOpen(false);
                    }}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon
                      className="h-6 w-6 text-red-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Duplicate Files Found
                    </Dialog.Title>
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">
                        The following file(s) were not uploaded due to
                        duplicates found in storage.
                        <ul className="pt-3 pl-3">
                          {data.map((file, i) => (
                            <li key={i}>{file}</li>
                          ))}
                        </ul>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-3xl border border-transparent bg-stak-dark-green px-8 py-2 text-semi font-semibold text-white shadow-sm hover:bg-stak-dark-green-hover hover:shadow-xl focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={(e) => {
                      onCloseModal();
                      setOpen(false);
                    }}
                  >
                    Close
                  </button>
                  {/* <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-3xl border border-gray-300 bg-white px-4 py-2 text-base font-semibold text-stak-dark-gray shadow-sm hover:text-stak-light-gray hover:shadow-xl focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => {
                      onCloseModal();
                      setOpen(false);
                    }}
                  >
                    Cancel
                  </button> */}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function ModalDuplicateFilesError(props: Props) {
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
            onCloseModal={props.onCloseModal}
            openModal={props.openModal}
            data={props.data}
          />,
          portal
        )}
    </>
  );
}
