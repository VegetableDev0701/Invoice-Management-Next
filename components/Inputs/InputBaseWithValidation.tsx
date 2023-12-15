import { useEffect, useRef, useState } from 'react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { contractActions } from '@/store/contract-slice';

import useInputChangeHandler from '@/hooks/use-inputChangeHandler';
import {
  useCheckChangeOrderNameDuped,
  useCheckVendorNameDuped,
} from '@/hooks/use-utils';

import { formatNumber } from '@/lib/utility/formatter';
import { useGetInputState } from '@/lib/utility/formHelpers';
import { Items } from '@/lib/models/formDataModel';
import { Actions } from '@/lib/models/types';
import { FormStateItem } from '@/lib/models/formStateModels';

import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import classes from './Input.module.css';
import Button from '../UI/Buttons/Button';

export interface Props {
  props: PropsItems;
}

export interface PropsItems {
  input: Items;
  actions: Actions;
  form: string;
  disabled?: boolean;
  autofocus?: boolean;
  classes?: string;
  showError?: boolean;
  icon?: JSX.Element;
  projectId?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
}

const InputBaseWithValidation = (props: Props) => {
  const {
    icon,
    input,
    showError,
    actions,
    form,
    autofocus,
    projectId,
    onBlur,
    onFocus,
    onMouseEnter,
    onMouseLeave,
    classes: addOnClass,
  } = props.props;

  const [mutatedState, setMutatedState] = useState<string | undefined>(
    undefined
  );

  const dispatch = useDispatch();

  const contractObj = useSelector((state) => state.contract);
  const inputState = useGetInputState(input.id, form) as FormStateItem;

  // make the first input field autofocused
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autofocus) {
      inputRef.current?.focus();
    }
  }, []);

  // check for duplicate change order names
  const isCONameDuped = useCheckChangeOrderNameDuped({
    projectId,
    input,
    inputState,
  });

  const isVendorNameDuped = useCheckVendorNameDuped({ input, inputState });

  const [inputValueState, changeHandler, blurHandler] = useInputChangeHandler(
    input,
    inputState,
    actions
  );

  let inputValue = inputValueState;

  // check via the ref if the value changes due to a third part like chrome updating
  // the input field. If so update the state and inputValue with this new item.
  useEffect(() => {
    setMutatedState(inputRef?.current?.value);
  }, [inputRef?.current?.value]);
  useEffect(() => {
    if (mutatedState) {
      inputValue = mutatedState;
    }
  }, [mutatedState]);

  const contractClickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(contractActions.setClickedContract({ isRowClicked: true }));
  };

  const isError = !showError
    ? !inputState?.isValid && inputState?.isTouched
    : !inputState?.isValid;
  const isRequired = input?.required;

  const isValidError =
    showError && input.value !== ''
      ? !inputState?.isValid
      : !inputState?.isValid && inputState?.isTouched;

  // currently only showing the currency icon on theleft of the input, but add others here as an || conditional
  const isLeftIcon = input.isCurrency;
  const isRightIcon = !input.isCurrency;

  return (
    <div className={`${classes['input-container']} ${addOnClass}`}>
      <label className="font-sans font-semibold text-md" htmlFor={input.id}>
        {input.label}
      </label>
      <div className="flex items-center gap-4">
        <div className="relative w-full mt-1 rounded-md shadow-sm">
          {isLeftIcon && icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {icon}
            </div>
          )}

          <input
            className={`font-sans w-full block placeholder:text-base border-1 text-stak-dark-gray rounded-md shadow-md ${
              input.isOnOverlay ? 'py-1.5' : ''
            } ${
              isLeftIcon
                ? 'pl-10'
                : isRightIcon &&
                  (isError || isCONameDuped || isVendorNameDuped) &&
                  isRequired
                ? 'pr-10'
                : 'px-3'
            } ${classes['input-container__input']} ${
              ((isError || isCONameDuped || isVendorNameDuped) && isRequired) ||
              isValidError
                ? 'border-red-500 placeholder:text-red-500'
                : 'border-stak-light-gray'
            }`}
            value={
              inputState?.value !== undefined
                ? (inputState.value as string)
                : (input.value as string) ||
                  ((input.isCurrency
                    ? formatNumber(inputValue as string)
                    : inputValue) as string)
            }
            id={input.id}
            type={input.type as string}
            data-testid={input['data-testid']}
            onChange={(e) => {
              (
                changeHandler as (
                  e: React.ChangeEvent<HTMLInputElement>
                ) => void
              )(e);
            }}
            onBlur={(e) => {
              onBlur && onBlur(e);
              blurHandler && (blurHandler as () => void)();
            }}
            onFocus={onFocus}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            ref={inputRef}
            disabled={input.disabled ?? false}
          />
          {(((isError || isCONameDuped || isVendorNameDuped) && isRequired) ||
            isValidError) && (
            <div
              data-testid="error-icon-div"
              className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <ExclamationCircleIcon
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>
          )}

          {isRightIcon && icon && (
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 flex items-center ${
                ((isError || isCONameDuped || isVendorNameDuped) &&
                  isRequired) ||
                isValidError
                  ? 'pr-10'
                  : 'pr-3'
              }`}
            >
              {icon}
            </div>
          )}
        </div>
        {/* If the button is for a contract need to update the state on click */}
        {input.sideButton && input.buttonText === 'Contract' && (
          <Button
            buttonText={input.buttonText as string}
            className="flex items-center px-8 py-2 text-xl"
            disabled={!contractObj.clickedContract}
            onClick={contractClickHandler}
          />
        )}
        {input.sideButton && input.buttonText !== 'Contract' && (
          <Button
            buttonText={input.buttonText as string}
            className="flex items-center px-8 py-2 text-xl"
            disabled={true}
          />
        )}
      </div>
      {(isError || isCONameDuped || isVendorNameDuped) && isRequired && (
        <p
          className="font-sans mt-2 text-sm text-red-600"
          id={`${input.id}-error-message`}
        >
          {isCONameDuped || isVendorNameDuped
            ? 'This name is already in use.'
            : input.errormessage}
        </p>
      )}
      {isValidError && (
        <p
          className="font-sans mt-2 text-sm text-red-600"
          id={`${input.id}-error-message`}
        >
          {input.validMessage}
        </p>
      )}
    </div>
  );
};

export default InputBaseWithValidation;
