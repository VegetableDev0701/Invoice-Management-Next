import { useEffect, useState } from 'react';

import { useAppDispatch as useDispatch } from '@/store/hooks';

import { checkInputField, getValidFunc } from '@/lib/validation/formValidation';
import { Items } from '@/lib/models/formDataModel';
import { FormStateItem } from '@/lib/models/formStateModels';
import { Actions } from '@/lib/models/types';

function useInputChangeHandler(
  input: Items,
  inputState: FormStateItem,
  actions: Actions
) {
  const [inputValue, setInputValue] = useState(
    inputState?.value ? (inputState.value as string) : ''
  );
  const dispatch = useDispatch();

  // checks if any pre-populated fields are present at render and validates them
  useEffect(() => {
    if (input.value) {
      checkInputField(
        input,
        actions,
        setInputValue,
        getValidFunc,
        dispatch,
        input.value as string
      );
    }
  }, []);

  function changeHandler(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    checkInputField(
      input,
      actions,
      setInputValue,
      getValidFunc,
      dispatch,
      value
    );
  }

  function blurHandler() {
    dispatch(
      actions.setIsTouchedState({
        inputKey: input.id,
        isTouched: true,
        isValid: getValidFunc(
          input.validFunc || input.id,
          input?.required as boolean
        )(inputValue),
      })
    );
  }

  return [inputValue, changeHandler, blurHandler];
}

export default useInputChangeHandler;
