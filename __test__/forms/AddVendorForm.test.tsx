import { screen } from '@testing-library/react';
import { useUser } from '@auth0/nextjs-auth0/client';

import addVendorFormData from '../data/add-vendor.json';
import { renderWithProviders } from '../utils/test-utils';
import { createFormStateData } from '../utils/test-helpers';

import { Actions } from '@/lib/models/types';
import { MainCategories } from '@/lib/models/formDataModel';
import { FormState, User } from '@/lib/models/formStateModels';

import Form, {
  Props as FormProps,
} from '@/components/Forms/InputFormLayout/Form';

jest.mock('@heroicons/react/20/solid', () => ({
  ChevronUpDownIcon: () => (
    <svg className="h-5 w-5 text-gray-400" aria-hidden="true" />
  ),
}));
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: jest.fn(),
}));

global.fetch = jest.fn((): any => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}) as Promise<Response>,
  });
});

jest.mock('@heroicons/react/20/solid', () => ({
  ExclamationCircleIcon: () => <svg role="img" aria-hidden="true" />,
  ChevronUpDownIcon: () => <svg role="img" aria-hidden="true" />,
}));

const mockDispatch = jest.fn();
jest.mock('@/store/hooks', () => ({
  ...jest.requireActual('@/store/hooks'),
  useAppDispatch: () => mockDispatch,
}));

export interface EmptyAddProjectForm {
  mainCategories: MainCategories[];
  numRecurringFees: number;
}

const mockUser: User = {
  user_metadata: {
    companyId: 'demo',
    companyName: 'Demonstration',
    userUUID: '',
    accountSettings: {},
  },
};

const props: FormProps = {
  clickedLink: '',
  anchorScrollElement: '',
  formData: {} as EmptyAddProjectForm,
  formState: {},
  actions: { setFormElement: jest.fn() } as unknown as Actions,
  form: '',
  showError: false,
  dummyForceRender: true,
};

// create mock formstate data for validation test
const {
  formState: addVendorFormState,
  numRequired: addVendorNumRequired,
  totalNumInputs: addVendorTotalInputs,
} = createFormStateData(addVendorFormData as EmptyAddProjectForm, true, false);

describe('test if the add vendor form is completely rendered', () => {
  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
  });
  test('test full rendering of all inputs', () => {
    renderWithProviders(
      <Form
        {...{
          ...props,
          form: 'addVendor',
          formData: addVendorFormData as EmptyAddProjectForm,
        }}
      />
    );
    const allTextInputs = screen.queryAllByRole('textbox');
    const allNumberInputs = screen.queryAllByRole('spinbutton');
    const allButtons = screen.queryAllByRole('button');
    const allDateInputs = screen.getAllByTestId('date-input');
    const slideToggleInputs = screen.getAllByRole('switch');

    const allInputsLength =
      allTextInputs.length +
      allNumberInputs.length +
      allButtons.length +
      allDateInputs.length +
      slideToggleInputs.length;

    expect(allInputsLength).toBe(addVendorTotalInputs);
  });

  test('check for validation input classes on all required inputs', () => {
    renderWithProviders(
      <Form
        {...{
          ...props,
          form: 'addVendor',
          formData: addVendorFormData as EmptyAddProjectForm,
          formState: addVendorFormState as FormState,
          showError: true,
        }}
      />
    );
    let numberValidationClass: number = 0;
    const allTextInputs = screen.getAllByRole('textbox');
    const allDateInputs = screen.getAllByTestId('date-input');
    const allButtons = screen.getAllByRole('button');
    const allNumberInputs = screen.queryAllByRole('spinbutton');
    const allInputs = [
      ...allTextInputs,
      ...allDateInputs,
      ...allButtons,
      ...allNumberInputs,
    ];
    allInputs.forEach((inputEl) => {
      if (
        Array.from(inputEl.classList).some((cls) => {
          return cls.includes('border-red-500');
        })
      ) {
        numberValidationClass++;
      }
    });
    expect(numberValidationClass).toBe(addVendorNumRequired);
  });
});
