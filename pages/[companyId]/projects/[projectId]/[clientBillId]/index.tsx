import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { User } from '@/lib/models/formStateModels';
import { fetchWithRetry } from '@/lib/utility/ioUtils';

import Card from '@/components/UI/Card';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import ClientBillInvoices from '@/components/Projects/ClientBills/ClientBillInvoices';
import ClientBillLabor from '@/components/Projects/ClientBills/ClientBillLabor';
import { ClientBillData, SubTotals } from '@/lib/models/clientBillModel';
import ClientBillWorkDescription from '@/components/Projects/ClientBills/ClientBillWorkDescription';
import ProjectsSectionHeading from '@/components/UI/SectionHeadings/ProjectPageSectionHeading';
import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { ClientBillSummary } from '@/lib/models/summaryDataModel';
import useHttp from '@/hooks/use-http';
import useSetNotification from '@/hooks/use-set-nofitication';
import { uiActions } from '@/store/ui-slice';
import ModalError from '@/components/UI/Modal/ModalError';
import ModalErrorWrapper from '@/components/UI/Modal/ErrorModalWrapper';

interface Tab {
  name: string;
  keyName: string;
  current: boolean;
}

const tabs: Tab[] = [
  { name: 'Summary', keyName: 'summary', current: true },
  { name: 'Client Bill', keyName: 'clientBill', current: false },
  { name: 'Invoices', keyName: 'invoices', current: false },
  { name: 'Labor/Fees', keyName: 'labor', current: false },
];

export default function ClientBill() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const clientBillId = router.query.clientBillId as string;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clientBillData, setClientBillData] = useState<ClientBillData | null>(
    null
  );
  const [error, setIsError] = useState(false);
  const [activeTabKeyName, setActiveTabKeyName] = useState<string>('summary');

  const dispatch = useDispatch();

  const { user, isLoading: userLoading } = useUser();

  const billSummary = useSelector(
    (state) =>
      (
        state.projects[projectId]?.['client-bills-summary'] as ClientBillSummary
      )?.[clientBillId]
  );
  const projectSummary = useSelector(
    (state) => state.data.projectsSummary?.allProjects[projectId]
  );

  const {
    response,
    successJSON,
    error: apiError,
    sendRequest,
  } = useHttp({
    isClearData: false,
  });

  useSetNotification({
    response,
    successJSON,
    error: apiError,
    isOverlay: false,
  });

  const syncInvoiceToQBD = async () => {
    dispatch(uiActions.setLoadingState({ isLoading: true }));
    const requestConfig = {
      url: `/api/${
        (user as User).user_metadata.companyId
      }/projects/${projectId}/${clientBillId}/build-invoice`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName: projectSummary.ownerName,
        customerEmail: projectSummary.ownerEmail,
      }),
    };

    await sendRequest({
      requestConfig,
    });
    dispatch(uiActions.setLoadingState({ isLoading: false }));
  };

  useEffect(() => {
    if (userLoading || !projectId || !clientBillId) return; // Return early if any of these conditions are met.

    const getClientBillData = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        let data = await fetchWithRetry(
          `/api/${
            (user as User).user_metadata.companyId
          }/projects/${projectId}/get-single-client-bill`,
          {
            method: 'GET',
            headers: {
              clientBillId,
              isOnlyCurrentActuals: 'False',
            },
          }
        );
        data = JSON.parse(data);
        console.log('dionY [getClientBillData] data: ', data);
        setClientBillData(data[clientBillId]);
      } catch (error) {
        console.error(error);
        setIsError(true);
      } finally {
        setIsLoading(false); // Ensure that loading is set to false in the end.
      }
    };

    getClientBillData();
  }, [projectId, clientBillId, userLoading]);

  console.log('dionY [ClientBill] isLoading: ', isLoading);
  console.log('dionY [ClientBill] error: ', error);
  console.log('dionY [ClientBill] billSummary: ', billSummary);
  console.log('dionY [ClientBill] clientBillData: ', clientBillData);

  return (
    <>
      <ModalErrorWrapper />
      {isLoading && !billSummary && <FullScreenLoader />}
      {!isLoading && !error && billSummary && (
        <div className="main-form-tiles">
          <ProjectsSectionHeading
            pageTitle={billSummary.billTitle}
            projectId={projectId}
            tabs={tabs}
            buttons={[
              {
                label: 'Build Invoice in QuickBooks',
                disabled: false,
                isShowingKeyName: 'clientBill',
                onClick: syncInvoiceToQBD,
              },
            ]}
            onActiveTab={(activeTabKeyName) =>
              setActiveTabKeyName(activeTabKeyName)
            }
            isClientBillPage={true}
          />
          <div className="content-tiles shadow-none">
            {isLoading && !clientBillData && <FullScreenLoader />}
            {!isLoading && clientBillData && (
              <Card className="h-full max-h-full w-full shadow bg-stak-white">
                <div
                  className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch overflow-y-scroll"
                  id="scroll-frame"
                >
                  {activeTabKeyName === 'invoices' && (
                    <ClientBillInvoices
                      projectId={projectId}
                      invoices={clientBillData.invoices}
                      isLoading={isLoading}
                    />
                  )}
                  {activeTabKeyName === 'labor' && (
                    <ClientBillLabor
                      projectId={projectId}
                      tableData={clientBillData['labor-summary']}
                    />
                  )}
                  {activeTabKeyName === 'clientBill' && (
                    <ClientBillWorkDescription
                      projectId={projectId}
                      clientBillId={clientBillId}
                      tableData={clientBillData['bill-work-description']}
                      currentActuals={clientBillData['current-actuals']}
                    />
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}
