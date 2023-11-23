import { useState } from 'react';

import { Items } from '@/lib/models/formDataModel';

import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

import classes from './Input.module.css';

export interface Props {
  input: Items;
  classes: string;
  showError: boolean;
  onChange: (id: string, value: string) => void;
}

const InputBaseAddItem = (props: Props) => {
  const { input, showError, onChange, classes: addOnClass } = props;
  const [inputValue, setInputValue] = useState<string>('');

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const { id, value } = e.target;
    setInputValue(value);
    onChange(id, value);
  };

  const isError = showError && inputValue === '';

  return (
    <div className={`flex flex-col justify-center ${addOnClass}`}>
      <label
        className="font-sans font-semibold text-base -mb-1"
        htmlFor={input.id}
      >
        {input.label}
      </label>
      <div className="relative w-full mt-1 rounded-md shadow-sm">
        <input
          className={`font-sans w-full block placeholder:text-base border-[2.5px] rounded-lg text-stak-dark-gray ${
            classes['input-container__input']
          } ${
            isError
              ? 'border-red-500 placeholder:text-red-500'
              : 'border-stak-light-gray'
          }`}
          value={inputValue}
          id={input.id}
          type={input.type as string}
          data-testid={input['data-testid']}
          onChange={changeHandler}
        />
        {isError && (
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
      </div>
    </div>
  );
};

export default InputBaseAddItem;
