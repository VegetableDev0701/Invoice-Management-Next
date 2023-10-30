import { RefObject } from 'react';

export interface Buttons {
  label: string;
  ref?: RefObject<HTMLButtonElement>;
  isShowingKeyName?: string;
  buttonPath?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  onAddInvoice?: (state: boolean) => void;
  inputClick?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
