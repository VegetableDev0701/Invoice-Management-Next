import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';

import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import { sseActions } from '@/store/sse-slice';
import { uiActions } from '@/store/ui-slice';

import { User } from '@/lib/models/formStateModels';
import { getAPIUrl } from '@/lib/config';

export default function useUploadFilesHandler({
  uploadFileType,
  projectId,
}: {
  uploadFileType: string;
  projectId?: string;
}) {
  const { user } = useUser();

  const [files, setFiles] = useState<File[]>([]);
  const [numberOfFiles, setNumberOfFiles] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState<string[]>([]);

  const nodeEnv = useSelector((state) => state.nodeEnv);

  const dispatch = useDispatch();

  const closeModalHandler = () => {
    setOpenModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const fileListArray = Array.from(fileList);
      setFiles(Array.from(fileListArray));
      setNumberOfFiles(fileListArray.length);
    }
    e.target.value = '';
  };

  useEffect(() => {
    dispatch(
      uiActions.setNotificationContent({
        icon: 'success',
        content: 'Uploaded all unique files.',
      })
    );
  }, [duplicateFiles, numberOfFiles]);

  useEffect(() => {
    if (files.length === 0) return;

    async function sendRequest(formData: FormData) {
      dispatch(uiActions.setLoadingState({ isLoading: true }));
      dispatch(sseActions.setUploadFileSuccess(false));
      setDuplicateFiles([]);
      try {
        // Get the Auth0 Token to authenticate the endpoint
        const authTokenResponse = await fetch('/api/fetchAuthToken');
        if (!authTokenResponse.ok) {
          dispatch(uiActions.setLoadingState({ isLoading: false }));
          if (authTokenResponse.status === 401) {
            throw new Error('Not Authenticated.');
          }
          throw new Error('Error fetching token.');
        }
        const authTokenData = await authTokenResponse.json();

        // Get the google cloud run token to authenticate the api
        const googleTokenResponse = await fetch('/api/fetchGoogleAuthToken');
        if (!googleTokenResponse.ok) {
          dispatch(uiActions.setLoadingState({ isLoading: false }));
          if (googleTokenResponse.status === 401) {
            throw new Error('Not Authenticated.');
          }
          throw new Error('Error fetching token.');
        }
        const googleTokenData = await googleTokenResponse.json();

        let url = '';
        if (uploadFileType === 'invoice') {
          url = `${getAPIUrl({ ...nodeEnv })}/${
            (user as User).user_metadata.companyId
          }/upload-files`;
        } else if (uploadFileType === 'contract') {
          url = `${getAPIUrl({ ...nodeEnv })}/${
            (user as User).user_metadata.companyId
          }/upload-contracts/?project_id=${projectId ? projectId : 'None'}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${googleTokenData.token}`,
            Auth0: `Bearer ${authTokenData.token}`,
            projectId: projectId as string,
          },
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.status === 409) {
          const regex = /\[(.*?)\]/g;
          const dupFiles = JSON.parse(
            (regex.exec(data.detail) as string[])[0].replace(/'/g, '"')
          );
          setDuplicateFiles(dupFiles);
          setOpenModal(true);
          dispatch(uiActions.setLoadingState({ isLoading: false }));
          throw new Error('Duplicate file(s) found!');
        }

        if (response.status === 401 || response.status === 403) {
          dispatch(uiActions.setLoadingState({ isLoading: false }));
          dispatch(
            uiActions.setNotificationContent({
              content: `${response.status} - Unauthorized access.`,
              icon: 'error',
              openNotification: true,
            })
          );
          throw new Error(
            'Unauthorized access. You do not have permission to view these resources.'
          );
        }

        if (!response.ok) {
          dispatch(uiActions.setLoadingState({ isLoading: false }));
          dispatch(
            uiActions.setNotificationContent({
              content: `${response.status} - Error in file upload.`,
              icon: 'error',
              openNotification: true,
            })
          );
          throw new Error(
            `Status: ${response.status} -- Error in file upload.`
          );
        }

        if (response.status === 200 || response.ok) {
          dispatch(sseActions.setUploadFileSuccess(true));
          dispatch(
            sseActions.setWhatToListenFor({
              sseContentType: uploadFileType,
              projectId: projectId,
            })
          );
        }

        if (!data.message.endsWith('Duplicate files: None')) {
          const regex = /\[(.*?)\]/g;
          const dupFiles = JSON.parse(
            (regex.exec(data.message) as string[])[0].replace(/'/g, '"')
          );
          if (dupFiles) {
            setDuplicateFiles(dupFiles);
            setOpenModal(true);
          }
        }
        dispatch(uiActions.setNotificationContent({ openNotification: true }));
      } catch (error: any) {
        dispatch(uiActions.setLoadingState({ isLoading: false }));
        dispatch(
          uiActions.setNotificationContent({
            content: `${error}.`,
            icon: 'error',
            openNotification: true,
          })
        );
        console.error(error);
      }
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    sendRequest(formData);
    setFiles([]);
  }, [files.length]);

  return { openModal, duplicateFiles, handleFileChange, closeModalHandler };
}
