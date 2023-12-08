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
