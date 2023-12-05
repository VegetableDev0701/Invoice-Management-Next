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

export interface DropDownItem {
  label: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface DropDownButtonProp {
  label: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  items: DropDownItem[];
}

export interface Notification {
  id: string;
  content?: string;
  icon?: 'success' | 'error' | 'trash' | 'save';
  autoHideDuration?: number;
}

export interface NotificationContainer {
  messages: Array<Notification>;
  defaultDuration: number;
  defaultIcon: string;
}
