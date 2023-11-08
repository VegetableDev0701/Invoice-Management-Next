import { Items } from '@/lib/models/formDataModel';
import { FormStateItem } from '@/lib/models/formStateModels';
import { ChangeOrderSummary } from '@/lib/models/summaryDataModel';
import { isDuplicated } from '@/lib/utility/utils';
import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { overlayActions } from '@/store/overlay-control-slice';
import { useEffect } from 'react';

/**
 * Will return true if the change order name chosen is already in use.
 */
export const useCheckChangeOrderNameDuped = ({
  projectId,
  input,
  inputState,
}: {
  projectId: string | undefined;
  input?: Items;
  inputState: FormStateItem;
}) => {
  const dispatch = useDispatch();

  const changeOrderSummary: ChangeOrderSummary | null = useSelector((state) =>
    projectId ? state.projects[projectId]['change-orders-summary'] : null
  );
  const changeOrderNames = changeOrderSummary
    ? Object.values(changeOrderSummary).map((changeOrder) => changeOrder.name)
    : null;

  let isNameDuped: boolean = false;
  // check for duplicate change order names
  if (input && inputState?.value && inputState.value !== input.value) {
    isNameDuped =
      input.id === 'change-order-name' && changeOrderNames
        ? isDuplicated(inputState?.value as string, changeOrderNames)
        : false;
  } else {
    isNameDuped = false;
  }

  useEffect(() => {
    dispatch(
      overlayActions.setOverlayContent({
        data: { isNameDuped },
        stateKey: 'change-orders',
      })
    );
  }, [isNameDuped]);

  if (!projectId) return;
  return isNameDuped;
};
