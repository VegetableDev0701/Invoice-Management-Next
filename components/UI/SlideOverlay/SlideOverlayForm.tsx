import { Fragment, useEffect, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';

import { OverlayContent, overlayActions } from '@/store/overlay-control-slice';
import { useAppDispatch as useDispatch } from '@/store/hooks';

import { useKeyPressActionOverlay } from '@/hooks/use-save-on-key-press';

import { FormState } from '@/lib/models/formStateModels';
import { Actions, FormData } from '@/lib/models/types';

import { XMarkIcon } from '@heroicons/react/24/outline';
import FormOverlay from '@/components/Forms/OverlayForm/FormOverlay';
import Button from '../Buttons/Button';
import FullScreenLoader from '../Loaders/FullScreenLoader';

interface Props {
  formData: FormData;
  formState: FormState;
  actions: Actions;
  showError: boolean;
  overlayContent: OverlayContent;
  form: string;
  projectId?: string;
  overlayStateKey: string;
  responseLoading?: boolean;
  onSubmit: (
    e: React.MouseEvent<HTMLButtonElement | HTMLDivElement, MouseEvent>
  ) => void;
}

export default function SlideOverlayForm(props: Props) {
  const {
    formData,
    formState,
    actions,
    showError,
    overlayContent,
    form,
    projectId,
    overlayStateKey,
    responseLoading,
    onSubmit,
  } = props;

  const [open, setOpen] = useState(false);

  const saveLaborButtonRef = useRef<HTMLButtonElement>(null);
  useKeyPressActionOverlay({
    formOverlayOpen: open,
    ref: saveLaborButtonRef,
    keyName: 'Enter',
  });

  const currentData = overlayContent?.currentData
    ? overlayContent.currentData
    : formData;

  useEffect(() => {
    setOpen(overlayContent.open as boolean);
  }, [overlayContent.open]);

  const dispatch = useDispatch();

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-30"
          onClose={() => {
            // TODO If I want to have the form save when they user closes it,
            // I need to create a new submit function that doesn't have the click
            // dependency attached to it
            dispatch(
              overlayActions.setOverlayContent({
                data: {
                  open: false,
                  currentId: null,
                },
                stateKey: overlayStateKey,
              })
            );
          }}
        >
          <div className="fixed inset-0" />
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300 sm:duration-[400ms]"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300 sm:duration-[250ms]"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-2xl">
                      {responseLoading && <FullScreenLoader />}
                      {!responseLoading && (
                        <>
                          <div className="px-4 sm:px-6">
                            <div className="flex items-start justify-between">
                              <Dialog.Title className="text-base font-sans font-semibold leading-6 text-gray-500">
                                <p className="text-3xl">
                                  {overlayContent.overlayTitle}
                                </p>
                                <div className="flex w-full justify-end items-end gap-4">
                                  {overlayContent.overlaySubtitle
                                    ? overlayContent.overlaySubtitle
                                    : ''}
                                </div>
                              </Dialog.Title>
                              <div className="ml-3 flex h-7 items-center">
                                <button
                                  type="button"
                                  className="rounded-md bg-white text-gray-400 hover:text-gray-800 focus:outline-none focus:ring-0 focus:ring-offset-0"
                                  onClick={() => {
                                    dispatch(
                                      overlayActions.setOverlayContent({
                                        data: {
                                          open: false,
                                          currentId: null,
                                        },
                                        stateKey: overlayStateKey,
                                      })
                                    );
                                  }}
                                >
                                  <span className="sr-only">Close panel</span>
                                  <XMarkIcon
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="relative mt-6 flex-1 px-4 sm:px-6">
                            {form && (
                              <FormOverlay
                                formData={currentData as FormData}
                                formState={formState}
                                actions={actions}
                                showError={showError}
                                projectId={projectId as string}
                                form={form}
                              />
                            )}
                          </div>
                          <div className="flex justify-center">
                            <Button
                              className="my-4 py-2 w-2/3 text-2xl"
                              buttonText={
                                overlayContent?.isSave ? 'Save' : 'Update'
                              }
                              onClick={onSubmit}
                              ref={saveLaborButtonRef}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
