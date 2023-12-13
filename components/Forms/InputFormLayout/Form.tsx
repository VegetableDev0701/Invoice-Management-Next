import React, { useEffect } from 'react';

import scrollToElement from '@/lib/utility/scrollToElement';
import { formatNameForID } from '@/lib/utility/formatter';
import { getFormIcon } from '@/lib/utility/formHelpers';
import { Actions, FormData } from '@/lib/models/types';
import { FormState } from '@/lib/models/formStateModels';
import {
  InputElementWithAddressItems,
  MainCategories,
  isInputElementWithAddressElements,
} from '@/lib/models/formDataModel';

import Card from '../../UI/Card';
import { Input } from '../../Inputs/Input';
import InputAddressAutocomplete from '@/components/Inputs/InputAddressAutocomplete';

import classes from './FormLayout.module.css';
import { classNames } from '@/lib/utility/utils';

interface EmptyAddProjectFormForTesting {
  mainCategories: MainCategories[];
  numRecurringFees: number;
}

export interface Props {
  formData: FormData | EmptyAddProjectFormForTesting;
  formState: FormState;
  showError: boolean;
  actions: Actions;
  form: string;
  extraClasses?: string;
  anchorScrollElement?: string;
  clickedLink?: string;
  dummyForceRender?: boolean;
}

function Form(props: Props) {
  const {
    clickedLink,
    formData,
    formState,
    showError,
    anchorScrollElement,
    actions,
    form,
    dummyForceRender,
    extraClasses,
  } = props;

  useEffect(() => {
    if (clickedLink && anchorScrollElement) {
      scrollToElement(clickedLink, anchorScrollElement, 'scroll-frame');
    }
  }, [clickedLink, anchorScrollElement, dummyForceRender]);

  return (
    <Card
      className={classNames(
        `flex items-start h-full p-5 bg-stak-white`,
        extraClasses
      )}
    >
      <div className={classes['scroll-frame']} id="scroll-frame">
        <form id="form-id" className={classes['content-frame']}>
          {formData.mainCategories.map((category, i) => {
            if (category.name === 'Recurring Fees') {
              return;
            }
            return (
              <div
                key={formatNameForID(category.name)}
                className={classes['category-frame']}
                id={formatNameForID(category.name)}
              >
                <span className="font-sans text-2xl font-semibold">
                  {category.name}
                </span>
                {category.inputElements.map((el, j) => {
                  if (isInputElementWithAddressElements(el)) {
                    return (
                      <InputAddressAutocomplete
                        key={j}
                        classes="flex-1 px-10 py-2"
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
                      className={`${classes['category-frame__input-frame']} px-10 py-2`}
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
                            form={form}
                            autofocus={
                              i === 0 && j === 0 && p === 0 ? true : false
                            }
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {/* Reccuring fees now is completed in the Labor/Fees of each project */}
          {/* {anchorScrollElement === 'project-details' && (
            <RecurringFees
              form={form}
              actions={actions as AddProjectActions}
              formData={formData as ProjectFormData}
            />
          )} */}
        </form>
      </div>
    </Card>
  );
}

export default React.memo(Form);
