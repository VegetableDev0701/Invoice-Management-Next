import React, { ReactNode, ForwardedRef } from 'react';

interface Props {
  icon: ReactNode;
  children?: ReactNode;
  className?: string;
  type?: 'submit' | 'reset' | 'button' | undefined;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ButtonIcon = React.forwardRef<HTMLButtonElement, Props>(
  (props: Props, ref: ForwardedRef<HTMLButtonElement>) => {
    return (
      <button
        className={`px-2 relative border-none text-white rounded-xl transition duration-100 ease-in-out 
        ${
          props.disabled
            ? 'cursor-not-allowed bg-[var(--stak-dark-green-50)]'
            : `bg-stak-dark-green hover:bg-stak-dark-green-hover hover:border-none hover:cursor-pointer
            hover:shadow-lg active:bg-stak-dark-green-hover active:border-none active:cursor-pointer active:shadow-sm`
        } 
        font-sans font-md focus:ring-0 focus-visible:outline-0 min-w-fit 
        ${props.className}`}
        type={props.type}
        onClick={props.onClick}
        disabled={props.disabled}
        ref={ref}
      >
        {props.icon}
        {props.children}
      </button>
    );
  }
);

ButtonIcon.displayName = 'ButtonIcon';
export default ButtonIcon;
