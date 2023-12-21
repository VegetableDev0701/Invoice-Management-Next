import { useUser } from '@auth0/nextjs-auth0/client';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

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
import { AppDispatch } from '@/store';
import { NodeEnv } from '@/lib/models/envModel';

export default function useListenWS() {
  const [newDocs, setNewDocs] = useState<Invoices | ContractData | null>(null);

  const { user } = useUser();
  const dispatch = useDispatch();

  const isSuccess = useSelector((state) => state.sse.isSuccess);
  const wsContent = useSelector((state) => state.sse.sseContent);
  const nodeEnv: NodeEnv = useSelector((state) => state.nodeEnv);
  const processNotificationContent = useSelector(
    (state) => state.ui.processingNotification?.content
  );

  let webSocket: WebSocket;
  let retryCount = 0;
  const maxRetires = 3;

  const getToken = async () => {
    while (retryCount < maxRetires) {
      try {
        const responseToken = await fetch('/api/fetchAuthToken');
        if (!responseToken.ok) {
          if (responseToken.status === 401) {
            throw new Error('Not Authenticated.');
          }
          throw new Error('Error fetching token.');
        }
        const tokenData = await responseToken.json();
        return tokenData.token;
      } catch (error) {
        console.error('Error in fetching token: ', error);
        retryCount++;
      }
    }
    return null;
  };

  const initiateWS = async () => {
    const freshToken = await getToken();
    if (!freshToken) return;

    const wsUrl = generateWSUrl({
      contentType: wsContent.sseContentType,
      freshToken,
      user: user as User,
      wsContent,
      nodeEnv,
    });
    if (!wsUrl) return;

    webSocket = new WebSocket(wsUrl);
    onWebSocketEvents(webSocket, dispatch, setNewDocs);

    return () => {
      if (webSocket.readyState === webSocket.OPEN) {
        webSocket.close();
      }
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
      if (wsContent.sseContentType === 'invoice') {
        dispatch(companyDataActions.addInvoicesFromWS(newDocs as Invoices));
      } else if (wsContent.sseContentType === 'contract') {
        dispatch(
          projectDataActions.addContractFromSSE({
            newContracts: newDocs as ContractData,
            projectId: wsContent.projectId as string,
          })
        );
      }
    }
  }, [newDocs]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const initiate = async () => {
      if (isSuccess) {
        cleanup = await initiateWS();
      }
    };
    initiate();
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [isSuccess, wsContent.sseContentType]);
}

const onWebSocketEvents = (
  ws: WebSocket,
  dispatch: AppDispatch,
  setNewDocs: Dispatch<SetStateAction<Invoices | ContractData | null>>
) => {
  ws.onopen = (event) => {
    console.log('WebSocket is open:', event);
  };

  ws.onmessage = (event) => {
    const serverMessage = JSON.parse(event.data);

    switch (serverMessage.event) {
      case 'scanning_docs':
        dispatch(
          uiActions.setProcessingNotificationContent({
            openNotification: true,
            content: 'Scanning Documents',
          })
        );
        break;

      case 'new_document':
        dispatch(
          uiActions.setProcessingNotificationContent({
            openNotification: true,
            content: 'Processing Documents',
          })
        );
        setNewDocs(serverMessage.data);
        break;

      case 'done_processing':
        try {
          setNewDocs(serverMessage.data);
        } catch (error) {
          // HACK This code block is in place to catch any remaining invoices
          // that have not been sent. All other processes that reach here
          // will not have data attached to their event
          console.error(error);
          dispatch(
            uiActions.setProcessingNotificationContent({
              openNotification: true,
              content: 'Error',
            })
          );
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
          ws.send(
            JSON.stringify({
              event: 'client_status',
              data: { state: ws.readyState },
            })
          );
        }
        break;

      case 'deleting_invoices':
        dispatch(
          uiActions.setProcessingNotificationContent({
            openNotification: true,
            content: 'Deleting Invoices',
          })
        );
        break;

      case 'deleting_client_bill':
        dispatch(
          uiActions.setProcessingNotificationContent({
            openNotification: true,
            content: 'Deleting Client Bills',
          })
        );
        break;

      case 'deleting_contract':
        dispatch(
          uiActions.setProcessingNotificationContent({
            openNotification: true,
            content: 'Deleting Contracts',
          })
        );
        break;

      case 'heartbeat':
        if (serverMessage.data === 'ping') {
          ws.send(
            JSON.stringify({
              event: 'client_status',
              data: 'pong',
            })
          );
        }
        break;

      case 'websocket_closed':
        dispatch(
          uiActions.setProcessingNotificationContent({
            openNotification: false,
          })
        );
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket failed', error);
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
    ws.close();
  };

  ws.onclose = (event) => {
    if (event.code === 1000) {
      console.log('WebSocket closed normally');
    } else {
      console.log('WebSocket closed with error, code:', event.code);
    }
  };
};

const generateWSUrl = ({
  contentType,
  freshToken,
  user,
  wsContent,
  nodeEnv,
}: {
  contentType: string;
  freshToken: string;
  user: User;
  wsContent: any;
  nodeEnv: NodeEnv;
}) => {
  let wsUrl = '';
  const apiUrl = getAPIUrl({ ...nodeEnv });
  if (apiUrl) {
    if (contentType === 'invoice') {
      wsUrl = `${apiUrl.replace('http', 'ws')}/${
        (user as User).user_metadata.companyId
      }/listen-invoice-updates?token=${freshToken}`;
    } else if (contentType === 'contract') {
      wsUrl = `${apiUrl.replace('http', 'ws')}/${
        (user as User).user_metadata.companyId
      }/listen-contract-updates?token=${freshToken}&project_id=${
        wsContent.projectId
      }`;
    } else if (contentType === 'delete-invoices') {
      wsUrl = `${apiUrl.replace('http', 'ws')}/${
        (user as User).user_metadata.companyId
      }/listen-delete-invoices?token=${freshToken}`;
    } else if (contentType === 'delete-client-bill') {
      wsUrl = `${apiUrl.replace('http', 'ws')}/${
        (user as User).user_metadata.companyId
      }/listen-delete-client-bill?token=${freshToken}`;
    } else if (contentType === 'delete-contracts') {
      wsUrl = `${apiUrl.replace('http', 'ws')}/${
        (user as User).user_metadata.companyId
      }/listen-delete-contract?token=${freshToken}`;
    } else return;
  } else {
    return;
  }
  return wsUrl;
};
