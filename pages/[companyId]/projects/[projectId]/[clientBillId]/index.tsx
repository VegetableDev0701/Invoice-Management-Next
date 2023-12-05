import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { uiActions } from '@/store/ui-slice';
import { updateInvoiceData } from '@/store/invoice-slice';
import { updateBudgetActuals } from '@/store/add-client-bill';

import useHttp from '@/hooks/use-http';
import useSetNotification from '@/hooks/use-set-nofitication';

import { FormStateV2, User } from '@/lib/models/formStateModels';
import { fetchWithRetry } from '@/lib/utility/ioUtils';
import { ClientBillData } from '@/lib/models/clientBillModel';
import {
  ClientBillSummary,
  LaborSummary,
  ProjectSummary,
} from '@/lib/models/summaryDataModel';
import { InvoiceItem, Invoices } from '@/lib/models/invoiceDataModels';
import { snapshotCopy } from '@/lib/utility/utils';
import { Labor } from '@/lib/models/formDataModel';

import Card from '@/components/UI/Card';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import ClientBillInvoices from '@/components/Projects/ClientBills/ClientBillInvoices';
import ClientBillLabor from '@/components/Projects/ClientBills/ClientBillLabor';
import ClientBillWorkDescription from '@/components/Projects/ClientBills/ClientBillWorkDescription';
import ProjectsSectionHeading from '@/components/UI/SectionHeadings/ProjectPageSectionHeading';
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
  const [snapShotFormState, setSnapShotFormState] =
    useState<FormStateV2 | null>(null);
  const [init, setInit] = useState(true);

  const dispatch = useDispatch();

  const { user, isLoading: userLoading } = useUser();

  const billSummary = useSelector(
    (state) =>
      (
        state.projects[projectId]?.['client-bills-summary'] as ClientBillSummary
      )?.[clientBillId]
  );
  const projectSummary = useSelector(
    (state) =>
      (state.data.projectsSummary?.allProjects as ProjectSummary)[projectId]
  );
  const invoiceObj = useSelector((state) => state.invoice);

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
    if (userLoading || !projectId || !clientBillId || !init) return; // Return early if any of these conditions are met.

    const getClientBillData = async () => {
      // setIsLoading(true);
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
        setClientBillData(data[clientBillId]);
        setInit(false);
      } catch (error) {
        console.error(error);
        setIsError(true);
      } finally {
        setIsLoading(false); // Ensure that loading is set to false in the end.
      }
    };

    getClientBillData();
  }, [projectId, clientBillId, userLoading, init]);

  useEffect(() => {
    // check if the needed data exists, ow return
    if (!clientBillData || !invoiceObj.currentInvoiceSnapShot) return;
    if (
      invoiceObj.currentInvoiceSnapShot.doc_id &&
      clientBillData.invoices[invoiceObj.currentInvoiceSnapShot.doc_id]
    ) {
      const oldCurrentActuals = snapshotCopy(
        clientBillData['current-actuals'].currentActuals
      );

      const snapShotInvoice = snapshotCopy(
        clientBillData.invoices[invoiceObj.currentInvoiceSnapShot.doc_id]
      ) as InvoiceItem;

      dispatch(
        updateInvoiceData({
          invoiceId: invoiceObj.currentInvoiceSnapShot.doc_id,
          companyId: (user as User).user_metadata.companyId,
          projectName: invoiceObj.currentInvoiceSnapShot['project-name']
            .value as string,
          snapShotInvoice,
          snapShotFormState: snapShotFormState as FormStateV2,
        })
      ).then((result) => {
        if (result.payload) {
          const updatedInvoices = {
            ...clientBillData.invoices,
          };

          updatedInvoices[invoiceObj.currentInvoiceSnapShot!.doc_id] =
            result.payload as InvoiceItem;

          dispatch(
            updateBudgetActuals({
              projectId,
              companyId: (user as User).user_metadata.companyId,
              clientBillId,
              updatedInvoices,
              oldCurrentActuals,
              updatedLabor: clientBillData.labor,
              updatedLaborSummary: Object.values(
                clientBillData['labor-summary'] || {}
              ),
            })
          ).then(() => {
            setInit(true);
          });
        }
      });
    }
  }, [invoiceObj.currentInvoiceSnapShot?.doc_id]);

  const handleUpdateClientBill = ({
    updatedInvoices,
    updatedLabor,
    updatedLaborSummary,
  }: {
    updatedInvoices?: Invoices;
    updatedLabor?: Labor;
    updatedLaborSummary?: LaborSummary;
  }) => {
    if (!clientBillData) return;
    const oldCurrentActuals = snapshotCopy(
      clientBillData['current-actuals'].currentActuals
    );
    dispatch(
      updateBudgetActuals({
        projectId,
        companyId: (user as User).user_metadata.companyId,
        clientBillId,
        oldCurrentActuals,
        updatedInvoices: updatedInvoices || clientBillData?.invoices || {},
        updatedLabor: updatedLabor || clientBillData.labor || {},
        updatedLaborSummary: updatedLaborSummary
          ? Object.values(updatedLaborSummary)
          : Object.values(clientBillData['labor-summary'] || {}),
      })
    ).then(() => {
      setInit(true);
    });
  };

  const getSnapShotFormState = (data: FormStateV2) => {
    setSnapShotFormState(data);
  };

  return (
    <>
      <ModalErrorWrapper />
      {isLoading && !billSummary && <FullScreenLoader />}
      {!isLoading && !error && billSummary && (
        <div className="main-form-tiles">
          <ProjectsSectionHeading
            pageTitle={billSummary.billTitle}
            projectId={projectId}
            clientBillId={clientBillId}
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
                      onGetSnapShotFormState={getSnapShotFormState}
                    />
                  )}
                  {activeTabKeyName === 'labor' && (
                    <ClientBillLabor
                      projectId={projectId}
                      tableData={clientBillData['labor-summary']}
                      labor={clientBillData.labor}
                      handleUpdateClientBill={handleUpdateClientBill}
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
