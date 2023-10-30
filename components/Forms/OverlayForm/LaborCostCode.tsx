import { useEffect } from 'react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { createRecurringFormObject } from '@/lib/utility/formHelpers';
import { AddLaborActions } from '@/lib/models/types';
import { LaborData, MainCategories } from '@/lib/models/formDataModel';

import Button from '@/components/UI/Buttons/Button';
import { Input } from '@/components/Inputs/Input';
import DollarSign from '@/public/icons/DollarSign';

import classes from '../InputFormLayout/FormLayout.module.css';
import { FormState } from '@/lib/models/formStateModels';
import { ChangeOrderSummary } from '@/lib/models/summaryDataModel';

interface EmptyAddLaborFormForTesting {
  numCostCodes: number;
  mainCategories: MainCategories[];
}

export interface Props {
  form: string;
  actions: AddLaborActions;
  formData: LaborData | EmptyAddLaborFormForTesting;
  formState: FormState;
  projectId: string;
  showError?: boolean;
}

function LaborCostCodes(props: Props) {
  const { actions, form, formData, formState, showError, projectId } = props;
  const dispatch = useDispatch();

  const changeOrdersSummary: ChangeOrderSummary = useSelector(
    (state) => state.projects[projectId]?.['change-orders-summary']
  );

  useEffect(() => {
    dispatch(actions.setCostCodes(formState.numCostCodes.value as number));
    dispatch(actions.setCurrentCostCode(formData.numCostCodes as number));
  }, []);

  const numCostCodes = useSelector((state) => {
    return state.addLaborForm.numCostCodes.value as number;
  });
  // useEffect(() => {
  //   setCostCodeNum(currentNumCostCodes)
  // }, [numCostCodes])

  // const currentData = useSelector((state) => state.overlay.labor.currentData);
  // const currentNumCostCodes = currentData
  //   ? currentData.numCostCodes
  //   : numCostCodes;

  // const currentCostCodeNum = currentData ? currentData.numCostCodes
  // loop through formData and create an object to
  // populate the values in the form
  const costCodesObj = createRecurringFormObject(formData as LaborData);

  const incrementFee = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    dispatch(actions.incrementCostCodes());
    // setTimeout(() => {
    //   scrollToElement('add-button', 'project-details', 'scroll-frame');
    // }, 50);
  };
  const decrementFee = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    dispatch(actions.decrementCostCodes());
  };

  const costCodes = [];
  for (let i = 0; i < numCostCodes; i++) {
    costCodes.push(
      <div key={i}>
        <div className="flex py-2 px-5 self-stretch gap-4">
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Cost Code',
              id: `${i + 1}-cost-code`,
              type: 'text',
              inputType: 'dropdownWithSearch',
              required: true,
              errormessage: 'Cost Code is required.',
              value: costCodesObj[`${i + 1}-cost-code`],
              isCurrency: false,
              isOnOverlay: true,
            }}
            icon={<DollarSign width={null} height={null} />}
            actions={actions}
            showError={showError}
          />
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Work Description',
              id: `${i + 1}-work-description`,
              type: 'text',
              inputType: 'dropdownWithSearch',
              required: true,
              errormessage: 'Work description is required.',
              value: costCodesObj[`${i + 1}-work-description`],
              isCurrency: false,
              isOnOverlay: true,
            }}
            actions={actions}
            showError={showError}
          />
        </div>
        <div className="flex py-2 px-5 self-stretch gap-4">
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Number of Hours / Qty.',
              id: `${i + 1}-number-of-hours`,
              type: 'text',
              inputmode: 'numeric',
              required: true,
              errormessage: 'Number of hours worked is required.',
              value: costCodesObj[`${i + 1}-number-of-hours`],
              isCurrency: false,
              isOnOverlay: true,
            }}
            actions={actions}
            showError={showError}
          />
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Change Order',
              id: `${i + 1}-change-order`,
              type: 'text',
              inputType: 'dropdownWithSearch',
              required: false,
              errormessage: 'Change order is required.',
              value: costCodesObj?.[`${i + 1}-change-order`]
                ? costCodesObj[`${i + 1}-change-order`]
                : 'None',
              isCurrency: false,
              isOnOverlay: true,
            }}
            actions={actions}
            changeOrdersSummary={changeOrdersSummary}
          />
        </div>
        {i + 1 !== numCostCodes && (
          <span className={classes['separator']}></span>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col px-1 self-stretch" id="cost-codes">
      {/* <span className={`font-sans text-2xl font-semibold`}>
          Recurring Fees
        </span> */}
      {costCodes}
      <div id="add-button" className="flex my-0 px-5 self-stretch gap-4">
        <Button
          className="px-4 my-4 text-lg"
          onClick={incrementFee}
          buttonText="Add Work"
        />
        {numCostCodes > 1 && (
          <Button
            className="px-4 my-4 text-lg"
            onClick={decrementFee}
            buttonText="Remove Work"
          />
        )}
      </div>
    </div>
  );
}

export default LaborCostCodes;
