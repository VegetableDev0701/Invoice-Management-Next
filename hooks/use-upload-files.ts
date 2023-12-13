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

  const uploadFilesTask = 'upload_files';

  const [files, setFiles] = useState<File[]>([]);
  const [_numberOfFiles, setNumberOfFiles] = useState(0);
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
    if (files.length === 0) return;

    async function sendRequest(formData: FormData) {
      dispatch(
        uiActions.setTaskLoadingState({
          isLoading: true,
          taskId: uploadFilesTask,
        })
      );
      dispatch(sseActions.setUploadFileSuccess(false));
      setDuplicateFiles([]);
      try {
        // Get the Auth0 Token to authenticate the endpoint
        const authTokenResponse = await fetch('/api/fetchAuthToken');
        if (!authTokenResponse.ok) {
          if (authTokenResponse.status === 401) {
            throw new Error('Not Authenticated.');
          }
          throw new Error('Error fetching token.');
        }
        const authTokenData = await authTokenResponse.json();

        // Get the google cloud run token to authenticate the api
        const googleTokenResponse = await fetch('/api/fetchGoogleAuthToken');
        if (!googleTokenResponse.ok) {
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
          }/upload-contracts?project_id=${projectId ? projectId : 'None'}`;
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
          throw new Error('Duplicate file(s) found!');
        }

        if (response.status === 401 || response.status === 403) {
          dispatch(
            uiActions.notify({
              content: `${response.status} - Unauthorized access.`,
              icon: 'error',
            })
          );
          throw new Error(
            'Unauthorized access. You do not have permission to view these resources.'
          );
        }

        if (!response.ok) {
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
          dispatch(
            uiActions.notify({
              icon: 'success',
              content: 'Uploaded all unique files.',
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
      } catch (error: any) {
        dispatch(
          uiActions.notify({
            content: error.message,
            icon: 'error',
          })
        );
        console.error(error);
      } finally {
        dispatch(
          uiActions.setTaskLoadingState({
            isLoading: false,
            taskId: uploadFilesTask,
          })
        );
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
