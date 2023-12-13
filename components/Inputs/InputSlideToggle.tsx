import { useEffect, useState } from 'react';
import { Switch } from '@headlessui/react';

import { useAppDispatch as useDispatch } from '@/store/hooks';
import { Items } from '@/lib/models/formDataModel';
import { Actions } from '@/lib/models/types';
import { useGetInputState } from '@/lib/utility/formHelpers';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface Props {
  props: PropsItems;
}

interface PropsItems {
  input: Items;
  actions: Actions;
  form: string;
  showError?: boolean;
  icon?: JSX.Element;
}
export default function SlideToggle(props: Props) {
  const { input, actions, form } = props.props;

  const dispatch = useDispatch();

  const inputState = useGetInputState(input.id, form);
  const [enabled, setEnabled] = useState(
    inputState?.value ? (inputState.value as boolean) : (input.value as boolean)
  );

  useEffect(() => {
    dispatch(
      actions.setFormElement({
        inputValue: enabled,
        inputKey: input.id,
        isValid: true,
      })
    );
  }, [enabled]);

  const topClasses = input.id.includes('billable')
    ? 'flex flex-col items-center my-2 w-[5rem]'
    : 'flex items-center justify-between gap-10 my-2';

  return (
    <Switch.Group as="div" className={topClasses}>
      <span className="flex flex-grow flex-col">
        <Switch.Label
          as="span"
          className={`block font-sans font-semibold text-md ${
            input.id.includes('billable') ? '-mt-1' : ''
          }`}
          passive
        >
          {input.label}
        </Switch.Label>
        {/* <Switch.Description as="span" className="text-sm text-gray-500">
          Nulla amet tempus sit accumsan. Aliquet turpis sed sit lacinia.
        </Switch.Description> */}
      </span>
      <Switch
        checked={enabled}
        onChange={(value) => {
          setEnabled(value);
          // Use to tell that the form has been updated when any slide toggle other than
          // line item toggle is clicked.
          if (
            input.id !== 'line-item-toggle' &&
            inputState?.value !== undefined
          ) {
            dispatch(
              actions.setIsTouchedState({
                inputKey: input.id,
                isTouched: true,
                isValid: true,
              })
            );
          }
        }}
        id={input.id}
        className={classNames(
          enabled ? 'bg-stak-dark-green' : 'bg-gray-500',
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none'
        )}
      >
        <span className="sr-only">Use setting</span>
        <span
          className={classNames(
            enabled ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
          )}
        >
          <span
            className={classNames(
              enabled
                ? 'opacity-0 duration-100 ease-out'
                : 'opacity-100 duration-200 ease-in',
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            <svg
              className="h-3 w-3 text-stak-dark-gray"
              fill="none"
              viewBox="0 0 12 12"
            >
              <path
                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span
            className={classNames(
              enabled
                ? 'opacity-100 duration-200 ease-in'
                : 'opacity-0 duration-100 ease-out',
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            <svg
              className="h-3 w-3 text-indigo-600"
              fill="currentColor"
              viewBox="0 0 12 12"
            >
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
            </svg>
          </span>
        </span>
      </Switch>
    </Switch.Group>
  );
}
