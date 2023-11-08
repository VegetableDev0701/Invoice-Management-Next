import { InvoiceTableRow } from '@/lib/models/invoiceDataModels';
import { extractLineItems } from '@/lib/utility/invoiceHelpers';
import { useAppSelector as useSelector } from '@/store/hooks';
import React from 'react';

export default function MultipleCostCodes(_: {
  currentData: InvoiceTableRow | null;
}) {
  const processInvoiceFormState = useSelector(
    (state) => state.addProcessInvoiceForm
  );

  const lineItems = extractLineItems({
    formState: processInvoiceFormState,
    numLineItems: processInvoiceFormState.numLineItems.value as number,
  });

  const workDescriptions: string[] = [];
  const costCodes: string[] = [];

  Object.entries(lineItems).forEach(([id, idState]) => {
    if (id.includes('work-description')) {
      workDescriptions.push(idState.value as string);
    }
    if (id.includes('cost-code')) {
      costCodes.push(idState.value as string);
    }
  });

  return (
    <div className="flex flex-col self-stretch gap-6 pt-2">
      <span className="block font-sans font-semibold text-md text-stak-dark-gray">
        Work Description(s):{' '}
        <span className="font-normal">{workDescriptions?.join(' / ')}</span>
      </span>
      <span className="block font-sans font-semibold text-md text-stak-dark-gray">
        Cost Code(s):{' '}
        <span className="font-normal">{costCodes?.join(' / ')}</span>
      </span>
    </div>
  );
}
