import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import {
  getCurrentProjectData,
  overlayActions,
} from '@/store/overlay-control-slice';
import { projectDataActions } from '@/store/projects-data-slice';
import { addContractFormActions } from '@/store/add-contract';
import { contractActions, deleteContracts } from '@/store/contract-slice';

import { usePageData } from '@/hooks/use-page-data';
import useHttp from '@/hooks/use-http';
import useSetNotification from '@/hooks/use-set-nofitication';

import { User } from '@/lib/models/formStateModels';
import { ContractData, ContractTableRow } from '@/lib/models/summaryDataModel';
import { formatNumber } from '@/lib/utility/formatter';

import FullScreenLoader from '../UI/Loaders/FullScreenLoader';
import CheckboxSubTable from '../Tables/SubTables/CheckboxSortHeadingsTableSub';
import ContractSlideOverlayImage from '../UI/SlideOverlay/ContractSlideOverlayImage';

interface Props {
  projectId: string;
  tableData: ContractData | null;
}

const tableHeadings = {
  name: 'Vendor Name',
  workDescription: 'Work Description',
  contractDate: 'Contract Date',
  contractAmt: 'Total Amount ($)',
};

const checkBoxButtons = [{ label: 'Delete', buttonPath: '#', disabled: false }];

export default function ProjectsContracts(props: Props) {
  const { projectId, tableData } = props;

  const { data: addContractFormData, isLoading: isLoading } = usePageData(
    'data',
    'forms',
    'add-contract'
  );

  // TODO add functionality to edit a contract (use the process-invoice form)
  // const currentFormData = useAddCurrentDataToFormData({
  //   projectId,
  //   formData: addContractFormData,
  // });

  const { response, successJSON, sendRequest } = useHttp({ isClearData: true });
  const [missingInputs, setMissingInputs] = useState<boolean>(false);

  const { user, isLoading: userLoading } = useUser();

  const dispatch = useDispatch();

  const addContractFormStateData = useSelector(
    (state) => state.addContractForm
  );
  const overlayContent = useSelector((state) => state.overlay.contracts);
  const projectName = useSelector(
    (state) => state.data.projectsSummary.allProjects[projectId].projectName
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
    if (tableData && tableData[uuid]?.gcs_img_uri) {
      dispatch(
        contractActions.setClickedContract({
          contract: tableData[uuid],
          isRowClicked: true,
        })
      );
    } else {
      dispatch(addContractFormActions.clearFormState());
      dispatch(
        overlayActions.setOverlayContent({
          data: {
            overlayTitle: 'Update Contract',
            open: true,
            isSave: false,
          },
          stateKey: 'contracts',
        })
      );
      dispatch(
        getCurrentProjectData({
          id: uuid,
          projectId: projectId,
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

  // TODO add the contract form into the slide overlay for the contract
  // this may not be necessary, as long as the user has a log of it, but
  // what happens if the data is wrong in the table--does this matter?
  // const submitFormHandler = async (
  //   e: React.FormEvent,
  //   formStateData?: FormState
  // ) => {
  //   e.preventDefault();

  //   const allValid = checkAllFormFields(
  //     addContractFormData,
  //     addContractFormStateData
  //   );

  //   if (!allValid) {
  //     setMissingInputs(true);
  //     return;
  //   }
  //   setMissingInputs(false);
  //   dispatch(
  //     overlayActions.setOverlayContent({
  //       data: { open: false },
  //       stateKey: 'contracts',
  //     })
  //   );

  //   const contractUUID = overlayContent?.currentId
  //     ? overlayContent.currentId
  //     : nanoid();

  //   // create the form data to push to the DB
  //   const dataToSubmit = createFormDataForSubmit({
  //     formData: addContractFormData,
  //     formStateData: formStateData as FormState,
  //     isAddProject: false,
  //     isAddVendor: false,
  //     isAddLabor: false,
  //   }) as LaborData;

  //   dataToSubmit.uuid = contractUUID;

  //   const contractSummary = createSingleContractSummary(
  //     dataToSubmit as LaborData,
  //   );

  //   dispatch(
  //     projectDataActions.addFullData({
  //       newData: dataToSubmit,
  //       projectId: projectId,
  //       stateKey: 'contracts',
  //     })
  //   );
  //   dispatch(
  //     projectDataActions.addSummaryTableRow({
  //       newData: contractSummary,
  //       projectId: projectId,
  //       stateKey: 'contracts-summary',
  //     })
  //   );

  //   if (!userLoading && user) {
  //     let headers = {};
  //     if (overlayContent.isSave) {
  //       headers = { 'Content-Type': 'application/json' };
  //     } else {
  //       headers = {
  //         contractId: overlayContent.currentId,
  //         'Content-Type': 'application/json',
  //       };
  //     }

  //     const requestConfig = {
  //       url: `/api/${
  //         (user as User).user_metadata.companyId
  //       }/projects/${projectId}/add-contract`,
  //       method: `${overlayContent.isSave ? 'POST' : 'PATCH'}`,
  //       body: JSON.stringify({
  //         fullData: dataToSubmit,
  //         summaryData: contractSummary,
  //       }),
  //       headers: headers,
  //     };

  //     await sendRequest({
  //       requestConfig,
  //       actions: addContractFormActions,
  //       pushPath: `/${
  //         (user as User).user_metadata.companyId
  //       }/projects/${projectId}`,
  //     });
  //   }
  // };

  return (
    <>
      {isLoading && <FullScreenLoader />}
      {!isLoading && (
        <ContractSlideOverlayImage
          rows={tableData && Object.values(tableData).map((row) => row)}
          projectId={projectId}
        />
      )}
      <CheckboxSubTable
        headings={tableHeadings}
        rows={contractRows}
        checkboxButtons={checkBoxButtons}
        projectId={projectId}
        showExpiration={false}
        selectedRowId={selectedContractId}
        preSortKey={'name'}
        onConfirmModal={confirmModalHandler}
        onRowClick={rowClickHandler}
      />
    </>
  );
}
