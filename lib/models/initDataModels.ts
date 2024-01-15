import {
  InvoiceProject,
  InvoiceLineItemItem,
  BoundingBox,
  InvoiceItem,
  Entity,
  PredictedSupplier,
  PredictedProject,
  ProcessedInvoiceData,
} from '@/lib/models/invoiceDataModels';

import {
  ContractSummaryData,
  ContractVendorObject,
  ContractEntry
} from '@/lib/models/summaryDataModel';

export const defaultBoundingBox: Pick<
  BoundingBox,
  'ul' | 'ur' | 'lr' | 'll' | 'page'
> = {
  ul: [],
  ur: [],
  lr: [],
  ll: [],
  page: 0,
};

export const defaultEntity: Pick<
  Entity,
  | 'entity_value_raw'
  | 'unit'
  | 'entity_value_norm'
  | 'page_reference'
  | 'bounding_box'
  | 'entity_type_major'
  | 'entity_type_minor'
  | 'confidence_score'
> = {
  entity_value_raw: '',
  unit: '',
  entity_value_norm: '',
  page_reference: 0,
  bounding_box: {
    ...defaultBoundingBox,
  },
  entity_type_major: '',
  entity_type_minor: '',
  confidence_score: 0,
};

export const defaultInvoiceProject: Pick<
  InvoiceProject,
  'address' | 'uuid' | 'name'
> = {
  address: '',
  uuid: '',
  name: '',
};

export const defaultInvoiceLineItemItem: Pick<
  InvoiceLineItemItem,
  | 'description'
  | 'amount'
  | 'cost_code'
  | 'work_description'
  | 'page'
  | 'bounding_box'
  | 'number_of_hours'
  | 'billable'
  | 'change_order'
> = {
  description: '',
  amount: '',
  cost_code: '',
  work_description: '',
  page: 0,
  bounding_box: defaultBoundingBox,
  number_of_hours: '0',
  billable: false,
  change_order: { name: '', uuid: '' },
};

export const defaultInvoiceLineItem = {};

export const defaultPredictedSupplier: Pick<
  PredictedSupplier,
  | 'supplier_name'
  | 'isGPT'
  | 'agave_uuid'
  | 'score'
  | 'vendor_match_conf_score'
  | 'uuid'
> = {
  supplier_name: '',
  isGPT: false,
  agave_uuid: '',
  score: '',
  vendor_match_conf_score: 0,
  uuid: '',
};

export const defaultPredictedProject: Pick<
  PredictedProject,
  'address' | 'top_scores' | 'score' | 'uuid' | 'name' | 'project_key'
> = {
  address: '',
  top_scores: {},
  score: 0,
  uuid: '',
  name: '',
  project_key: '',
};

export const defaultProcessedInvoiceData: Pick<
  ProcessedInvoiceData,
  | 'is_credit'
  | 'approver'
  | 'total_tax_amount'
  | 'line_items'
  | 'vendor'
  | 'change_order'
  | 'cost_code'
  | 'line_items_toggle'
  | 'total_amount'
  | 'invoice_id'
  | 'date_received'
  | 'is_synced'
  | 'invoice_date'
  | 'billable'
  | 'expense_tax'
> = {
  is_credit: false,
  approver: '',
  total_tax_amount: '',
  line_items: defaultInvoiceLineItem,
  vendor: {
    name: '',
    uuid: '',
  },
  change_order: {
    uuid: '',
    name: '',
  },
  cost_code: '',
  line_items_toggle: false,
  total_amount: '',
  invoice_id: '',
  date_received: '',
  is_synced: '',
  invoice_date: '',
  billable: false,
  expense_tax: false,
};

export const defaultInvoiceItem: Pick<
  InvoiceItem,
  | 'approved'
  | 'client_bill_id'
  | 'currency'
  | 'date_received'
  | 'doc_id'
  | 'document_type'
  | 'gcs_img_uri'
  | 'gcs_uri'
  | 'invoice_date'
  | 'invoice_id'
  | 'invoice_type'
  | 'is_attached_to_bill'
  | 'line_items'
  | 'line_items_gpt'
  | 'net_amount'
  | 'number_of_pages'
  | 'pages'
  | 'payment_terms'
  | 'processed'
  | 'predicted_supplier_name'
  | 'predicted_project'
  | 'processedData'
  | 'project'
  | 'project_id'
  | 'receiver_address'
  | 'receiver_name'
  | 'supplier_address'
  | 'supplier_id'
  | 'supplier_name'
  | 'total_amount'
  | 'total_tax_amount'
> = {
  approved: false,
  client_bill_id: '',
  currency: defaultEntity,
  date_received: '',
  doc_id: '',
  document_type: '',
  gcs_img_uri: [],
  gcs_uri: '',
  invoice_date: defaultEntity,
  invoice_id: defaultEntity,
  invoice_type: defaultEntity,
  is_attached_to_bill: false,
  line_items: [],
  net_amount: defaultEntity,
  number_of_pages: 0,
  pages: [],
  payment_terms: defaultEntity,
  processed: false,
  project_id: '',
  receiver_address: defaultEntity,
  receiver_name: defaultEntity,
  supplier_address: defaultEntity,
  supplier_id: '',
  supplier_name: defaultEntity,
  total_amount: defaultEntity,
  total_tax_amount: defaultEntity,
  line_items_gpt: defaultInvoiceLineItem,
  predicted_supplier_name: defaultPredictedSupplier,
  predicted_project: defaultPredictedProject,
  project: defaultInvoiceProject,
  processedData: defaultProcessedInvoiceData,
};
export const  defaultContractVendorObject: Pick<ContractVendorObject, 'name' | 'agave_uuid' | 'vendor_match_conf_score' | 'uuid'> ={
  name: '',
  agave_uuid: '',
  vendor_match_conf_score: 0,
  uuid: ''
}
export const defaultContractSummaryData: Pick<ContractSummaryData, 'projectName' | 'contractAmt' |'date' | 'workDescription' | 'vendor'> = {
  projectName: '',
  date: '',
  contractAmt: '',
  workDescription: '',
  vendor: defaultContractVendorObject
}
export const defaultContractEntry: Pick<ContractEntry, 'gcs_img_uri' | 'gcs_uri' | 'summaryData' | 'uuid' > = {
  gcs_img_uri: [],
  gcs_uri: '',
  summaryData: defaultContractSummaryData,
  uuid: ''
}