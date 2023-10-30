import { useEffect, useRef } from 'react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { contractActions } from '@/store/contract-slice';

import useInputChangeHandler from '@/hooks/use-inputChangeHandler';
import { useCheckChangeOrderNameDuped } from '@/hooks/use-utils';

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

  const dispatch = useDispatch();

  // make the first input field autofocused
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autofocus) {
      inputRef.current?.focus();
    }
  }, []);

  const contractObj = useSelector((state) => state.contract);
  const inputState = useGetInputState(input.id, form) as FormStateItem;

  // check for duplicate change order names
  const isNameDuped = useCheckChangeOrderNameDuped({
    projectId,
    input,
    inputState,
  });

  const [inputValue, changeHandler, blurHandler] = useInputChangeHandler(
    input,
    inputState,
    actions
  );

  const contractClickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(contractActions.setClickedContract({ isRowClicked: true }));
  };

  const isError = !showError
    ? !inputState?.isValid && inputState?.isTouched
    : !inputState?.isValid;
  const isRequired = input?.required;

  // currently only showing the currency icon on theleft of the input, but add others here as an || conditional
  const isLeftIcon = input.isCurrency;
  const isRightIcon = !input.isCurrency;

  return (
    <div className={`${classes['input-container']} ${addOnClass}`}>
      <label
        className={`font-sans ${
          input.isOnOverlay ? 'font-semibold text-md' : 'font-semibold text-lg'
        }`}
        htmlFor={input.id}
      >
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
            className={`font-sans w-full block placeholder:text-base border-2 text-stak-dark-gray ${
              input.isOnOverlay ? 'rounded-md py-1.5' : 'rounded-lg'
            } ${
              isLeftIcon
                ? 'pl-10'
                : isRightIcon && (isError || isNameDuped) && isRequired
                ? 'pr-10'
                : 'px-3'
            } ${classes['input-container__input']} ${
              (isError || isNameDuped) && isRequired
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
            onChange={
              changeHandler as (e: React.ChangeEvent<HTMLInputElement>) => void
            }
            onBlur={(e) => {
              onBlur && onBlur(e);
              blurHandler && (blurHandler as () => void)();
            }}
            onFocus={onFocus}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            ref={inputRef}
          />
          {(isError || isNameDuped) && isRequired && (
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
                (isError || isNameDuped) && isRequired ? 'pr-10' : 'pr-3'
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
      {(isError || isNameDuped) && isRequired && (
        <p
          className="font-sans mt-2 text-sm text-red-600"
          id={`${input.id}-error-message`}
        >
          {isNameDuped ? 'This name is already in use.' : input.errormessage}
        </p>
      )}
    </div>
  );
};

export default InputBaseWithValidation;
