import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';

import { companyDataActions } from '@/store/company-data-slice';
import { uiActions } from '@/store/ui-slice';
import { projectDataActions } from '@/store/projects-data-slice';
import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';

import { User } from '@/lib/models/formStateModels';
import { ContractData } from '@/lib/models/summaryDataModel';
import { sseActions } from '@/store/sse-slice';
import { Invoices } from '@/lib/models/invoiceDataModels';
import { getAPIUrl } from '@/lib/config';

const useListenSSE = () => {
  const [newDocs, setNewDocs] = useState<Invoices | ContractData | null>(null);
  const [_token, setToken] = useState<string | null>(null);

  const { user } = useUser();
  const dispatch = useDispatch();

  const isSuccess = useSelector((state) => state.sse.isSuccess);
  const sseContent = useSelector((state) => state.sse.sseContent);
  const processNotificationContent = useSelector(
    (state) => state.ui.processingNotification?.content
  );

  const getToken = async () => {
    try {
      const responseToken = await fetch('/api/fetchAuthToken');
      if (!responseToken.ok) {
        if (responseToken.status === 401) {
          throw new Error('Not Authenticated.');
        }
        throw new Error('Error fetching token.');
      }
      const tokenData = await responseToken.json();
      setToken(tokenData.token);
      return tokenData.token;
    } catch (error) {
      console.error('Error in fetching token: ', error);
      return null;
    }
  };

  const initiateSSE = (freshToken: string) => {
    let sseUrl = '';
    if (sseContent.sseContentType === 'invoice') {
      sseUrl = `${getAPIUrl()}/${
        (user as User).user_metadata.companyId
      }/listen-invoice-updates/?token=${freshToken}`;
    } else if (sseContent.sseContentType === 'contract') {
      sseUrl = `${getAPIUrl()}/${
        (user as User).user_metadata.companyId
      }/listen-contract-updates/?token=${freshToken}&project_id=${
        sseContent.projectId
      }`;
    } else if (sseContent.sseContentType === 'delete-invoices') {
      sseUrl = `${getAPIUrl()}/${
        (user as User).user_metadata.companyId
      }/listen-delete-invoices/?token=${freshToken}`;
    } else if (sseContent.sseContentType === 'delete-client-bill') {
      sseUrl = `${getAPIUrl()}/${
        (user as User).user_metadata.companyId
      }/listen-delete-client-bill/?token=${freshToken}`;
    } else if (sseContent.sseContentType === 'delete-contracts') {
      sseUrl = `${getAPIUrl()}/${
        (user as User).user_metadata.companyId
      }/listen-delete-contract/?token=${freshToken}`;
    } else return;

    const eventSource = new EventSource(sseUrl as string);

    eventSource.addEventListener('new_document', (event) => {
      const data: ContractData | Invoices = JSON.parse(event.data);
      dispatch(
        uiActions.setProcessingNotificationContent({
          openNotification: true,
          content: 'Processing Documents',
        })
      );
      setNewDocs(data);
    });

    eventSource.addEventListener('scanning_docs', () => {
      dispatch(
        uiActions.setProcessingNotificationContent({
          openNotification: true,
          content: 'Scanning Documents',
        })
      );
    });

    eventSource.addEventListener('deleting_invoices', () => {
      dispatch(
        uiActions.setProcessingNotificationContent({
          openNotification: true,
          content: 'Deleting Invoices',
        })
      );
    });

    eventSource.addEventListener('deleting_client_bill', () => {
      dispatch(
        uiActions.setProcessingNotificationContent({
          openNotification: true,
          content: 'Deleting Client Bills',
        })
      );
    });
    eventSource.addEventListener('deleting_contract', () => {
      dispatch(
        uiActions.setProcessingNotificationContent({
          openNotification: true,
          content: 'Deleting Contracts',
        })
      );
    });

    eventSource.addEventListener('done_processing', (event) => {
      try {
        const data: ContractData | Invoices = JSON.parse(event.data);
        setNewDocs(data);
      } catch (error) {
        // HACK This code block is in place to catch any remaining invoices
        // that have not been sent. All other processes that reach here
        // will not have data attached to their event.
      } finally {
        dispatch(
          uiActions.setProcessingNotificationContent({
            openNotification: true,
            content: 'Complete',
          })
        );
        dispatch(
          sseActions.setWhatToListenFor({
            sseContentType: '',
          })
        );
        dispatch(uiActions.setLoadingState({ isLoading: false }));
        eventSource.close();
      }
    });

    eventSource.onerror = (error) => {
      dispatch(
        uiActions.setProcessingNotificationContent({
          openNotification: true,
          content: 'Error',
        })
      );
      dispatch(
        sseActions.setWhatToListenFor({
          sseContentType: '',
        })
      );
      dispatch(uiActions.setLoadingState({ isLoading: false }));
      console.error('EventSource failed', error);
      eventSource.close();
    };
    return () => {
      eventSource.close();
    };
  };

  // The effect will run whenever processComplete changes
  // If the content doesn't change this will not trigger and could lead to a BUG
  // HACK -> maybe add a [] dependency side effect in a parent componenet that does this process
  // which will run at least at some point removing the notification
  useEffect(() => {
    if (
      processNotificationContent === 'Complete' ||
      processNotificationContent === 'Error'
    ) {
      setTimeout(() => {
        dispatch(
          uiActions.setProcessingNotificationContent({
            openNotification: false,
            content: '',
          })
        );
      }, 3500);
    }
  }, [processNotificationContent]);

  useEffect(() => {
    if (newDocs) {
      if (sseContent.sseContentType === 'invoice') {
        dispatch(companyDataActions.addInvoicesFromWS(newDocs as Invoices));
      } else if (sseContent.sseContentType === 'contract') {
        dispatch(
          projectDataActions.addContractFromSSE({
            newContracts: newDocs as ContractData,
            projectId: sseContent.projectId as string,
          })
        );
      }
    }
  }, [newDocs]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      const freshToken: string = await getToken();
      if (isSuccess && freshToken) {
        cleanup = initiateSSE(freshToken);
      }
    })();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [isSuccess, sseContent.sseContentType]);
};

export default useListenSSE;
