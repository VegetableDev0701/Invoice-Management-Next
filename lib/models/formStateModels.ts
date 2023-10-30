import { UserProfile } from '@auth0/nextjs-auth0/client';

export interface ChangeOrderFormState {
  [changeOrderId: string]: FormState;
}

export interface FormState {
  [key: string]: FormStateItem;
}

export interface FormStateItem {
  value: string | number | boolean;
  isValid?: boolean | null;
  isTouched?: boolean | null;
  isAdded?: boolean;
  isShowing?: boolean;
  division?: number;
  divisionName?: string;
  subDivision?: number;
  subDivisionName?: string;
  costCodeName?: string;
  invoiceIds?: string[];
  laborFeeIds?: string[];
  changeOrder?: string | null;
  amount?: string | number | null;
}

export interface SetFormElementPayload {
  inputKey: string;
  inputValue: any;
  isValid: boolean;
}

export interface IsTouchedPayload {
  inputKey: string;
  isTouched: boolean;
  isValid: boolean;
}

export interface InitialUserState {
  user?: User;
}

export interface User extends UserProfile {
  user_metadata: UserMetadata;
}

export interface UserMetadata {
  [key: string]: any;
  accountSettings: AccountSettings;
}

export interface AccountSettings {
  [key: string]: AccountSetting;
}

interface AccountSetting {
  value: any;
}
