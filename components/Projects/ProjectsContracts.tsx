import { useEffect, useMemo } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { overlayActions } from '@/store/overlay-control-slice';
import { projectDataActions } from '@/store/projects-data-slice';
import { contractActions, deleteContracts } from '@/store/contract-slice';

import { usePageData } from '@/hooks/use-page-data';
import useHttp from '@/hooks/use-http';
import useSetNotification from '@/hooks/use-set-notification';

import { User } from '@/lib/models/formStateModels';
import {
  ContractData,
  ContractTableRow,
  ProjectSummary,
} from '@/lib/models/summaryDataModel';
import { formatNumber } from '@/lib/utility/formatter';

import FullScreenLoader from '../UI/Loaders/FullScreenLoader';
import CheckboxSubTable from '../Tables/SubTables/CheckboxSortHeadingsTableSub';
import { editContractFormActions } from '@/store/edit-contract';
import { convertContractEntry2FormData } from '@/lib/utility/contractHelper';
import ContractSlideOverlay from '../UI/SlideOverlay/ContractSlideOverlay';

interface Props {
  projectId: string;
  tableData: ContractData | null;
}

const tableHeadings = {
  name: 'Vendor Name',
  contractDate: 'Contract Date',
  contractAmt: 'Total Amount ($)',
};

const checkBoxButtons = [{ label: 'Delete', buttonPath: '#', disabled: false }];

export default function ProjectsContracts(props: Props) {
  const { projectId, tableData } = props;

  const { data: editContractFormData, isLoading: isLoading } = usePageData(
    'data',
    'forms',
    'edit-contract'
  );

  const { response, successJSON } = useHttp({ isClearData: true });

  const { user } = useUser();

  const dispatch = useDispatch();

  const projectName = useSelector(
    (state) =>
      (state.data.projectsSummary.allProjects as ProjectSummary)[projectId]
        .projectName
  );
  const selectedContractId = useSelector(
    (state) => state.contract.clickedContract?.uuid
  );

  useEffect(() => {
    // initialize the is row clicked to false on first render
    dispatch(
      contractActions.setClickedContract({
        contract: null,
        isRowClicked: false,
      })
    );
  }, []);

  // Normalize labor data for table
  // TODO add vendor ID here when able to match to customers vendors
  const contractRows: ContractTableRow[] | null = useMemo(() => {
    if (tableData) {
      return Object.entries(tableData).map(([key, row]) => {
        return {
          name: row['summaryData']['vendor'],
          projectName: projectName as string,
          workDescription: row['summaryData']['workDescription'],
          contractAmt: formatNumber(
            row['summaryData']['contractAmt'] as string
          ),
          contractDate: row['summaryData']['date'],
          uuid: key,
        };
      });
    } else {
      return null;
    }
  }, [tableData]);

  const confirmModalHandler = (selected: ContractTableRow[]) => {
    const contractIds = selected.map((contract) => contract.uuid as string);
    dispatch(
      projectDataActions.removeSelectedRow({
        projectId: projectId,
        ids: contractIds,
        stateKeyFull: 'contracts',
        stateKeySummary: 'contracts-summary',
      })
    );
    dispatch(
      deleteContracts({
        companyId: (user as User).user_metadata.companyId as string,
        projectId: projectId,
        contractsToDelete: contractIds,
      })
    );
  };

  const rowClickHandler = (uuid: string) => {
    if (tableData) {
      dispatch(editContractFormActions.clearFormState());
      dispatch(
        contractActions.setClickedContract({
          isRowClicked: true,
          contract: tableData[uuid],
        })
      );
      dispatch(
        overlayActions.setOverlayContent({
          data: {
            overlayTitle: 'Update Contract',
            open: true,
            isSave: true,
            currentData: convertContractEntry2FormData({
              data: tableData[uuid],
              baseForm: editContractFormData,
            }),
            currentId: uuid,
          },
          stateKey: 'contracts',
        })
      );
    }
  };

  useSetNotification({
    response,
    successJSON,
    isOverlay: true,
    overlayStateKey: 'contracts',
  });

  return (
    <>
      {isLoading && <FullScreenLoader />}
      {!isLoading && (
        <>
          <ContractSlideOverlay projectId={projectId} tableData={tableData} />
          <CheckboxSubTable
            headings={tableHeadings}
            rows={contractRows}
            checkboxButtons={checkBoxButtons}
            projectId={projectId}
            showExpiration={false}
            selectedRowId={selectedContractId}
            preSortKey={'name'}
            tableType="contracts"
            onConfirmModal={confirmModalHandler}
            onRowClick={rowClickHandler}
          />
        </>
      )}
    </>
  );
}
