import { screen } from '@testing-library/react';
import { useUser } from '@auth0/nextjs-auth0/client';

import addProjectFormData from '../data/add-project.json';
import { renderWithProviders } from '../utils/test-utils';
import { createFormStateData } from '../utils/test-helpers';

import { FormState, User } from '@/lib/models/formStateModels';
import { Actions, AddProjectActions } from '@/lib/models/types';
import { MainCategories } from '@/lib/models/formDataModel';

import Form, {
  Props as FormProps,
} from '@/components/Forms/InputFormLayout/Form';
// import RecurringFees, {
//   Props as RecurringFeesProps,
// } from '@/components/Forms/InputFormLayout/RecurringFees';

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
  formState: addProjectFormState,
  numRequired: addProjectNumRequired,
  totalNumInputs: addProjectTotalInputs,
} = createFormStateData(addProjectFormData as EmptyAddProjectForm, true, false);

// const recurringFeesProps: RecurringFeesProps = {
//   form: 'addProject',
//   actions: { setRecurringFee: jest.fn() } as unknown as AddProjectActions,
//   formData: addProjectFormData as EmptyAddProjectForm,
// };

describe('test if the add project form is completely rendered', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
  });
  test('render form component', async () => {
    renderWithProviders(
      <Form
        {...{
          ...props,
          form: 'addProject',
          formData: addProjectFormData as EmptyAddProjectForm,
        }}
      />
    );
    const allInputs = screen.getAllByRole('textbox');
    const allButtons = screen.getAllByRole('button');
    const allNumberInputs = screen.getAllByRole('spinbutton');
    const allDateInputs = screen.getAllByTestId('date-input');
    const allInputLengths =
      allInputs.length +
      allButtons.length +
      allNumberInputs.length +
      allDateInputs.length;
    expect(allInputLengths).toBe(addProjectTotalInputs);
  });

  // no longer have recurring fees in this form
  // test('recurring fees renders correctly with no input elements', () => {
  //   // renderWithProviders(<RecurringFees {...recurringFeesProps} />);
  //   const allInputs = screen.queryAllByRole('textbox');
  //   const allButtons = screen.queryAllByRole('button');
  //   const allInputLengths = allInputs.length + allButtons.length;
  //   expect(allInputLengths).toBe(1);
  // });

  test('check for validation input classes on all required inputs', () => {
    renderWithProviders(
      <Form
        {...{
          ...props,
          form: 'addProject',
          formData: addProjectFormData as EmptyAddProjectForm,
          formState: addProjectFormState as FormState,
          showError: true,
        }}
      />
    );
    let numberValidationClass: number = 0;
    const allTextInputs = screen.getAllByRole('textbox');
    const allCombobox = screen.getAllByRole('combobox');
    const allButtons = screen.getAllByRole('button');
    const allNumberInputs = screen.getAllByRole('spinbutton');
    const allDateInputs = screen.getAllByTestId('date-input');
    const allInputs = [
      ...allTextInputs,
      ...allCombobox,
      ...allButtons,
      ...allNumberInputs,
      ...allDateInputs,
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
    expect(numberValidationClass).toBe(addProjectNumRequired);
  });
});
