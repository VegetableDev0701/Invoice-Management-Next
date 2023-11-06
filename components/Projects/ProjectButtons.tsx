import { useUser } from '@auth0/nextjs-auth0/client';

import { useAppDispatch as useDispatch } from '@/store/hooks';
import {
  createBudgetActuals,
  moveAllBillData,
  moveBillDataInFirestore,
} from '@/store/add-client-bill';

import { User } from '@/lib/models/formStateModels';
import { nanoid } from '@/lib/config';

import {
  InvoiceCurrentActuals,
  InvoiceCurrentActualsChangeOrders,
  InvoiceCurrentActualsChangeOrdersV2,
  InvoiceCurrentActualsV2,
} from '@/lib/models/budgetCostCodeModel';
import ButtonWithLoader from '../UI/Buttons/ButtonWithLoader';
import { uiActions } from '@/store/ui-slice';

const buttonClasses =
  'px-10 py-2 md:text-2xl font-normal bg-stak-dark-green 2xl:text-3xl';

const ProjectButtons = ({ projectId }: { projectId: string }) => {
  const dispatch = useDispatch();
  const { user } = useUser();
  const buildClientBillHandler = () => {
    const clientBillId = nanoid();
    // There are checks in each of these dispatches that will end the dispatch early,
    // so each subsequent dispatch should not run unless the previous one completed
    // successfully
    dispatch(
      createBudgetActuals({
        projectId,
        companyId: (user as User).user_metadata.companyId,
        clientBillId,
      })
    ).then((result) => {
      if (result.payload) {
        const { clientBillObj } = result.payload as {
          clientBillObj: {
            actuals: InvoiceCurrentActualsV2;
            actualsChangeOrders: InvoiceCurrentActualsChangeOrdersV2;
          };
        };
        dispatch(
          moveAllBillData({
            projectId,
            clientBillId,
          })
        ).then(() =>
          dispatch(
            moveBillDataInFirestore({
              projectId,
              companyId: (user as User).user_metadata.companyId,
              clientBillId,
              clientBillObj,
            })
          )
        );
      }
    });
    dispatch(uiActions.setLoadingState({ isLoading: true }));
  };
  return (
    <div className="flex gap-2">
      <ButtonWithLoader
        button={{
          label: "Build Client's Bill",
          className:
            'px-10 py-2 md:text-2xl font-normal bg-stak-dark-green 2xl:text-3xl',
          onClick: buildClientBillHandler,
        }}
      />
    </div>
  );
};

export default ProjectButtons;
