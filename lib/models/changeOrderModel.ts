export interface ChangeOrderContentItem {
  rateAmt: string;
  description: string | null;
  qtyAmt: string;
  uuid: string;
  costCode: string | null;
  isInvoice: boolean | null;
  totalAmt: string;
  isLaborFee: boolean | null;
  vendor: string;
}
export interface ChangeOrderContent {
  [itemId: string]: ChangeOrderContentItem;
}

export interface ChangeOrderTableRows {
  [changeOrderId: string]: ChangeOrderContentItem[];
}
