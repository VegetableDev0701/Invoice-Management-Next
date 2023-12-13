import { FadeLoader } from 'react-spinners';

import { useAppSelector as useSelector } from '@/store/hooks';
import useUploadFilesHandler from '@/hooks/use-upload-files';

import ModalDuplicateFilesError from '@/components/UI/Modal/ModalErrorDuplicateFiles';
import classes from './InputFile.module.css';

interface Props {
  projectId?: string;
  buttonLabel: string;
  uploadFileType: string;
  taskId?: string;
}

export default function SimpleUploadForm(props: Props) {
  const { projectId, buttonLabel, uploadFileType, taskId } = props;

  const { openModal, duplicateFiles, handleFileChange, closeModalHandler } =
    useUploadFilesHandler({
      uploadFileType: uploadFileType,
      projectId: projectId ? projectId : undefined,
    });

  const isLoading = useSelector((state) =>
    taskId ? state.ui.tasksInProgress[taskId] : state.ui.isLoading
  );

  return (
    <>
      <ModalDuplicateFilesError
        onCloseModal={closeModalHandler}
        openModal={openModal}
        data={duplicateFiles}
      />
      {!isLoading && (
        <form method="post" encType="multipart/form-data" className="flex">
          <label
            htmlFor="files"
            className="flex grow justify-center items-center hover:cursor-pointer"
          >
            <div
              className={`px-8 py-1 text-xl font-normal text-white bg-stak-dark-green font-sans font-md rounded-3xl
             hover:bg-stak-dark-green-hover hover:cursor-pointer active:bg-stak-dark-green-hover active:border-none 
             active:cursor-pointer active:shadow-sm`}
            >
              {buttonLabel}
            </div>
          </label>
          <input
            type="file"
            id="files"
            name="files"
            multiple
            className={classes['custom-file-input']}
            onChange={handleFileChange}
          />
        </form>
      )}
      {isLoading && (
        <div
          className={`px-8 py-1 text-xl h-9 font-normal text-white bg-stak-dark-green font-sans 
        font-md rounded-3xl hover:bg-stak-dark-green-hover hover:cursor-no-drop`}
        >
          <FadeLoader
            color="#fff"
            cssOverride={{
              scale: '0.5',
              width: '60px',
              height: '20px',
              top: '5px',
              left: '15px',
            }}
          />
        </div>
      )}
    </>
  );
}
