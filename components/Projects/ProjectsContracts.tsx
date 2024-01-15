import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { overlayActions } from '@/store/overlay-control-slice';
import { projectDataActions } from '@/store/projects-data-slice';
import { contractActions, deleteContracts } from '@/store/contract-slice';
import { singleContractFormActions } from '@/store/single-contract-slice';
import { editContractFormActions } from '@/store/edit-contract';
import SectionHeading from '@/components/UI/SectionHeadings/SectionHeading';
import { usePageData } from '@/hooks/use-page-data';

import useHttp from '@/hooks/use-http';
import useSetNotification from '@/hooks/use-set-notification';
import { checkAllFormFields } from '@/lib/validation/formValidation';
import { User, FormStateV2 } from '@/lib/models/formStateModels';
import {
  ContractData,
  ContractTableRow,
  ProjectSummary,
} from '@/lib/models/summaryDataModel';
import { formatNumber } from '@/lib/utility/formatter';
import { convertContractEntry2FormData } from '@/lib/utility/contractHelper';
import { nanoid } from '@/lib/config';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import FullScreenLoader from '../UI/Loaders/FullScreenLoader';
import CheckboxSubTable from '../Tables/SubTables/CheckboxSortHeadingsTableSub';
import ContractSlideOverlay from '../UI/SlideOverlay/ContractSlideOverlay';
import SlideOverlayForm from '@/components/UI/SlideOverlay/SlideOverlayForm';
const { sendRequest } = useHttp({ isClearData: true });
import { defaultContractEntry,
  defaultContractSummaryData } from '@/lib/models/initDataModels'

const tabs = [{ name: 'Project Contract', keyName: 'all', current: true }];
interface Props {
  projectId: string;
  tableData: ContractData | null;
}

const tableHeadings = {
  name: 'Vendor Name',
  contractDate: 'Contract Date',
  contractAmt: 'Total Amount ($)',
  vendorId: 'Status',
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

  const { user, isLoading: userLoading } = useUser();
  
  const dispatch = useDispatch();
  const { data: singleContractFormData } = usePageData(
    'data',
    'forms',
    'add-contract'
  );
  const projectName = useSelector(
    (state) =>
      (state.data.projectsSummary.allProjects as ProjectSummary)[projectId]
        ?.projectName
  );
  const selectedContractId = useSelector(
    (state) => state.contract.clickedContract?.uuid
  );
  const vendorSummary = useSelector(
    (state) => state.data.vendorsSummary.allVendors
  );
  const singleContractFormStateData = useSelector(
    (state) => state.singleContractForm
  );
  const overlayContent = useSelector((state) => state.overlay['single-contract']);
  const [_activeTabKeyName, setActiveTabKeyName] = useState<string>('all');
  const [missingInputs, setMissingInputs] = useState<boolean>(false);
  useEffect(() => {
    // initialize the is row clicked to false on first render
    dispatch(
      contractActions.setClicked({
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
          name: row['summaryData']['vendor']['name'],
          vendorId: row['summaryData']['vendor']['uuid'],
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

  const handleSingleContract = () => {
    dispatch(singleContractFormActions.clearFormState());
    dispatch(singleContractFormActions.resetFormValidation());
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Single Contract',
          open: true,
          isSave: true,
        },
        stateKey: 'single-contract',
      })
    );
    dispatch(
      overlayActions.setCurrentOverlayData({
        data: {
          currentData: null,
          currentId: null,
        },
        stateKey: 'single-contract',
      })
    );
  };

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
        contractActions.setClicked({
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

  const handleSingleContractSubmit = async (e: React.FormEvent,
    formStateData: FormStateV2) => {
      e.preventDefault();
      const allValid = checkAllFormFields(
        singleContractFormData,
        formStateData
      );
      if (!allValid) {
        setMissingInputs(true);
        // return
      }
      setMissingInputs(false);
      dispatch(
        overlayActions.setOverlayContent({
          data: { open: false },
          stateKey: 'single-contract',
        })
      );
  
      const contractUUID = nanoid();
  
      const dataToSubmit = createFormDataForSubmit({
        formData: singleContractFormData,
        formStateData: formStateData,
        isAddProject: false,
        isAddVendor: false,
        isAddLabor: false,
      }) as any;
  
      // dataToSubmit.uuid = contractUUID;
  
      const sendingContractData = {
        ...defaultContractEntry,
        uuid: contractUUID,
        summaryData: {
          ...defaultContractSummaryData,
          ...dataToSubmit,
          vendor_match_conf_score: 0
        }
      };
      // Add Redux Store 
      /* dispatch(
        singleContractFormActions.addSingleInvoiceData({
          contractData: sendingInvoiceData,
          uuid: invoiceUUID,
        })
      ); */
  
      if (!userLoading && user) {
        const requestConfig = {
          url: `/api/${
            (user as User).user_metadata.companyId
          }/projects/add-single-contract&project_id=${projectId}`,
          method: 'POST',
          body: JSON.stringify({
            ...sendingContractData,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        };
        await sendRequest({
          requestConfig,
          actions: singleContractFormActions,
        });
      }
    }

  return (
    <>
      {isLoading && <FullScreenLoader />}
      {!isLoading && (
        <>
          {
            <SlideOverlayForm
              formData={singleContractFormData}
              formState={singleContractFormStateData}
              actions={singleContractFormActions}
              showError={missingInputs}
              overlayContent={overlayContent}
              form="singleContract"
              overlayStateKey="single-contract"
              onSubmit={(e) => handleSingleContractSubmit(e, singleContractFormStateData)}
            />
          }
          <SectionHeading
            tabs={tabs}
            buttons={[
              {
                label: 'Single Contract',
                disabled: false,
                onClick: handleSingleContract,
              },
            ]}
            onActiveTab={setActiveTabKeyName}
          />
          <ContractSlideOverlay
            projectId={projectId}
            tableData={tableData}
            rows={contractRows}
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
            vendorSummary={vendorSummary}
            onConfirmModal={confirmModalHandler}
            onRowClick={rowClickHandler}
          />
        </>
      )}
    </>
  );
}
