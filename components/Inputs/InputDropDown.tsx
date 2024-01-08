import { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';

import { useAppDispatch as useDispatch } from '@/store/hooks';

import { getValidFunc } from '@/lib/validation/formValidation';
import { useGetInputState } from '@/lib/utility/formHelpers';
import { Items, SelectMenuOptions } from '@/lib/models/formDataModel';
import { Actions } from '@/lib/models/types';
import { User } from '@/lib/models/formStateModels';
import { classNames } from '@/lib/utility/utils';

import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import Button from '@/components/UI/Buttons/Button';
import AgaveLinkComponent from '../Utilities/AgaveLinkComponent';

import classes from './Input.module.css';

export interface Props {
  input: Items;
  classes: string;
  form?: string;
  actions?: Actions;
  showError?: boolean;
  icon?: JSX.Element;
}

interface Selected {
  label: string;
}

const Dropdown = (props: Props) => {
  const { input, showError, actions, form, classes: addOnClass } = props;

  const dispatch = useDispatch();
  const { user } = useUser();

  const inputState = useGetInputState(input.id, form as string);
  const [selected, setSelected] = useState<Selected>(
    input?.value
      ? { label: input.value as string }
      : inputState?.value
      ? { label: inputState.value as string }
      : { label: '' }
  );
  const isInputRequired = input.required;
  useEffect(() => {
    if (actions) {
      dispatch(
        actions.setFormElement({
          inputValue: selected.label,
          inputKey: input.id,
          isValid: getValidFunc(input.id)(selected.label, isInputRequired),
        })
      );
    }
  }, [selected.label, input.id, getValidFunc]);

  const blurHandler = () => {
    if (actions) {
      dispatch(
        actions.setIsTouchedState({
          inputKey: input.id,
          isTouched: true,
          isValid: getValidFunc(input.id)(
            inputState?.value as string,
            input.required
          ),
        })
      );
    }
  };

  const isError = !showError
    ? !inputState?.isValid && inputState?.isTouched
    : !inputState?.isValid;
  return (
    <div className={`${classes['input-container']} ${addOnClass}`}>
      <Listbox value={selected} onChange={setSelected}>
        {({ open }) => (
          <>
            <Listbox.Label
              htmlFor={input.id}
              className={`block font-sans ${
                input.isOnOverlay
                  ? 'font-semibold text-md'
                  : 'font-semibold text-md'
              } text-stak-dark-gray`}
            >
              {input.label}
            </Listbox.Label>
            <div className="flex flex-row items-end gap-4">
              <div className="grow relative mt-1" onBlur={blurHandler}>
                <Listbox.Button
                  id={input.id}
                  className={`font-sans relative w-full border-1 rounded-md h-11 border-[1px] shadow-md ${
                    input.isOnOverlay ? 'py-1.5 h-10' : 'h-11'
                  } ${
                    isError && isInputRequired
                      ? 'border-red-500 text-red-500'
                      : 'border-stak-light-gray'
                  } cursor-default pl-3 pr-10 text-left focus:border-stak-dark-green focus:shadow-xl focus-visible:border-stak-dark-green focus-visible:outline-stak-dark-green focus-visible:outline-0 sm:text-sm`}
                >
                  <span className="block truncate -mb-1 text-xl">
                    {selected.label !== 'None' ? selected.label : ''}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto drop-shadow-xl border-stak-light-gray rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {input.selectMenuOptions &&
                      (input.selectMenuOptions as SelectMenuOptions[]).map(
                        (option) => (
                          <Listbox.Option
                            key={option.id}
                            className={({ active }) =>
                              classNames(
                                'font-sans text-base relative cursor-default select-none py-2 pl-3 pr-9',
                                active
                                  ? 'bg-stak-dark-green text-white'
                                  : 'text-stak-dark-gray'
                              )
                            }
                            value={option}
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={classNames(
                                    selected ? 'font-semibold' : 'font-normal',
                                    'block truncate'
                                  )}
                                >
                                  {option.label}
                                </span>

                                {selected ? (
                                  <span
                                    className={classNames(
                                      active ? 'text-white' : 'text-indigo-600',
                                      'absolute inset-y-0 right-0 flex items-center pr-4'
                                    )}
                                  >
                                    <CheckIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        )
                      )}
                  </Listbox.Options>
                </Transition>
              </div>
              {input.sideButton && input.buttonPath !== 'agave' && (
                <Link
                  href={`/${(user as User).user_metadata.companyId}/${
                    input.buttonPath as string
                  }`}
                >
                  <Button
                    buttonText={input.buttonText as string}
                    className="flex items-center h-12 py-5 px-8 text-xl"
                  />
                </Link>
              )}
              {input.sideButton && input.buttonPath === 'agave' && (
                <AgaveLinkComponent
                  softwareName={selected.label}
                  className="flex items-center h-12 py-5 px-8 text-xl"
                />
              )}
            </div>
          </>
        )}
      </Listbox>
      {isError && isInputRequired && (
        <p
          className="font-sans mt-2 text-sm text-red-600"
          id={`${input.id}-error-message`}
        >
          {input.errormessage}
        </p>
      )}
    </div>
  );
};

export default Dropdown;
