import React, { useEffect, useState } from 'react';

import styles from './Input.module.css';
import { Items } from '@/lib/models/formDataModel';

interface Props {
  error: Error;
  input: Input;
}

interface Error {
  touched: boolean;
  valid: boolean;
}

interface Input {
  placeholder: string;
  label: string;
  id: string;
}

export const Input = (props: Props) => {
  const [isError, setIsError] = useState(true);

  useEffect(() => {
    !props.error.valid && props.error.touched
      ? setIsError(true)
      : setIsError(false);
  }, [props.error.valid, props.error.touched]);

  const test = isError
    ? `${props.input.label.slice(0, -1)} is required`
    : props.input.placeholder;

  const classes = `${styles['input-container']}`;
  return (
    <div className={classes}>
      <label className={styles['label']} htmlFor={props.input.id}>
        {props.input.label}
      </label>
      <input
        className={isError ? styles['invalid'] : ''}
        {...props.input}
        placeholder={test}
      />
    </div>
  );
};

// export const TextArea = (props) => {
//   return (
//     <div className={`${styles['input-container']} ${styles['text']}`}>
//       <label htmlFor={props.input.id}>{props.input.label}</label>
//       <textarea {...props.input}></textarea>
//     </div>
//   );
// };
