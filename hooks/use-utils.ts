import { useEffect, useMemo } from 'react';

import { overlayActions } from '@/store/overlay-control-slice';
import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';

import { Items, SelectMenuOptions } from '@/lib/models/formDataModel';
import { FormStateItem } from '@/lib/models/formStateModels';
import {
  ChangeOrderSummary,
  VendorSummary,
} from '@/lib/models/summaryDataModel';
import { isDuplicated } from '@/lib/utility/utils';

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
  if (!projectId) return;
  const dispatch = useDispatch();

  const changeOrderSummary: ChangeOrderSummary | object | null = useSelector(
    (state) =>
      projectId ? state.projects[projectId]['change-orders-summary'] : null
  );
  const changeOrderNames = changeOrderSummary
    ? Object.values(changeOrderSummary).map((changeOrder) => changeOrder.name)
    : null;

  let isNameDuped = false;
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

  return isNameDuped;
};

export const useCheckVendorNameDuped = ({
  input,
  inputState,
  vendorDropDownData,
}: {
  input?: Items;
  inputState: FormStateItem;
  vendorDropDownData?: SelectMenuOptions[];
}) => {
  const dispatch = useDispatch();

  const vendorNames = vendorDropDownData
    ? Object.values(vendorDropDownData).map((vendor) => vendor.label)
    : null;

  let isNameDuped = false;
  // check for duplicate change order names
  if (input && inputState?.value && inputState.value !== input.value) {
    isNameDuped =
      input.id === 'vendor-name' && vendorNames
        ? isDuplicated(inputState?.value as string, vendorNames)
        : false;
  } else {
    isNameDuped = false;
  }

  useEffect(() => {
    dispatch(
      overlayActions.setOverlayContent({
        data: { isNameDuped },
        stateKey: 'vendors',
      })
    );
  }, [isNameDuped]);

  return isNameDuped;
};

export const useCreateVendorSelectMenu = ({
  vendorSummary,
}: {
  vendorSummary: VendorSummary;
}) => {
  const vendorSelectMenuOptions = useMemo(() => {
    let count = 0;
    const vendorSelectMenuOptions: SelectMenuOptions[] = vendorSummary
      ? Object.values(vendorSummary).map((vendor) => {
          count++;
          return {
            id: count,
            label: vendor.vendorName,
            uuid: vendor.uuid,
          };
        })
      : [];
    return vendorSelectMenuOptions;
  }, [Object.keys(vendorSummary).length]);
  return vendorSelectMenuOptions;
};
