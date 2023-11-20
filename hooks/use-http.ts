import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { useAppDispatch as useDispatch } from '@/store/hooks';

import { Actions } from '@/lib/models/types';
import { RequestConfig } from '@/lib/models/requestConfigModel';

export interface ResponseData {
  message: string;
  [key: string]: any;
}

const useHttp = ({ isClearData }: { isClearData: boolean }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Record<string, string> | null>(null);
  const [response, setResponse] = useState<Response | null>(null);
  const [successJSON, setSuccessJSON] = useState<ResponseData | string | null>(
    null
  );

  const router = useRouter();
  const dispatch = useDispatch();
  const latestRequestRef = useRef<number>(0);
  const abortController = useRef<AbortController | null>(null);

  interface AsyncSendRequest {
    requestConfig: RequestConfig;
    pushPath?: string;
    actions?: Actions;
    applyData?: (data: any) => any | void;
  }

  const sendRequest = async ({
    requestConfig,
    actions,
    pushPath,
    applyData,
  }: AsyncSendRequest): Promise<void> => {
    latestRequestRef.current++;
    const currentRequest = latestRequestRef.current;

    // Initialize AbortController for this request
    abortController.current = new AbortController();

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(requestConfig.url, {
        method: requestConfig.method ? requestConfig.method : 'GET',
        headers: requestConfig.headers ? requestConfig.headers : {},
        body: requestConfig.body ? JSON.stringify(requestConfig.body) : null,
        signal: abortController.current.signal,
      });

      if (currentRequest !== latestRequestRef.current) return;

      if (!res.ok) {
        const errorData: Record<string, string> = await res.json();
        setResponse(res);
        setError(JSON.parse(errorData.error));
      }
      if (res.status === 201 || res.ok) {
        const data: ResponseData = await res.json();
        setResponse(res);
        setSuccessJSON(data);

        if (isClearData && actions) {
          dispatch(actions.clearFormState());
        }
        if (pushPath) {
          router.push(pushPath);
        }
        // use this for any data transformation that may be needed
        if (applyData) {
          applyData(data);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Fetch aborted');
      } else {
        setError(error || 'Something went wrong.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Abort fetch if component using the hook gets unmounted
      if (abortController.current) abortController.current.abort();
    };
  }, []);

  return {
    isLoading,
    error,
    response,
    successJSON,
    sendRequest,
  };
};

export default useHttp;
