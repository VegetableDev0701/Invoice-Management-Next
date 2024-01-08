import { useEffect } from 'react';

import { Items, SelectMenuOptions } from '@/lib/models/formDataModel';
import { Actions } from '@/lib/models/types';
import { ChangeOrderSummary } from '@/lib/models/summaryDataModel';

import InputBaseWithValidation from './InputBaseWithValidation';
import DropDownWithSearch from './InputDropDownWithSearch';
import Dropdown from './InputDropDown';
import SlideToggle from './InputSlideToggle';
import InputToggleOnOff from './InputToggleOnOff';

interface Props {
  input: Items;
  classes: string;
  actions: Actions;
  form: string;
  autofocus?: boolean;
  showError?: boolean;
  icon?: JSX.Element;
  changeOrdersSummary?: ChangeOrderSummary;
  vendorDropDownData?: SelectMenuOptions[];
  projectId?: string;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
}

export const Input = (props: Props) => {
  const {
    input,
    classes,
    showError,
    actions,
    form,
    changeOrdersSummary,
    icon,
    autofocus,
    projectId,
    vendorDropDownData,
    onFocus,
    onBlur,
    onMouseEnter,
    onMouseLeave,
  } = props;
  // disable the wheel scrolling effect and remove arrows from number input fields
  useEffect(() => {
    // Get the number input element
    const numberInputs = document.querySelectorAll('input[type="number"]');
    const preventDefault = (e: WheelEvent) => e.preventDefault();

    // Disable the up and down arrows on the number input field
    numberInputs.forEach((input) => {
      (input as unknown as HTMLElement).addEventListener(
        'wheel',
        preventDefault,
        { passive: false }
      );
    });

    return () => {
      numberInputs.forEach((input) => {
        (input as unknown as HTMLElement).removeEventListener(
          'wheel',
          preventDefault
        );
      });
    };
  }, []);

  let inputField;
  switch (true) {
    case input.inputType === 'dropdownWithSearch':
      inputField = (
        <DropDownWithSearch
          input={input}
          classes={classes}
          showError={showError}
          actions={actions}
          form={form}
          vendorDropDownData={vendorDropDownData}
          changeOrdersSummary={changeOrdersSummary}
          onFocus={onFocus}
          onBlur={onBlur}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      );
      break;
    case input.inputType === 'dropdown':
      inputField = (
        <Dropdown
          input={input}
          classes={classes}
          showError={showError}
          actions={actions}
          form={form}
        />
      );
      break;
    case input.inputType === 'slideToggle':
      inputField = <SlideToggle input={input} actions={actions} form={form} />;
      break;
    case input.inputType === 'toggleInput':
      inputField = (
        <InputToggleOnOff
          input={input}
          classes={classes}
          showError={showError}
          actions={actions}
          form={form}
          icon={icon}
        />
      );
      break;
    default:
      inputField = (
        <InputBaseWithValidation
          input={input}
          classes={classes}
          showError={showError}
          actions={actions}
          form={form}
          icon={icon}
          autofocus={autofocus}
          projectId={projectId}
          vendorDropDownData={vendorDropDownData}
          onFocus={onFocus}
          onBlur={onBlur}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      );
  }

  return <>{inputField}</>;
};
