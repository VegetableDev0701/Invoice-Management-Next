import { useState } from 'react';

import { useAppDispatch as useDispatch } from '@/store/hooks';
import { companyDataActions } from '@/store/company-data-slice';
import { addBudgetFormActions } from '@/store/add-budget-slice';

import InputBaseAddItem from '@/components/Inputs/InputBaseAddDivision';
import Button from '@/components/UI/Buttons/Button';

interface Props {
  label: string;
  formClasses: string;
  divisionNumber: number;
  subdivisionNumber?: number;
  showForm: () => void;
}

export default function AddLineItem(props: Props) {
  const { label, formClasses, divisionNumber, subdivisionNumber, showForm } =
    props;
  const [isError, setIsError] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    divisionNumber: -1,
    subDivNumber: -1,
  });

  const dispatch = useDispatch();

  const submitFormHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    if (formData['name'] === '' || formData['number'] === '') {
      setIsError(true);
      return;
    }
    if (formData.subDivNumber) {
      dispatch(companyDataActions.setNewCostCode(formData));
      dispatch(addBudgetFormActions.addToUpdateBudgetList(formData));
    } else {
      dispatch(companyDataActions.setNewSubDivision(formData));
      dispatch(
        addBudgetFormActions.addToUpdateBudgetList({
          name: formData.name,
          number: formData.number,
          divisionNumber: formData.divisionNumber,
        })
      );
    }
    showForm();
  };

  const changeHandler = (id: string, value: string) => {
    if (subdivisionNumber !== -1) {
      const subDivNumber = subdivisionNumber as number;
      setFormData({
        ...formData,
        [id]: value,
        divisionNumber,
        subDivNumber,
      });
    } else {
      setFormData({
        ...formData,
        [id]: value,
        divisionNumber,
      });
    }
  };

  return (
    <div className={`flex gap-2 items-end ${formClasses}`}>
      <InputBaseAddItem
        classes="w-3/12"
        showError={isError}
        onChange={changeHandler}
        input={{
          label: label,
          id: `number`,
          type: 'text',
          inputmode: 'numeric',
          value: '',
          required: false,
        }}
      />
      <InputBaseAddItem
        classes="w-9/12"
        showError={isError}
        onChange={changeHandler}
        input={{
          label: 'Name',
          id: 'name',
          type: 'text',
          value: '',
          required: false,
        }}
      />
      <Button
        buttonText="Save"
        type="button"
        onClick={(e) => submitFormHandler(e)}
        className="text-2xl font-normal h-1/2 flex items-center mb-1.5 py-5 px-8"
      />
      {/* Use this to show an error message across both inputs if needed. */}
      {/* {isError && (
        <p
          className="mt-2 text-sm text-red-600"
          id={`${input.id}-error-message`}
        >
          {input.errormessage}
        </p>
      )} */}
    </div>
  );
}
