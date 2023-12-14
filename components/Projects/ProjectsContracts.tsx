import { useEffect, useMemo, useState } from 'react';
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
import useSetNotification from '@/hooks/use-set-nofitication';

import { FormStateV2, User } from '@/lib/models/formStateModels';
import {
  ContractData,
  ContractTableRow,
  ProjectSummary,
} from '@/lib/models/summaryDataModel';
import { formatNumber } from '@/lib/utility/formatter';

import FullScreenLoader from '../UI/Loaders/FullScreenLoader';
import CheckboxSubTable from '../Tables/SubTables/CheckboxSortHeadingsTableSub';
import ContractSlideOverlayImage from '../UI/SlideOverlay/ContractSlideOverlayImage';
import SlideOverlayForm from '../UI/SlideOverlay/SlideOverlayForm';
import { useAddCurrentDataToFormData } from '@/hooks/use-add-current-page-data';
import { editContractFormActions } from '@/store/edit-contract';

interface Props {
  projectId: string;
  tableData: ContractData | null;
}

const tableHeadings = {
  name: 'Vendor Name',
  // workDescription: 'Work Description',
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

  // TODO add functionality to edit a contract (use the process-invoice form)
  const currentFormData = useAddCurrentDataToFormData({
    projectId,
    formData: editContractFormData,
  });

  const editContractFormStateData = useSelector(
    (state) => state.editContractForm
  );
  const overlayContent = useSelector((state) => state.overlay.contracts);

  const { response, successJSON } = useHttp({ isClearData: true });
  const [missingInputs, setMissingInputs] = useState<boolean>(false);

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

  const rowClickHandler = (uuid: string, projectId: string) => {
    // if (tableData && tableData[uuid]?.gcs_img_uri) {
    //   dispatch(
    //     contractActions.setClickedContract({
    //       contract: tableData[uuid],
    //       isRowClicked: true,
    //     })
    //   );
    // } else {
    if (tableData) {
      dispatch(editContractFormActions.clearFormState());
      dispatch(
        overlayActions.setOverlayContent({
          data: {
            overlayTitle: 'Update Contract',
            open: true,
            isSave: true,
            currentData: {
              mainCategories: [
                {
                  name: 'Contract Details',
                  inputElements: [
                    {
                      items: [
                        {
                          label: 'Vendor Name',
                          id: 'vendor-name',
                          type: 'text',
                          required: true,
                          errormessage: 'Vendor name is required.',
                          value: tableData[uuid].summaryData.vendor,
                        },
                      ],
                    },
                    {
                      items: [
                        {
                          label: 'Contract Amount',
                          id: 'contract-amount',
                          type: 'text',
                          isCurrency: true,
                          required: true,
                          errormessage: 'Contract amount is required.',
                          value: tableData[uuid].summaryData.contractAmt,
                        },
                        {
                          label: 'Contract Date',
                          id: 'contract-date',
                          type: 'date',
                          'data-testid': 'date-input',
                          required: false,
                          value: tableData[uuid].summaryData.date,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            currentId: uuid,
          },
          stateKey: 'contracts',
        })
      );
    }
    // dispatch(
    //   getCurrentProjectData({
    //     id: uuid,
    //     projectId: projectId,
    //     stateKey: 'contracts',
    //   })
    // );
    // }
  };

  useSetNotification({
    response,
    successJSON,
    isOverlay: true,
    overlayStateKey: 'contracts',
  });

  const submitFormHandler = async (
    e: React.FormEvent,
    formStateData?: FormStateV2
  ) => {
    e.preventDefault();

    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Update Contract',
          open: false,
        },
        stateKey: 'contracts',
      })
    );
    console.log('dionY [submitFormHandler] formStateData: ', formStateData);
  };
  console.log('dionY [submitFormHandler] currentFormData: ', currentFormData);
  console.log(
    'dionY [submitFormHandler] editContractFormStateData: ',
    editContractFormStateData
  );
  console.log('dionY [submitFormHandler] overlayContent: ', overlayContent);

  return (
    <>
      {isLoading && <FullScreenLoader />}
      {!isLoading && (
        <>
          {/* <ContractSlideOverlayImage
            rows={tableData && Object.values(tableData).map((row) => row)}
            projectId={projectId}
          /> */}
          <SlideOverlayForm
            formData={currentFormData}
            formState={editContractFormStateData}
            actions={editContractFormActions}
            showError={missingInputs}
            overlayContent={overlayContent}
            form="editContract"
            overlayStateKey="contracts"
            projectId={projectId}
            onSubmit={(e) => submitFormHandler(e, editContractFormStateData)}
          />
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
