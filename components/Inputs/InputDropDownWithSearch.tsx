import { ChangeEvent, useEffect, useState } from 'react';
import { Combobox } from '@headlessui/react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { contractActions } from '@/store/contract-slice';
import { addVendorFormActions } from '@/store/add-vendor-slice';
import { overlayActions } from '@/store/overlay-control-slice';

import useConnectDescriptionToCostCode from '@/hooks/use-link-cost-code-description';
import { usePageData } from '@/hooks/use-page-data';

import { getValidFunc } from '@/lib/validation/formValidation';
import { useGetInputState } from '@/lib/utility/formHelpers';
import { Items, SelectMenuOptions } from '@/lib/models/formDataModel';
import { Actions } from '@/lib/models/types';
import { FormStateItem, FormStateItemV2 } from '@/lib/models/formStateModels';
import {
  getChangeOrderNamesForDropDown,
  getCustomerNamesForDropDown,
  getEmployeeNamesForDropDown,
  getProjectNamesForDropdown,
} from '@/lib/utility/tableHelpers';
import { sortArrayByObjKey } from '@/lib/utility/tableHelpers';
import { ChangeOrderSummary } from '@/lib/models/summaryDataModel';

import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import FullScreenLoader from '../UI/Loaders/FullScreenLoader';

import classes from './Input.module.css';
import AddInvoice from '@/public/icons/AddInvoiceSVG';
import ButtonIcon from '../UI/Buttons/ButtonIcon';
import AddVendorIcon from '@/public/icons/AddVendorSVG';
import { Customers, Employees } from '@/lib/models/companyDataModel';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface Props {
  classes: string;
  input: Items;
  actions: Actions;
  form: string;
  showError?: boolean;
  icon?: JSX.Element;
  projectId?: string;
  changeOrdersSummary?: ChangeOrderSummary;
  vendorDropDownData?: SelectMenuOptions[];
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
}

interface Selected {
  label: string;
}

const getValue = ({
  inputState,
  input,
}: {
  inputState: FormStateItemV2;
  input: Items;
}) => {
  return input?.value
    ? { label: input.value as string }
    : inputState?.value
    ? { label: inputState.value as string }
    : { label: '' };
};

