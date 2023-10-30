import { FadeLoader } from 'react-spinners';

import { useAppSelector as useSelector } from '@/store/hooks';
import useUploadFilesHandler from '@/hooks/use-upload-files';

import Card from '@/components/UI/Card';
import ModalDuplicateFilesError from '@/components/UI/Modal/ModalErrorDuplicateFiles';
import AddInvoice from '@/public/icons/AddInvoiceSVG';

import classes from './InputFile.module.css';

function InputFiles() {
  const isLoading = useSelector((state) => state.ui.isLoading);

  const { openModal, duplicateFiles, handleFileChange, closeModalHandler } =
    useUploadFilesHandler({ uploadFileType: 'invoice' });

  return (
    <>
      <ModalDuplicateFilesError
        onCloseModal={closeModalHandler}
        openModal={openModal}
        data={duplicateFiles}
      />
      {!isLoading && (
        <Card className="h-full bg-stak-dark-green ease-in-out duration-150 hover:bg-stak-dark-green-hover">
          <form
            method="post"
            encType="multipart/form-data"
            className="flex flex-col grow"
          >
            <label
              htmlFor="files"
              className="flex grow justify-center items-center hover:cursor-pointer"
            >
              <div className="flex flex-col items-center">
                <AddInvoice width={null} height={null} />
                <span className="text-2xl font-medium text-white">
                  Add and Process New Invoices
                </span>
              </div>
            </label>
            <input
              type="file"
              id="files"
              name="files"
              multiple
              className={`${classes['custom-file-input']}`}
              onChange={handleFileChange}
            />
          </form>
        </Card>
      )}
      {isLoading && (
        <Card className="h-full bg-stak-dark-green hover:cursor-no-drop">
          <div className="m-auto">
            <FadeLoader color="#fff" radius={11} />
          </div>
        </Card>
      )}
    </>
  );
}

export default InputFiles;
