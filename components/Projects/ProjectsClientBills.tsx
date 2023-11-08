import { useMemo } from 'react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';

import { ClientBillSummaryItem } from '@/lib/models/summaryDataModel';

import CheckboxSubTable from '../Tables/SubTables/CheckboxSortHeadingsTableSub';
import {
  deleteProjectData,
  projectDataActions,
} from '@/store/projects-data-slice';
import { useUser } from '@auth0/nextjs-auth0/client';
import { User } from '@/lib/models/formStateModels';
import { deleteClientBillDataFromB2A } from '@/store/add-client-bill';

interface Props {
  projectId: string;
}

const tableHeadings = {
  billTitle: 'Billing Period',
  changeOrder: 'Change Orders',
  subTotal: 'Subtotal',
  insuranceLiability: 'Insurance Liability',
  boTax: 'BO Tax',
  salesTax: 'Sales Tax',
  profit: 'Profit',
  total: 'Total Due',
};

const checkBoxButtons = [{ label: 'Delete', buttonPath: '#', disabled: false }];

export default function ProjectsClientBills(props: Props) {
  const { projectId } = props;
  const { user } = useUser();

  const dispatch = useDispatch();

  const clientBills = useSelector(
    (state) => state.projects[projectId]?.['client-bills-summary']
  );

  const clientBillRows: ClientBillSummaryItem[] | null = useMemo(() => {
    if (clientBills) {
      return Object.values(clientBills).map((value) => {
        const changeOrder = value?.changeOrders ? value.changeOrders : '0.00';
        return { ...value, changeOrder };
      });
    } else {
      return null;
    }
  }, [clientBills]);

  const confirmModalHandler = (selected: ClientBillSummaryItem[]) => {
    const clientBillIds = selected.map(
      (clientBill) => clientBill.uuid as string
    );

    dispatch(
      projectDataActions.removeSelectedRow({
        projectId: projectId,
        ids: clientBillIds,
        stateKeySummary: 'client-bills-summary',
      })
    );
    dispatch(
      deleteClientBillDataFromB2A({
        projectId,
        companyId: (user as User).user_metadata.companyId,
        clientBillId: clientBillIds[0],
      })
    ).then((result) => {
      if (result) {
        dispatch(
          deleteProjectData({
            companyId: (user as User).user_metadata.companyId as string,
            sendData: clientBillIds,
            projectId: projectId,
            dataType: 'client-bill',
          })
        );
      }
    });
    // update the actuals data to remove everything in this bill
  };

  return (
    <>
      {/* <ProcessInvoiceSlideOverlay
        rows={invoiceRows as Invoices[]}
        projectId={projectId}
        contractData={contractData ? contractData : null}
      /> */}
      <CheckboxSubTable
        headings={tableHeadings}
        rows={clientBillRows}
        projectId={projectId}
        selectedRowId={null}
        baseUrl={`/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}`}
        checkboxButtons={checkBoxButtons}
        onConfirmModal={confirmModalHandler}
      />
    </>
  );
}