const DropDownWithSearch = (props: Props) => {
  const {
    input,
    showError,
    actions,
    form,
    changeOrdersSummary,
    vendorDropDownData,
    onFocus,
    onBlur,
    onMouseEnter,
    onMouseLeave,
    classes: addOnClass,
  } = props;

  const dispatch = useDispatch();
  const inputState = useGetInputState(input.id, form);

  const { data: projects, isLoading } = usePageData('data', 'projectsSummary');

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Selected>(
    getValue({ inputState, input })
  );

  const [dropDownChoices, setDropDownChoices] = useState<SelectMenuOptions[]>(
    input.selectMenuOptions as SelectMenuOptions[]
  );

  const costCodeList: SelectMenuOptions[] = useSelector(
    (state) => state.data.costCodeList
  );
  const costCodeNameList: SelectMenuOptions[] = useSelector(
    (state) => state.data.costCodeNameList
  );
  const contractObj = useSelector((state) => state.contract);
  const customers = useSelector((state) => state.data?.customers) as Customers;
  const employees = useSelector((state) => state.data?.employees) as Employees;

  const contractClickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(contractActions.setClicked({ isRowClicked: true }));
  };

  const addVendorClickHandler = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    dispatch(addVendorFormActions.clearFormState());
    dispatch(addVendorFormActions.resetFormValidation());
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Add Vendor',
          open: true,
          isSave: true,
        },
        stateKey: 'vendors',
      })
    );
    dispatch(
      overlayActions.setCurrentOverlayData({
        data: {
          currentData: null,
          currentId: null,
        },
        stateKey: 'vendors',
      })
    );
  };

  const vendorUUID =
    dropDownChoices &&
    dropDownChoices.find((choice) => choice.label === selected.label);

  const updateCostCodeDescription = useConnectDescriptionToCostCode({
    input,
    costCodeList,
    costCodeNameList,
  });

  // will query the list of available options as the user types and dynamically match them
  // this version will match any letter, so super will match to project supervision
  const filteredOptions =
    query.trim() === ''
      ? (dropDownChoices as SelectMenuOptions[])
      : (dropDownChoices as SelectMenuOptions[]).filter((option) => {
          return option.label
            .toLowerCase()
            .includes(query.trim().toLowerCase());
        });
  const isInputRequired = input.required;

  // This connects the choice for cost code to the corresponding work description
  // and vice versa
  useEffect(() => {
    if (input.id.includes('cost-code') || input.id.includes('cost_code')) {
      const workItem = input.id.split('-')[0];
      if (
        input.id === `${workItem}-cost-code` ||
        input.id === 'cost-code' ||
        input.id === `${workItem}-cost-code`
      ) {
        setSelected(updateCostCodeDescription);
      }
    }
    if (
      input.id.includes('work-description') ||
      input.id.includes('work_description')
    ) {
      const workItem = input.id.split('-')[0];
      if (
        input.id === `${workItem}-work-description` ||
        input.id === 'work-description' ||
        input.id === `${workItem}-work-description`
      ) {
        setSelected(updateCostCodeDescription);
      }
    }
  }, [updateCostCodeDescription]);

  // dynamically set the dropdown choices based on what the input category is
  useEffect(() => {
    if (input.id.includes('cost-code') || input.id.includes('cost_code')) {
      const costCodeListNew = [...costCodeList];
      setDropDownChoices(sortArrayByObjKey(costCodeListNew, 'label', 'None'));
    } else if (input.id.includes('project-supervisor')) {
      // TODO grab all potential supervisors for a company here
    } else if (input.id.includes('project-name')) {
      setDropDownChoices(
        sortArrayByObjKey(
          getProjectNamesForDropdown(projects.allProjects),
          'label',
          'Unassign'
        )
      );
    } else if (
      input.id.includes('work-description') ||
      input.id.includes('work_description')
    ) {
      const costCodeNameListNew = [...costCodeNameList];
      setDropDownChoices(
        sortArrayByObjKey(costCodeNameListNew, 'label', 'None')
      );
    } else if (input.id.includes('change-order')) {
      if (changeOrdersSummary) {
        setDropDownChoices(
          sortArrayByObjKey(
            getChangeOrderNamesForDropDown({ changeOrdersSummary }),
            'label',
            'None'
          )
        );
      } else {
        setDropDownChoices([{ id: 1, label: 'None' }]);
      }
    } else if (input.id.includes('vendor-name')) {
      if (vendorDropDownData && vendorDropDownData.length > 0) {
        setDropDownChoices(sortArrayByObjKey(vendorDropDownData, 'label', ''));
      } else {
        setDropDownChoices([{ id: 1, label: 'None' }]);
      }
    } else if (input.id.includes('client-name')) {
      setDropDownChoices(
        sortArrayByObjKey(
          getCustomerNamesForDropDown({ customers }),
          'label',
          'None'
        )
      );
    } else if (input.id.includes('employee-name')) {
      setDropDownChoices(
        sortArrayByObjKey(
          getEmployeeNamesForDropDown({ employees }),
          'label',
          'None'
        )
      );
    }
  }, [isLoading]);

  useEffect(() => {
    dispatch(
      actions.setFormElement({
        inputValue: selected?.label,
        inputKey: input.id,
        isValid: getValidFunc(input.id)(selected.label, isInputRequired),
      })
    );
  }, [selected.label, input.id, getValidFunc]);

  const blurHandler = () => {
    dispatch(
      actions.setIsTouchedState({
        inputKey: input.id,
        isTouched: true,
        isValid: getValidFunc(input.id)(
          (inputState as FormStateItem).value as string,
          input.required
        ),
      })
    );
  };

  const changeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    dispatch(
      actions.setIsTouchedState({
        inputKey: input.id,
        isTouched: true,
        isValid: getValidFunc(input.id)(
          (inputState as FormStateItem).value as string,
          input.required
        ),
      })
    );
    if ('setIsUpdatedState' in actions) {
      dispatch(actions.setIsUpdatedState(true));
    }
  };

  const isError = !showError
    ? !inputState?.isValid && inputState?.isTouched
    : !inputState?.isValid;

  return (
    <div className={`${classes['input-container']} ${addOnClass}`}>
      {!filteredOptions && <FullScreenLoader notFullScreen={true} />}
      {filteredOptions && (
        <Combobox
          as="div"
          value={selected}
          onChange={(value) => {
            if ('setIsUpdatedState' in actions) {
              dispatch(actions.setIsUpdatedState(true));
            }
            setSelected(value);
          }}
        >
          <Combobox.Label
            htmlFor={input.id}
            className={`block font-sans font-semibold ${
              input.isOnOverlay ? ' text-md' : 'text-md'
            } text-stak-dark-gray`}
          >
            {input.label}
          </Combobox.Label>
          <div className="flex gap-2">
            <div className="relative mt-1 w-full" onBlur={blurHandler}>
              <Combobox.Input
                className={`font-sans w-full pr-14 rounded-md border-1 shadow-md ${
                  input.isOnOverlay ? 'rounded-md py-1.5' : 'rounded-lg'
                } ${
                  isError && isInputRequired
                    ? 'border-red-500'
                    : 'border-stak-light-gray'
                } ${classes['input-container__input']}`}
                onChange={(event) => changeHandler(event)}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onFocus={onFocus}
                onBlur={onBlur}
                displayValue={(option: { label: string }) => {
                  return option?.label && option.label === 'None'
                    ? ''
                    : option?.label;
                }}
                id={input.id}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                <ChevronUpDownIcon
                  className="h-5 w-10 rounded-md bg-stak-dark-green text-white hover:brightness-110 active:brightness-90"
                  aria-hidden="true"
                />
              </Combobox.Button>

              {filteredOptions.length > 0 && (
                <Combobox.Options
                  className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto border-1 border-stak-light-gray rounded-xl 
                bg-white py-1 text-base drop-shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm`}
                >
                  {filteredOptions.map((option) => (
                    <Combobox.Option
                      key={option.id}
                      value={option}
                      className={({ active, selected }) =>
                        classNames(
                          'font-sans text-base relative cursor-default select-none py-2 pl-3 pr-9',
                          active && selected
                            ? 'bg-stak-dark-green text-white'
                            : selected
                            ? 'bg-gray-200'
                            : '',
                          active
                            ? 'bg-stak-dark-green text-white'
                            : 'text-stak-dark-gray'
                        )
                      }
                    >
                      {({ active, selected }) => (
                        <>
                          <span className="block truncate">{option.label}</span>

                          {selected && (
                            <span
                              className={classNames(
                                'absolute inset-y-0 right-0 flex items-center pr-4',
                                active ? 'text-white' : 'text-indigo-600'
                              )}
                            >
                              <CheckIcon
                                className="h-5 w-5 text-stak-dark-green"
                                aria-hidden="true"
                              />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              )}
            </div>
            {input.sideButton && input.buttonText === 'Contract' && (
              <>
                <ButtonIcon
                  icon={<AddVendorIcon width={40} height={40} />}
                  className="items-center px-1"
                  type="button"
                  onClick={addVendorClickHandler}
                />
                {form !== 'editContract' && (
                  <ButtonIcon
                    icon={<AddInvoice width={40} height={40} />}
                    className="items-center"
                    type="button"
                    disabled={
                      (contractObj.clickedContract &&
                        contractObj.clickedContract.summaryData.vendor.uuid !==
                          vendorUUID?.uuid) ??
                      true
                    }
                    onClick={contractClickHandler}
                  />
                )}
              </>
            )}
          </div>
        </Combobox>
      )}
      {isError && isInputRequired && (
        <p
          className="font-sans mt-2 text-sm text-red-600"
          id={`${input.id}-error-message`}
        >
          {input.errormessage}
        </p>
      )}
    </div>
  );
};

export default DropDownWithSearch;
