import { Fragment, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { contractActions } from '@/store/contract-slice';

import { useKeyPressActionOverlay } from '@/hooks/use-save-on-key-press';
import { useContractSignedUrl } from '@/hooks/use-get-signed-url';

import { ContractEntry } from '@/lib/models/summaryDataModel';
import { isObjectEmpty } from '@/lib/utility/utils';

import { XMarkIcon } from '@heroicons/react/24/outline';
import FullScreenLoader from '../Loaders/FullScreenLoader';
import CenteredPagination from '../Pagination/CenteredNumbersPagination';
import MagnifyImageOnHover from '@/components/Forms/OverlayForm/MagnifyImageOnHover';

interface Props {
  rows: ContractEntry[] | null;
  projectId: string;
  isOnProcessInvoices?: boolean;
}

export default function ContractSlideOverlayImage(props: Props) {
  const { rows, projectId, isOnProcessInvoices } = props;
  const [open, setOpen] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);

  const contractObj = useSelector((state) => state.contract);
  const dispatch = useDispatch();

  const closeFormRef = useRef<HTMLButtonElement>(null);

  useKeyPressActionOverlay({
    formOverlayOpen: open,
    ref: closeFormRef,
    keyName: 'Enter',
  });

  // Get the row data that was clicked
  const currentRow =
    rows && rows.find((row) => row.uuid === contractObj.clickedContract?.uuid);

  useEffect(() => {
    setOpen(contractObj.isRowClicked);
  }, [contractObj.isRowClicked]);

  useContractSignedUrl(contractObj, projectId);

  const closeOverlay = () => {
    setOpen(false);
    if (isOnProcessInvoices) {
      dispatch(
        contractActions.setClickedContract({
          isRowClicked: false,
        })
      );
    } else {
      dispatch(
        contractActions.setClickedContract({
          contract: null,
          isRowClicked: false,
        })
      );
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className={`relative ${isOnProcessInvoices ? 'z-50' : 'z-30'}`}
        onClose={closeOverlay}
      >
        <div className="fixed inset-0" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300 sm:duration-[400ms]"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300 sm:duration-[250ms]"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-2xl">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-base font-sans font-semibold leading-6 text-gray-500">
                          <p>{`${
                            contractObj.clickedContract &&
                            contractObj.clickedContract.summaryData.vendor
                          }`}</p>
                          <div className="flex items-end gap-4">
                            Project:{' '}
                            {contractObj.clickedContract &&
                              contractObj.clickedContract.summaryData
                                .projectName}
                          </div>
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-800 focus:outline-none focus:ring-0 focus:ring-offset-0"
                            ref={closeFormRef}
                            onClick={(e) => {
                              e.stopPropagation();
                              closeOverlay();
                            }}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-6 flex flex-1 px-4 sm:px-6 overflow-auto">
                      {contractObj.isLoading && (
                        <FullScreenLoader className="z-50 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      )}
                      {!contractObj.isLoading &&
                        currentRow &&
                        contractObj.clickedContract &&
                        contractObj.signedUrls &&
                        !isObjectEmpty(Object.keys(contractObj.signedUrls)) && // check for empty object
                        contractObj.signedUrls[
                          contractObj.clickedContract.uuid
                        ] &&
                        !isObjectEmpty(
                          Object.keys(
                            contractObj.signedUrls?.[
                              contractObj.clickedContract.uuid
                            ]
                          )
                        ) &&
                        contractObj.signedUrls[contractObj.clickedContract.uuid]
                          ?.signedUrls?.[pageIdx] && (
                          <MagnifyImageOnHover
                            src={
                              contractObj.signedUrls[
                                contractObj.clickedContract.uuid
                              ].signedUrls[pageIdx]
                            }
                            pageIdx={pageIdx}
                            alt={
                              contractObj.clickedContract.summaryData
                                .vendor as string
                            }
                          />
                        )}
                    </div>
                    {contractObj.clickedContract && (
                      <CenteredPagination
                        onChangePage={setPageIdx}
                        pageArray={contractObj.clickedContract.gcs_img_uri}
                        open={open}
                        rows={null}
                      />
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
