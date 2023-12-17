import { Fragment, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';

import { useKeyPressActionOverlay } from '@/hooks/use-save-on-key-press';
import { usePageData } from '@/hooks/use-page-data';
import { useAddCurrentDataToFormData } from '@/hooks/use-add-current-page-data';
import { editContractFormActions } from '@/store/edit-contract';
import { FormStateV2, User } from '@/lib/models/formStateModels';
import { overlayActions } from '@/store/overlay-control-slice';
import { ContractData, ContractEntry } from '@/lib/models/summaryDataModel';
import SlideOverlayForm from './SlideOverlayForm';
import { checkAllFormFields } from '@/lib/validation/formValidation';
import { projectDataActions } from '@/store/projects-data-slice';
import { useUser } from '@auth0/nextjs-auth0/client';
import useHttp from '@/hooks/use-http';
import useSetNotification from '@/hooks/use-set-notification';

interface Props {
  projectId: string;
  tableData: ContractData | null;
}

export default function ContractSlideOverlay(props: Props) {
  const { tableData, projectId } = props;
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const { data: editContractFormData } = usePageData(
    'data',
    'forms',
    'edit-contract'
  );

  const { user, isLoading: userLoading } = useUser();

  const currentFormData = useAddCurrentDataToFormData({
    projectId,
    formData: editContractFormData,
  });

  const { response, successJSON, sendRequest } = useHttp({
    isClearData: false,
  });

  const editContractFormStateData = useSelector(
    (state) => state.editContractForm
  );
  const overlayContent = useSelector((state) => state.overlay.contracts);

  const [missingInputs, setMissingInputs] = useState<boolean>(false);

  const closeFormRef = useRef<HTMLButtonElement>(null);
  useKeyPressActionOverlay({
    formOverlayOpen: open,
    ref: closeFormRef,
    keyName: 'Enter',
  });

  const submitFormHandler = async (
    e: React.FormEvent,
    formStateData?: FormStateV2
  ) => {
    e.preventDefault();

    const allValid = checkAllFormFields(
      editContractFormData,
      editContractFormStateData
    );

    if (!allValid) {
      setMissingInputs(true);
      return;
    }

    setMissingInputs(false);
    dispatch(
      overlayActions.setOverlayContent({
        data: { open: false },
        stateKey: 'contracts',
      })
    );

    if (!tableData || !overlayContent.currentId || !formStateData) return;

    const dataToSubmit: ContractEntry = {
      ...tableData[overlayContent.currentId],
      summaryData: {
        ...tableData[overlayContent.currentId].summaryData,
        contractAmt: String(formStateData['contract-amount'].value),
        date: String(formStateData['contract-date'].value),
        vendor: String(formStateData['vendor-name'].value),
      },
    };

    dispatch(
      projectDataActions.addFullData({
        newData: dataToSubmit,
        projectId: projectId,
        stateKey: 'contracts',
      })
    );

    if (!userLoading && user) {
      let headers = {};
      headers = {
        contractId: overlayContent.currentId,
        'Content-Type': 'application/json',
      };

      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}/edit-contract`,
        method: 'POST',
        body: JSON.stringify(dataToSubmit),
        headers: headers,
      };

      await sendRequest({
        requestConfig,
        actions: editContractFormActions,
        pushPath: `/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}`,
      });
    }
  };

  useEffect(() => {
    setOpen(!!overlayContent.open);
  }, [overlayContent.open]);

  useSetNotification({
    response,
    successJSON,
    isOverlay: true,
    overlayStateKey: 'contracts',
  });

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-30 flex"
        onClose={() => {
          setOpen(false);
          dispatch(
            overlayActions.setOverlayContent({
              data: {
                overlayTitle: 'Update Contract',
                open: false,
              },
              stateKey: 'contracts',
            })
          );
        }}
      >
        {/* <ContractSlideOverlayImage rows={rows} projectId={projectId} /> */}
        <SlideOverlayForm
          formData={currentFormData}
          formState={editContractFormStateData}
          actions={editContractFormActions}
          showError={missingInputs}
          overlayContent={overlayContent}
          form="editContract"
          overlayStateKey="contracts"
          projectId={projectId}
          onSubmit={(e) => submitFormHandler(e, editContractFormStateData)}
        />
      </Dialog>
    </Transition.Root>
  );
}
