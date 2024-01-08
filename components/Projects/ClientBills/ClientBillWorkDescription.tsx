import {
  BillWorkDescriptionV2,
  CurrentActualsClientBillV2,
  SubTotalsV2,
} from '@/lib/models/clientBillModel';

import ClientBillWorkDescriptionTable from '@/components/Tables/Invoices/ClientBillWorkDescriptionTable';
import { useAppSelector as useSelector } from '@/store/hooks';
import {
  ChangeOrderSummary,
  ClientBillSummary,
} from '@/lib/models/summaryDataModel';

interface Props {
  projectId: string;
  clientBillId: string;
  currentActuals: CurrentActualsClientBillV2;
  tableData: BillWorkDescriptionV2 | null;
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
  ) as ChangeOrderSummary;

  const subTotals: SubTotalsV2 | null = currentActuals
    ? {
        budgeted: Object.fromEntries(
          Object.entries(currentActuals.currentActuals).filter(
            ([_, currentActual]) => {
              return (
                // TODO
                // currentActual.divisionName === 'Profit, Taxes, and Liability'
                currentActual.costCodeName === ''
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
      projectId={projectId}
    />
  );
}
