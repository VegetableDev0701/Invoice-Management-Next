import { useMemo } from 'react';

import { useAppSelector as useSelector } from '@/store/hooks';

import { formatNumber } from '@/lib/utility/formatter';
import { convertUtcToLocalTime } from '@/lib/utility/tableHelpers';
import {
  InvoiceItem,
  InvoiceTableRow,
  Invoices,
  ProcessedInvoiceData,
} from '@/lib/models/invoiceDataModels';
import { isObjectEmpty } from '@/lib/utility/utils';
/**
 * Custom hook for creating invoice rows.
 * Whenever there is processed data, this will use that data to create the invoice rows.
 * This hook is called whenever an invoice is displayed, so if an invoice gets processed,
 * that invoice will always show the processedData in any table that uses this hook
 *
 * @param {Object} param0 - Configuration object for creating invoice rows.
 * @param {boolean} param0.pageLoading - A flag indicating if the page is currently loading.
 * @param {Invoices} param0.invoices - The collection of invoices to which rows will be added.
 * @param {string} [param0.projectId] - The optional ID of a project. If provided, invoice rows will be created in the context of this specific project.
 * @param {boolean} [param0.isChangeOrderInvoiceTable] - An optional flag indicating if the context is a change order invoice table. If true, invoice rows will be created specifically for change orders.
 * @param {Rows|null} [param0.selectedChangeOrder] - An optional parameter representing a selected change order. If provided, invoice rows will be related to this specific change order.
 *
 * @returns TBD based on the actual implementation. Usually, hooks return either a value or a function to manipulate the state.
 */
export default function useCreateInvoiceRows({
  pageLoading,
  invoices,
  projectId,
}: {
  pageLoading: boolean;
  invoices: Invoices;
  projectId?: string;
}) {
  // for some reason I'm using slightly different forms for my invoices in
  // the project invoice tables and the client bill invoice tables. Just another
  // thing to fucking deal with...
  const allInvoices = invoices?.allInvoices ?? invoices;

  const projectSupervisor: string | undefined = useSelector(
    (state) =>
      projectId &&
      state.data.projectsSummary.allProjects[projectId].projectSuper
  );

  function formatTaxAmount(amount: string | undefined) {
    if (!amount) return false;
    const num = Number(amount.replaceAll(',', ''));
    return !isNaN(num) ? formatNumber(num.toFixed(2)) : '0.00';
  }

  // Normalize invoice data for table
  const invoiceRows: InvoiceTableRow[] | null = useMemo(() => {
    if (!pageLoading && allInvoices) {
      return (Object.values(allInvoices) as InvoiceItem[])
        .filter((invoice) => {
          if (projectId) {
            return invoice.project.uuid === projectId;
          } else {
            return (
              invoice.project.name === undefined ||
              invoice.project.name === '' ||
              invoice.project.name === null
            );
          }
        })
        .map((row) => {
          return {
            vendor_name:
              row?.processedData?.vendor_name ??
              row.predicted_supplier_name?.supplier_name,
            vendor_name_bb: row?.supplier_name?.bounding_box
              ? [
                  {
                    ...row.supplier_name.bounding_box,
                    page: row.supplier_name?.page_reference ?? 1,
                  },
                ]
              : null,
            invoice_id:
              row?.processedData?.invoice_id ??
              row.invoice_id?.entity_value_raw,
            invoice_id_bb: row?.invoice_id?.bounding_box
              ? [
                  {
                    ...row.invoice_id.bounding_box,
                    page: row.invoice_id?.page_reference ?? 1,
                  },
                ]
              : null,
            total_amount: row?.processedData?.total_amount
              ? formatNumber(row.processedData.total_amount)
              : row.total_amount?.entity_value_raw
              ? formatNumber(row.total_amount.entity_value_raw)
              : row.net_amount?.entity_value_raw
              ? formatNumber(row.net_amount.entity_value_raw)
              : '0.00',
            total_amount_bb: row?.total_amount?.bounding_box
              ? [
                  {
                    ...row.total_amount.bounding_box,
                    page: row.total_amount?.page_reference ?? 1,
                  },
                ]
              : row?.net_amount?.bounding_box
              ? [
                  {
                    ...row.net_amount.bounding_box,
                    page: row.net_amount?.page_reference ?? 1,
                  },
                ]
              : null,
            total_tax_amount:
              formatTaxAmount(row?.processedData?.total_tax_amount) ||
              formatTaxAmount(row?.total_tax_amount?.entity_value_raw) ||
              '0.00',
            total_tax_amount_bb:
              row?.total_tax_amount?.entity_value_raw &&
              row.total_tax_amount.entity_value_raw !== ''
                ? row.total_tax_amount?.bounding_box
                  ? [
                      {
                        ...row.total_tax_amount.bounding_box,
                        page: row.total_tax_amount?.page_reference ?? 1,
                      },
                    ]
                  : null
                : null,
            predicted_project: row.predicted_project.name,
            project: row.project.name,
            project_id: row.project.uuid,
            invoice_date:
              row?.processedData?.invoice_date ??
              row?.invoice_date?.entity_value_norm ??
              row?.invoice_date?.entity_value_raw ??
              null,
            invoice_date_bb: row?.invoice_date?.bounding_box
              ? [
                  {
                    ...row.invoice_date.bounding_box,
                    page: row.invoice_date?.page_reference ?? 1,
                  },
                ]
              : null,
            date_received:
              row?.processedData?.date_received ??
              convertUtcToLocalTime(row.date_received, 'US/Pacific', true),
            cost_code: row?.processedData?.cost_code,
            line_items_toggle:
              'line_items_toggle' in (row.processedData || {})
                ? (row.processedData as ProcessedInvoiceData).line_items_toggle
                : row?.processedData?.line_items &&
                  !isObjectEmpty(row.processedData.line_items)
                ? true
                : false,
            line_items: row.line_items,
            line_items_gpt:
              row?.processedData?.line_items &&
              !isObjectEmpty(row.processedData.line_items)
                ? row.processedData.line_items
                : row?.line_items_gpt
                ? row.line_items_gpt
                : null,
            // TODO will throw an error here if we delete a change order
            // becuase it doesn't get deleted from the processedData object
            // ...I think this got fixed???
            change_order: row?.processedData?.change_order
              ? {
                  name: row.processedData.change_order.name,
                  uuid: row.processedData.change_order.uuid,
                }
              : null,
            is_credit: row?.processedData?.is_credit ?? false,
            processed: row.processed ? 'Yes' : 'No',
            approved: row.approved ? 'Yes' : 'No',
            is_synced: row?.processedData?.is_synced ?? 'No',
            approver: row?.processedData?.approver ?? projectSupervisor,
            gcs_img_uri: row.gcs_img_uri,
            doc_id: row.doc_id,
            billable: row?.processedData?.billable ?? true,
            image_dim: {
              width: row.pages[0].width,
              height: row.pages[0].height,
            },
          } as InvoiceTableRow;
        });
    } else {
      return null;
    }
  }, [invoices?.allInvoices ? invoices.allInvoices : invoices, pageLoading]);

  return invoiceRows;
}
