import {
  BillWorkDescription,
  CurrentActualsClientBill,
  SubTotals,
} from '@/lib/models/clientBillModel';

import ClientBillWorkDescriptionTable from '@/components/Tables/Invoices/ClientBillWorkDescriptionTable';
import { useAppSelector as useSelector } from '@/store/hooks';
import { ClientBillSummary } from '@/lib/models/summaryDataModel';

interface Props {
  projectId: string;
  clientBillId: string;
  currentActuals: CurrentActualsClientBill;
  tableData: BillWorkDescription | null;
}

const tableHeadings = {
  qtyAmt: 'Qty',
  description: 'Description',
  rateAmt: 'Rate',
  vendor: 'Vendor',
  totalAmt: 'Total ($)',
};

export default function ClientBillWorkDescription(props: Props) {
  const { tableData, currentActuals, clientBillId, projectId } = props;

  const clientBillSummary = useSelector(
    (state) =>
      (state.projects[projectId]['client-bills-summary'] as ClientBillSummary)[
        clientBillId
      ]
  );

  const changeOrderSummary = useSelector(
    (state) => state.projects[projectId]['change-orders-summary']
  );

  const subTotals: SubTotals | null = currentActuals
    ? {
        budgeted: Object.fromEntries(
          Object.entries(currentActuals.currentActuals).filter(
            ([_, currentActual]) => {
              return (
                currentActual.divisionName === 'Profit, Taxes, and Liability'
              );
            }
          )
        ),
        changeOrders:
          currentActuals.currentActualsChangeOrders.profitTaxesLiability,
      }
    : null;

  return (
    <ClientBillWorkDescriptionTable
      headings={tableHeadings}
      tableData={tableData}
      subTotals={subTotals}
      clientBillSummary={clientBillSummary}
      changeOrderSummary={changeOrderSummary}
      currentActualsChangeOrders={currentActuals.currentActualsChangeOrders}
    />
  );
}
