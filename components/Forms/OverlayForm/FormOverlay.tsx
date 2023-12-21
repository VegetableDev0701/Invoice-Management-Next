import React from 'react';

import { formatNameForID } from '@/lib/utility/formatter';
import { getFormIcon } from '@/lib/utility/formHelpers';
import { Actions, AddLaborActions, FormData } from '@/lib/models/types';
import { FormState } from '@/lib/models/formStateModels';
import {
  InputElementWithAddressItems,
  LaborData,
  MainCategories,
  isInputElementWithAddressElements,
} from '@/lib/models/formDataModel';

import { Input } from '../../Inputs/Input';
import InputAddressAutocomplete from '@/components/Inputs/InputAddressAutocomplete';
import LaborCostCodes from './LaborCostCode';

import classes from '../InputFormLayout/FormLayout.module.css';
import { useAppSelector as useSelector } from '@/store/hooks';
import { VendorSummary } from '@/lib/models/summaryDataModel';

interface EmptyAddLaborFormForTesting {
  mainCategories: MainCategories[];
  numRecurringFees: number;
}

export interface Props {
  formData: FormData | EmptyAddLaborFormForTesting;
  formState: FormState;
  showError: boolean;
  actions: Actions;
  projectId: string;
  form: string;
  isNameDuped?: boolean;
}

function FormOverlay(props: Props) {
  const { formData, formState, showError, actions, form, projectId } = props;

  const vendorSummary = useSelector(
    (state) => state.data.vendorsSummary.allVendors
  ) as VendorSummary;

  return (
    <div className={classes['scroll-frame']} id="scroll-frame">
      <form
        onSubmit={(e) => e.preventDefault()}
        id="form-id"
        className="flex flex-col flex-grow"
      >
        {formData?.mainCategories.map((category, i) => {
          if (category.name === 'Labor Cost Codes') {
            return;
          }
          return (
            <div
              key={formatNameForID(category.name)}
              className="flex flex-col px-1 self-stretch"
              id={formatNameForID(category.name)}
            >
              <span
                className={`font-sans text-xl font-semibold ${
                  i > 0 ? 'mt-10' : 'mt-1'
                }`}
              >
                {category.name}
              </span>
              {category.inputElements.map((el, j) => {
                if (isInputElementWithAddressElements(el)) {
                  return (
                    <InputAddressAutocomplete
                      key={j}
                      classes="flex-1 px-5 py-2"
                      actions={actions}
                      input={
                        (el as InputElementWithAddressItems).addressElements
                      }
                      formState={formState}
                      showError={showError}
                    />
                  );
                }
                return (
                  <div
                    key={`${i}_${j}`}
                    className="flex py-2 px-5 self-stretch gap-4"
                  >
                    {el.items.map((item, p) => {
                      return (
                        <Input
                          classes="flex-1"
                          key={`${formatNameForID(item.label)}_${p}`}
                          input={{
                            ...item,
                          }}
                          icon={getFormIcon(item)}
                          showError={showError}
                          actions={actions}
                          vendorSummary={vendorSummary}
                          form={form}
                          autofocus={
                            i === 0 && j === 0 && p === 0 ? true : false
                          }
                          projectId={projectId}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
        {form === 'addLabor' && (
          <LaborCostCodes
            actions={actions as AddLaborActions}
            form={form}
            formData={formData as LaborData}
            formState={formState}
            showError={showError}
            projectId={projectId}
          />
        )}
        <button type="submit" />
      </form>
    </div>
  );
}

export default FormOverlay;
