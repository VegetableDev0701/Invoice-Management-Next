import React, { ReactNode, ForwardedRef } from 'react';
import styles from './Button.module.css';

interface Props {
  buttonText: string;
  children?: ReactNode;
  className?: string;
  type?: 'submit' | 'reset' | 'button' | undefined;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  // onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
}

const Button = React.forwardRef<HTMLButtonElement, Props>(
  (props: Props, ref: ForwardedRef<HTMLButtonElement>) => {
    return (
      <button
        className={`${styles['button']} ${
          props.disabled && props.disabled === true
            ? styles['button__disabled']
            : styles['button__active']
        } font-sans font-md focus:ring-0 focus-visible:outline-0 min-w-fit ${
          props.className
        }`}
        type={props.type}
        onClick={props.onClick}
        disabled={props.disabled}
        ref={ref}
      >
        {props.buttonText}
        {props.children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
