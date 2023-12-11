import React, { useEffect, useState } from 'react';

import { companyDataActions } from '@/store/company-data-slice';
import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { addBudgetFormActions } from '@/store/add-budget-slice';

import { useCurrentUser as useUser } from '@/hooks/use-user';
import useHttp from '@/hooks/use-http';
import { useSetStatePath } from '@/hooks/use-setpath';
import useSetNotification from '@/hooks/use-set-notification';

import { User } from '@/lib/models/formStateModels';

import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import MainComponent from '@/components/Budget/MainComponent';
import ModalConfirm from '@/components/UI/Modal/ModalConfirm';

import { ConvertTreeData } from '@/lib/utility/treeDataHelpers';
import { updateAllProjectBudgets } from '@/store/projects-data-slice';

const EditCostCodeFormat = () => {
  useSetStatePath();
  const dispatch = useDispatch();
  const { user, isLoading: userLoading } = useUser();

  const treeData = useSelector((state) => state.data.treeData);
  const costCodes = useSelector((state) => state.data.costCodes);

  useEffect(() => {
    // make sure that the update budget list is empty when the user renders this component
    dispatch(addBudgetFormActions.resetUpdateBudget());
  }, []);

  useEffect(() => {
    // always grab the master cost code list from the server to make sure
    // the user is always working on the saved version
    const getCostCodes = async () => {
      try {
        const response = await fetch(
          `/api/${(user as User).user_metadata.companyId}/get-cost-codes`,
          {
            method: 'GET',
          }
        );
        if (!response.ok) {
          throw new Error(
            `Something went wrong with fetching cost codes: ${response.status} - ${response.statusText}`
          );
        }
        const data = await response.json();
        const costCodeData = JSON.parse(data);
        const treeData = new ConvertTreeData().convertCostCode2TreeData(
          costCodeData
        );
        dispatch(companyDataActions.setCostCodeData(costCodeData));
        dispatch(
          companyDataActions.changeUpdateTreeStatus({
            updated: true,
            data: { ...treeData },
          })
        );
      } catch (error) {
        console.error(error);
      }
    };
    getCostCodes();
  }, []);

  const [openModal, setOpenModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>(
    'Please confirm your changes to the cost codes. Be aware, any modifications you save or delete here will propagate to all project budgets. Exercise extreme caution when deleting items.'
  );

  const costCodeFormat =
    (user as User).user_metadata.accountSettings['cost-code-format-as']
      ?.value ?? 'Custom';

  const { isLoading, error, response, successJSON, sendRequest } = useHttp({
    isClearData: false,
  });

  useEffect(() => {
    if (response && response.status === 201) {
      dispatch(companyDataActions.changeUpdateStatus(false));
    }
  }, [response]);

  const openModalHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    treeData && treeData.updated === false
      ? setModalMessage('The cost codes have not been updated.')
      : setModalMessage(
          'Please confirm your changes to the cost codes. Be aware, any modifications you save or delete here will propagate to all project budgets. Exercise extreme caution when deleting items.'
        );
    setOpenModal(true);
  };

  const closeModalHandler = () => {
    setOpenModal(false);
  };

  useSetNotification({
    response,
    successJSON,
    isOverlay: false,
  });

  const submitFormHandler = async (e: React.MouseEvent) => {
    e.preventDefault();
    const updatedTreeData = JSON.parse(JSON.stringify({ ...treeData }));
    Object.keys(updatedTreeData.data).forEach((key) => {
      if (Object.keys(updatedTreeData.data[key].data).includes('isOpened')) {
        delete updatedTreeData.data[key].data.isOpened;
      }
      if (updatedTreeData.data[key].data?.subItems?.length < 0) {
        delete updatedTreeData.data[key].data.subItems;
      }
    });
    const updatedCostCodes = new ConvertTreeData().convertTreeData2CostCode(
      updatedTreeData.data
    );

    dispatch(companyDataActions.setCostCodeData(updatedCostCodes));

    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${(user as User).user_metadata.companyId}/update-cost-codes`,
        method: 'POST',
        body: JSON.stringify(updatedCostCodes),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      await sendRequest({
        requestConfig,
      });

      await dispatch(
        updateAllProjectBudgets({
          companyId: (user as User).user_metadata.companyId,
        })
      );

      dispatch(
        companyDataActions.changeUpdateTreeStatus({
          updated: true,
          data: updatedTreeData.data,
        })
      );
    }
  };

  return (
    <>
      {(userLoading || !costCodes) && <FullScreenLoader />}
      {!userLoading && costCodes && (
        <>
          <ModalConfirm
            onCloseModal={closeModalHandler}
            openModal={openModal}
            onConfirm={(e: React.MouseEvent) => submitFormHandler(e)}
            isLoading={isLoading}
            error={error}
            message={modalMessage}
          />
          <MainComponent
            costCodes={{ ...costCodes }}
            onOpenModal={openModalHandler}
            pageTitle="Edit Cost Code Format"
            subTitle={`Cost Code Format: ${costCodeFormat}`}
            showError={false}
            actions={undefined}
          />
        </>
      )}
    </>
  );
};

export default React.memo(EditCostCodeFormat);
