import { LaborLineItemItem } from './summaryDataModel';

export interface Invoices {
  [invoiceId: string]: InvoiceItem;
}

export interface InvoiceData {
  data: Invoices;
  isLoading: boolean;
}

export interface InvoiceItem {
  processedData?: ProcessedInvoiceData;
  supplier_name: Entity;
  supplier_id: string | null;
  is_attached_to_bill: boolean;
  predicted_supplier_name: { supplier_name: string; isGPT: boolean };
  gcs_uri: string;
  pages: Page[];
  number_of_pages: number;
  currency: Entity;
  receiver_address: Entity;
  gcs_img_uri: string[];
  approved: boolean;
  receiver_name: Entity;
  project: InvoiceProject;
  invoice_date: Entity;
  client_bill_id: string | null;
  project_id: string | null;
  doc_id: string;
  predicted_project: PredictedProject;
  invoice_type: Entity;
  total_tax_amount: Entity | null;
  line_items: Entity[];
  supplier_address: Entity;
  document_type: string | null;
  payment_terms: Entity;
  date_received: string;
  total_amount: Entity;
  invoice_id: Entity;
  processed: boolean;
  line_items_gpt: InvoiceLineItem;
  net_amount?: Entity;
}

export interface InvoiceTableRows {
  [invoiceId: string]: InvoiceTableRow;
}
// TODO I don't like this any bullshit typing here...not sure why I need it, but probably needs to be fixed
export interface InvoiceTableRow {
  [key: string]: any;
  approved: string;
  approver: string | undefined;
  change_order: { uuid: string; name: string } | null | undefined;
  cost_code: [{}] | undefined; // TODO remove from data???
  date_received: string;
  doc_id: string;
  gcs_img_uri: string[];
  image_dim: { width: number; height: number };
  invoice_id: string | undefined;
  invoice_id_bb: BoundingBox[] | null;
  is_credit: boolean;
  is_synced: string;
  line_items: Entity[];
  line_items_gpt: InvoiceLineItem | null;
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
  line_items: InvoiceLineItem | {} | null;
  vendor_name: string;
  change_order: { uuid: string; name: string } | null;
  cost_code: string | null;
  line_items_toggle: boolean;
  total_amount: string;
  invoice_id: string;
  date_received: string;
  is_synced?: string;
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
  number_of_hours?: number;
  change_order: { name: string; uuid: string } | null;
}

interface Entity {
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
  address: string;
  uuid: string;
  name: string;
}
interface PredictedProject {
  address: string;
  top_scores: { [address: string]: number };
  score: number;
  uuid: string;
  name: string;
  project_key: string;
}

interface ContractSummary {
  [contractId: string]: ContractSummaryItem;
}
interface ContractSummaryItem {
  name: string;
  workDescription: string;
  contractDate: string;
  contractAmt: string;
}
