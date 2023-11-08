import { useAppDispatch as useDispatch } from '@/store/hooks';

import { addBudgetFormActions } from '@/store/add-budget-slice';

import useInputChangeHandler from '@/hooks/use-inputChangeHandler';

import { formatNumber } from '@/lib/utility/formatter';
import { useGetInputState } from '@/lib/utility/formHelpers';
import { Items } from '@/lib/models/formDataModel';
import { Actions } from '@/lib/models/types';
import { FormState, FormStateItem } from '@/lib/models/formStateModels';

import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import ToggleOffInputIcon from '@/public/icons/ToggleOffInput';
import ToggleOnInputIcon from '@/public/icons/ToggleOnInput';

import classes from './Input.module.css';

export interface Props {
  props: PropsItems;
}

export interface PropsItems {
  input: Items;
  actions: Actions;
  form: string;
  classes?: string;
  showError?: boolean;
  icon?: JSX.Element;
}

const InputToggleOnOff = (props: Props) => {
  const {
    icon,
    input,
    showError,
    actions,
    form,
    classes: addOnClass,
  } = props.props;

  const dispatch = useDispatch();

  const inputState = useGetInputState(input.id, form);

  const [inputValue, changeHandler, blurHandler] = useInputChangeHandler(
    input,
    inputState as FormStateItem,
    actions
  );

  const toggleClickHandler = (
    e: React.MouseEvent<HTMLButtonElement>,
    toggleType: 'on' | 'off',
    id: string
  ) => {
    e.preventDefault();
    if (toggleType === 'on') {
      dispatch(
        addBudgetFormActions.setIsAddedState({
          inputKey: id,
          isAdded: true,
        })
      );
    } else {
      dispatch(
        addBudgetFormActions.setIsAddedState({
          inputKey: id,
          isAdded: false,
        })
      );
      // dispatch(
      //   addBudgetFormActions.setFormElement({
      //     inputValue: '',
      //     inputKey: id,
      //     isValid: true,
      //   })
      // );
    }
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
      <div className="flex items-center -ml-9 gap-2">
        {inputState && !inputState.isAdded && (
          <div className={`flex pb-1 ${classes['toggle-buttons']}`}>
            <button
              onClick={(e) => {
                toggleClickHandler(e, 'on', input.id);
              }}
            >
              <ToggleOnInputIcon width={30} height={30} />
            </button>
          </div>
        )}
        {inputState && inputState.isAdded && (
          <div className={`flex pb-1 ${classes['toggle-buttons']}`}>
            <button
              onClick={(e) => {
                toggleClickHandler(e, 'off', input.id);
              }}
            >
              <ToggleOffInputIcon width={30} height={30} />
            </button>
          </div>
        )}
        <label
          className={`font-sans font-semibold text-md  ${
            !inputState?.isAdded && 'line-through'
          }`}
          htmlFor={input.id}
        >
          {`${(+input.id).toFixed(4)} - ${input.label}`}
        </label>
      </div>
      <div className="relative w-full mt-1">
        {isLeftIcon && icon && inputState && inputState.isAdded && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {icon}
          </div>
        )}
        {inputState && inputState.isAdded && (
          <div className="flex flex-row gap-2">
            <input
              className={`font-sans w-full block placeholder:text-base border-2 text-gray-700 rounded-md py-1.5' ${
                isLeftIcon
                  ? 'pl-10'
                  : isRightIcon && isError && isRequired
                  ? 'pr-10'
                  : 'px-3'
              } ${classes['input-container__input']} ${
                isError && isRequired
                  ? 'border-red-500 placeholder:text-red-500'
                  : 'border-stak-light-gray'
              }`}
              value={
                inputState?.value !== undefined
                  ? (inputState.value as any)
                  : input.value ||
                    (input.isCurrency
                      ? formatNumber(inputValue as string)
                      : inputValue)
              }
              id={input.id}
              type={input.type as string}
              data-testid={input['data-testid']}
              onChange={
                changeHandler as (
                  e: React.ChangeEvent<HTMLInputElement>
                ) => void
              }
              onBlur={blurHandler as () => void}
            />
          </div>
        )}
        {isError && isRequired && (
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
              isError && isRequired ? 'pr-10' : 'pr-3'
            }`}
          >
            {icon}
          </div>
        )}
      </div>
      {isError && isRequired && (
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

export default InputToggleOnOff;
