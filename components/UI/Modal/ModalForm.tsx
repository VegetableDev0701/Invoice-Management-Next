import React, { Fragment, useEffect, useState } from 'react';
import ReactDom from 'react-dom';
import { Dialog, Transition } from '@headlessui/react';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Actions, FormData } from '@/lib/models/types';
import { FormStateV2 } from '@/lib/models/formStateModels';
import { formatNameForID } from '@/lib/utility/formatter';
import { InputElementWithItems } from '@/lib/models/formDataModel';

import classes from '@/components/Forms/InputFormLayout/FormLayout.module.css';
import { Input } from '@/components/Inputs/Input';

interface Props {
  openModal: boolean;
  formState: FormStateV2;
  formData: FormData;
  actions: Actions;
  form: string;
  buttonText?: string;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  onConfirm: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCloseModal: () => void;
}

function Modal(props: Props) {
  const {
    openModal,
    title,
    buttonText,
    formData,
    actions,
    form,
    onConfirm,
    onCloseModal,
  } = props;

  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(openModal);
  }, [openModal]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative font-sans" onClose={onCloseModal}>
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

        <div className="fixed z-50 inset-0 overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-visible rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon
                      className="h-7 w-7 text-stak-orange"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      {`Confirm ${title ? title : 'Save'}`}
                    </Dialog.Title>
                    <div className="mt-2">
                      <form
                        id="form-id"
                        className={classes['content-frame']}
                        onSubmit={(e) => e.preventDefault()}
                      >
                        {formData.mainCategories.map((category, i) => {
                          if (category.name === 'Recurring Fees') {
                            return;
                          }
                          return (
                            <div
                              key={formatNameForID(category.name)}
                              className={classes['category-frame']}
                              id={formatNameForID(category.name)}
                            >
                              {category.inputElements.map((el, j) => {
                                return (
                                  <div
                                    key={`${i}_${j}`}
                                    className={`${classes['category-frame__input-frame']} px-0 py-2`}
                                  >
                                    {(el as InputElementWithItems).items.map(
                                      (item, p) => {
                                        return (
                                          <Input
                                            classes="flex-1 w-full"
                                            key={`${formatNameForID(
                                              item.label
                                            )}_${p}`}
                                            input={{
                                              ...item,
                                            }}
                                            actions={actions}
                                            form={form}
                                          />
                                        );
                                      }
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </form>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:justify-center">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-3xl border border-transparent bg-stak-dark-green px-8 py-2 text-semi font-semibold text-white shadow-sm hover:bg-stak-dark-green-hover hover:shadow-xl focus:outline-none sm:ml-3 sm:w-auto sm:text-lg sm:py-[6px] sm:px-10"
                    onClick={(e) => {
                      onConfirm(e);
                      onCloseModal();
                      setOpen(false);
                    }}
                  >
                    {buttonText ? buttonText : title ? title : 'Save'}
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

export default function ModalForm(props: Props) {
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
            onConfirm={props.onConfirm}
            isLoading={props.isLoading}
            error={props.error}
            title={props.title}
            buttonText={props.buttonText}
            actions={props.actions}
            form={props.form}
            formState={props.formState}
            formData={props.formData}
          />,
          portal
        )}
    </>
  );
}
