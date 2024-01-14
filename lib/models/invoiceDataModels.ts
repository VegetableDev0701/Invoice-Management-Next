export interface Invoices {
  [invoiceId: string]: InvoiceItem;
}

export interface InvoiceData {
  data: Invoices;
  isLoading: boolean;
}

export interface PredictedSupplier {
  supplier_name: string;
  isGPT: boolean;
  agave_uuid: string | null;
  score: string | number | null;
  vendor_match_conf_score: number | null;
  uuid: string | null;
}

export interface InvoiceItem {
  approved: boolean;
  client_bill_id: string | null;
  currency: Entity | null;
  date_received: string;
  doc_id: string;
  document_type: string | null;
  gcs_img_uri: string[];
  gcs_uri: string;
  invoice_date: Entity | null;
  invoice_id: Entity | null;
  invoice_type: Entity | null;
  is_attached_to_bill: boolean;
  line_items: Entity[];
  line_items_gpt: InvoiceLineItem;
  net_amount?: Entity | null;
  number_of_pages: number;
  pages: Page[];
  payment_terms: Entity | null;
  processed: boolean;
  predicted_supplier_name: PredictedSupplier | null;
  predicted_project: PredictedProject | null;
  processedData?: ProcessedInvoiceData;
  project: InvoiceProject;
  project_id: string | null;
  receiver_address: Entity | null;
  receiver_name: Entity | null;
  supplier_address: Entity | null;
  supplier_id: string | null;
  supplier_name: Entity | null;
  total_amount: Entity | null;
  total_tax_amount: Entity | null;
}

export interface InvoiceTableRows {
  [invoiceId: string]: InvoiceTableRow;
}
// TODO I don't like this any bullshit typing here but every time i try and fix this one area it is way harder than it should be
export interface InvoiceTableRow {
  [key: string]: any;
  approved: string;
  approver?: string;
  billable: boolean;
  change_order: { uuid: string; name: string } | null | undefined;
  cost_code?: [object]; // TODO remove from data???
  date_received: string;
  doc_id: string;
  gcs_img_uri: string[];
  image_dim: { width: number; height: number };
  invoice_date?: string;
  invoice_date_bb: BoundingBox[] | null;
  invoice_id?: string;
  invoice_id_bb: BoundingBox[] | null;
  is_credit: boolean;
  is_synced: string;
  line_items: Entity[];
  line_items_gpt: InvoiceLineItem;
  line_items_toggle: boolean;
  predicted_project: string;
  processed: string;
  project: string | null;
  project_id: string | null;
  total_amount: string;
  total_amount_bb: BoundingBox[] | null;
  total_tax_amount: string;
  total_tax_amount_bb: BoundingBox[] | null;
  vendor_name: string;
  vendor_name_bb: BoundingBox[] | null;
  vendor_uuid: string | null;
}

// The modified version of the bounding box which actually
// creates the magnified portion on the image, ll is not required
export interface BoundingBox {
  ul: number[];
  ur: number[];
  lr: number[];
  ll?: number[];
  page?: number;
}

export interface ProcessedInvoiceData {
  is_credit: boolean;
  approver: string;
  total_tax_amount: string;
  line_items: InvoiceLineItem | object | null;
  vendor: { name: string | null; uuid: string | null };
  change_order: { uuid: string; name: string } | null;
  cost_code: string | null;
  line_items_toggle: boolean;
  total_amount: string;
  invoice_id: string;
  date_received: string;
  is_synced?: string;
  invoice_date?: string;
  billable: boolean;
  expense_tax: boolean;
}

export interface InvoiceLineItem {
  [itemId: string]: InvoiceLineItemItem;
}

export interface InvoiceLineItemItem {
  description: string;
  amount: string;
  cost_code?: string | null;
  work_description?: string;
  page: number | null;
  bounding_box: BoundingBox | null;
  number_of_hours?: string;
  billable: boolean;
  change_order: { name: string; uuid: string } | null;
}

export interface Entity {
  entity_value_raw: string;
  unit: string | null;
  entity_value_norm: string | null;
  page_reference: number;
  bounding_box: BoundingBox;
  entity_type_major: string;
  entity_type_minor: string | null;
  confidence_score: number;
}
interface Page {
  height: number;
  number: number;
  resolution_unit: string;
  image_transform: number[] | null;
  width: number;
}
export interface InvoiceProject {
  address: string | null;
  uuid: string | null;
  name: string | null;
}

export interface PredictedProject {
  address: string;
  top_scores: { [address: string]: number };
  score: number;
  uuid: string;
  name: string;
  project_key: string;
}

export interface ContractSummary {
  [contractId: string]: ContractSummaryItem;
}
interface ContractSummaryItem {
  name: string;
  workDescription: string;
  contractDate: string;
  contractAmt: string;
}

export interface InvoiceTableHeadings {
  vendor_name: string;
  project: string;
  total_amount: string;
  invoice_id: string;
  date_received: string;
  total_tax_amount?: string;
  predicted_project?: string;
  processed?: string;
  approved?: string;
  status: string;
}
