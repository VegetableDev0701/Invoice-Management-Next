import { useEffect } from 'react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import scrollToElement from '@/lib/utility/scrollToElement';
import { createRecurringFormObject } from '@/lib/utility/formHelpers';
import { AddProjectActions } from '@/lib/models/types';
import { MainCategories, ProjectFormData } from '@/lib/models/formDataModel';

import Button from '@/components/UI/Buttons/Button';
import { Input } from '@/components/Inputs/Input';
import DollarSign from '@/public/icons/DollarSign';

import classes from './FormLayout.module.css';

interface EmptyAddProjectForm {
  mainCategories: MainCategories[];
  numRecurringFees: number;
}

export interface Props {
  form: string;
  actions: AddProjectActions;
  formData: ProjectFormData | EmptyAddProjectForm;
  showError?: boolean;
}

function RecurringFees(props: Props) {
  const { actions, form, formData } = props;

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(actions.setRecurringFee(formData.numRecurringFees));
  }, [dispatch]);

  const numRecurringFees = useSelector((state) => {
    return state.addProjectForm.numRecurringFees.value as number;
  });

  // loop through formData and create an object to
  // populate the values in the form
  const recurrFeeObj = createRecurringFormObject(formData as ProjectFormData);

  const incrementFee = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    dispatch(actions.incrementRecurringFee());
    setTimeout(() => {
      scrollToElement('add-button', 'project-details', 'scroll-frame');
    }, 50);
  };
  const decrementFee = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    dispatch(actions.decrementRecurringFee());
  };

  const recurringFees = [];
  for (let i = 0; i < numRecurringFees; i++) {
    recurringFees.push(
      <div key={i}>
        <div className="flex self-stretch gap-4 px-5 py-2">
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Description',
              id: `${i + 1}-recurring-fee-description`,
              type: 'text',
              required: false,
              value: recurrFeeObj[`${i + 1}-recurring-fee-description`],
              isCurrency: false,
            }}
            actions={actions}
          />
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Cost Code',
              id: `${i + 1}-recurring-fee-cost-code`,
              inputType: 'dropdownWithSearch',
              type: 'text',
              required: false,
              value: recurrFeeObj[`${i + 1}-recurring-fee-cost-code`],
              isCurrency: false,
            }}
            actions={actions}
          />
        </div>
        <div className="flex self-stretch gap-4 px-5 py-2">
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Amount ($)',
              id: `${i + 1}-recurring-fee-amount`,
              type: 'text',
              required: false,
              value: recurrFeeObj[`${i + 1}-recurring-fee-amount`],
              isCurrency: true,
            }}
            icon={<DollarSign width={null} height={null} />}
            actions={actions}
          />
          <Input
            classes="flex-1"
            input={{
              label: 'Recurring',
              id: `${i + 1}-recurring-fee-cycle`,
              inputType: 'dropdown',
              required: false,
              value: recurrFeeObj[`${i + 1}-recurring-fee-cycle`],
              isCurrency: false,
              // TODO get this dynamically from the API -- put in account settings
              selectMenuOptions: [
                { id: 1, label: 'Each billing cycle' },
                { id: 2, label: 'Weekly' },
                { id: 3, label: 'Bi-weekly' },
                { id: 4, label: 'Monthly' },
              ],
            }}
            form={form}
            actions={actions}
          />
        </div>
        {i + 1 !== numRecurringFees && (
          <span className={classes['separator']}></span>
        )}
      </div>
    );
  }
  return (
    <>
      <div
        className="flex flex-col px-10 py-2 self-stretch"
        id="recurring-fees"
      >
        <span className="font-sans text-2xl font-semibold">Recurring Fees</span>
        {recurringFees}
        <div id="add-button" className="flex self-stretch gap-4 py-2">
          <Button
            className="px-8 py-1 text-xl"
            onClick={incrementFee}
            buttonText="Add Recurring Fee"
          />
          {numRecurringFees > 0 && (
            <Button
              className="px-8 py-1 text-xl"
              onClick={decrementFee}
              buttonText="Remove Recurring Fee"
            />
          )}
        </div>
      </div>
    </>
  );
}

export default RecurringFees;
