import { ContractSummaryData } from '@/store/contract-slice';

import { VendorSummary } from './summaryDataModel';
import { PredictedSupplier } from './invoiceDataModels';

export interface AgaveVendorFormStateV2 {
  [key: string]: AgaveVendorFormStateItemV2;
}

export interface AgaveVendorFormStateItemV2 {
  value: string | number | boolean | undefined;
  isValid?: boolean | null;
  isTouched?: boolean | null;
  isAdded?: boolean;
  isShowing?: boolean;
  recursiveLevel?: Array<number>;
  costCodeName?: string;
  invoiceIds?: string[];
  laborFeeIds?: string[];
  changeOrder?: string | null;
  amount?: string | number | null;
}

export interface UpdateInvoiceVendor {
  [invoiceId: string]: {
    project_id: null;
    predicted_supplier_name: PredictedSupplier;
    vendor: { name: string; uuid: string | null };
  };
}

export interface UpdateContractVendor {
  [contractId: string]: {
    project_id: string;
    summaryData: ContractSummaryData;
  };
}

export interface UpdateDocData {
  contract: UpdateContractVendor | object;
  invoice: UpdateInvoiceVendor | object;
}

export interface SyncAllVendorResponseData {
  message: string;
  agave_response_data: VendorSummary;
  update_doc_data: UpdateDocData;
}
