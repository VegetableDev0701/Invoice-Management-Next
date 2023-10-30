import accountSettings from '@/pages/[companyId]/account-settings';
import { AccountSettings } from './formStateModels';

export interface RequestConfig {
  url: string;
  method?: string;
  headers?: Headers;
  body?: string | {};
}

export interface Headers {
  [key: string]: string;
}
