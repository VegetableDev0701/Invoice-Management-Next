import { useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import {
  deleteProjectData,
  projectDataActions,
} from '@/store/projects-data-slice';
import { addChangeOrderFormActions } from '@/store/add-change-order';
import {
  OverlayContent,
  getCurrentProjectData,
  overlayActions,
} from '@/store/overlay-control-slice';
import { companyDataActions } from '@/store/company-data-slice';

import { formatNumber } from '@/lib/utility/formatter';
import { User } from '@/lib/models/formStateModels';
import {
  ChangeOrderSummary,
  ChangeOrderSummaryItem,
  LaborSummary,
} from '@/lib/models/summaryDataModel';
import { createRemoveCoFromData } from '@/lib/utility/changeOrderHelpers';

import Card from '../UI/Card';
import CheckboxSubTable from './SubTables/CheckboxSortHeadingsTableSub';

import WorkDescriptionTable from './WorkDescriptionTable';
import { isObjectEmpty } from '@/lib/utility/utils';
import { uiActions } from '@/store/ui-slice';
import ModalErrorWrapper from '../UI/Modal/ErrorModalWrapper';

interface Props {
  tableData: ChangeOrderSummary | null;
  projectId: string;
  overlayContent: OverlayContent;
}

const changeOrderTableHeadings = {
  name: 'C/O Name',
  workDescription: 'Description',
  subtotalAmt: 'Amount',
  numItems: '# Items',
};

const changeOrderContentHeadings = {
  qtyAmt: 'Qty',
  description: 'Description',
  rateAmt: 'Rate',
  vendor: 'Vendor',
  totalAmt: 'Amount',
};

const changeOrderTableCheckboxButtons = [
  { label: 'Delete', buttonPath: '#', disabled: false },
];

export default function ChangeOrderTables(props: Props) {
  const { tableData, projectId, overlayContent } = props;
  const { user } = useUser();
  const dispatch = useDispatch();

  const laborSummary = useSelector(
    (state) => state.projects[projectId]['labor-summary']
  );
  const changeOrdersSummary = useSelector(
    (state) => state.projects[projectId]['change-orders-summary']
  );
  const clickedChangeOrderId = useSelector(
    (state) => state.overlay['change-orders'].currentId
  );
  const allInvoices = useSelector((state) => state.data.invoices.allInvoices);

  // why am i setting this state?
  const [_selectedChangeOrder, setSelectedChangeOrder] =
    useState<ChangeOrderSummaryItem | null>(null);
  const changeOrderConfirmModalHandler = (
    selected: Omit<
      ChangeOrderSummaryItem,
      'clientName' | 'content' | 'address' | 'invoices'
    >[]
  ) => {
    const removeChangeOrderIds = Array.from(
      new Set(selected.map((changeOrder) => changeOrder.uuid as string))
    );

    const nonEmptyChangeOrders: string[] = [];
    removeChangeOrderIds.forEach((changeOrderId) => {
      if (
        !isObjectEmpty(
          (changeOrdersSummary as ChangeOrderSummary)[changeOrderId].content
        )
      ) {
        nonEmptyChangeOrders.push(
          (changeOrdersSummary as ChangeOrderSummary)[changeOrderId].name
        );
      }
    });

    // do not let the user delete a change order if it has content. This will check
    // if any of the change orders have content and disallow any to be deleted, even if
    // some can be removed. They will have to only check change orders that are empty for deletion.
    if (nonEmptyChangeOrders.length > 0) {
      dispatch(
        uiActions.setModalContent({
          openModal: true,
          message: `Change order(s) <${nonEmptyChangeOrders}> have data attached and cannot be deleted. Please edit the item that contains those change orders to continue with deletion.`,
          title: 'Error',
        })
      );
    }

    throw new Error('stop');
    const { invoicesToUpdate, updateProcessedData, laborToUpdate } =
      createRemoveCoFromData({
        allInvoices,
        changeOrdersSummary: changeOrdersSummary as ChangeOrderSummary,
        laborSummary: laborSummary as LaborSummary,
        removeChangeOrderIds,
      });

    // front end updates
    dispatch(
      companyDataActions.removeChangeOrderIdsFromInvoices({ invoicesToUpdate })
    );
    dispatch(
      projectDataActions.removeChangeOrderIdsFromAllLaborData({
        laborToUpdate,
        projectId,
      })
    );
    dispatch(
      projectDataActions.removeSelectedRow({
        projectId: projectId,
        ids: removeChangeOrderIds,
        stateKeyFull: 'change-orders',
        stateKeySummary: 'change-orders-summary',
      })
    );

    // backend updates
    dispatch(
      deleteProjectData({
        companyId: (user as User).user_metadata.companyId as string,
        sendData: { removeChangeOrderIds, updateProcessedData, laborToUpdate },
        projectId: projectId,
        dataType: 'changeOrder',
      })
    );
  };

  const changeOrderRowClickHandler = (uuid: string, projectId: string) => {
    if (
      Object.keys(changeOrdersSummary).length > 0 &&
      overlayContent.currentId === uuid
    ) {
      dispatch(addChangeOrderFormActions.clearFormState());
      dispatch(
        overlayActions.setOverlayContent({
          data: {
            overlayTitle: 'Update Change Order',
            open: true,
            isSave: false,
            currentId: uuid,
          },
          stateKey: 'change-orders',
        })
      );
      setSelectedChangeOrder((changeOrdersSummary as ChangeOrderSummary)[uuid]);
    } else {
      setSelectedChangeOrder((changeOrdersSummary as ChangeOrderSummary)[uuid]);
      dispatch(
        getCurrentProjectData({
          id: uuid,
          projectId: projectId,
          stateKey: 'change-orders',
        })
      );
    }
  };

  // this piece needs to create the rows that will resemble the
  // invoice. Create a custom hook, or function to create the data this way
  // data will come from tableData.content (right table)
  // const invoiceRows = useCreateInvoiceRows({
  //   pageLoading,
  //   invoices,
  //   projectId,
  //   isChangeOrderInvoiceTable: true,
  //   selectedChangeOrder,
  // });

  type NormalChangeOrderTableRow = Omit<
    ChangeOrderSummaryItem,
    'clientName' | 'content' | 'address' | 'invoices'
  >;

  // Normalize change order data for table (left table)
  const changeOrderRows: NormalChangeOrderTableRow[] | null = useMemo(() => {
    if (tableData) {
      return Object.values(tableData).map((row) => {
        return {
          name: row.name,
          workDescription: row.workDescription,
          projectName: row.projectName,
          subtotalAmt: formatNumber(row.subtotalAmt as string),
          date: row.date,
          uuid: row.uuid,
          numItems: Object.keys(row.content).length.toString(),
        };
      });
    } else {
      return null;
    }
  }, [tableData]);

  return (
    <>
      <ModalErrorWrapper />
      <div className="flex gap-5 grow -mt-4 -mx-7 overflow-visible">
        <div className="relative w-[35%] mt-4 ml-7">
          <Card className="h-full max-h-full bg-stak-white overflow-auto">
            <CheckboxSubTable
              headings={changeOrderTableHeadings}
              rows={changeOrderRows}
              checkboxButtons={changeOrderTableCheckboxButtons}
              projectId={projectId}
              selectedRowId={overlayContent.currentId}
              preSortKey="name"
              onConfirmModal={changeOrderConfirmModalHandler}
              onRowClick={changeOrderRowClickHandler}
            />
          </Card>
        </div>
        <div className="relative flex-1 w-[65%] mt-4 mr-7">
          <Card className="h-full max-h-full bg-stak-white overflow-auto">
            <WorkDescriptionTable
              headings={changeOrderContentHeadings}
              tableData={tableData}
              selectedRowId={clickedChangeOrderId}
              isChangeOrderTable={true}
              changeOrderRows={changeOrderRows}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
