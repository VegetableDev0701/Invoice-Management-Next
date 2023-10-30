import { screen } from '@testing-library/react';
import { useUser } from '@auth0/nextjs-auth0/client';

import accountSettingsFormData from '../data/account-settings.json';
import { renderWithProviders } from '../utils/test-utils';
import { createFormStateData } from '../utils/test-helpers';

import { Actions } from '@/lib/models/types';
import { MainCategories } from '@/lib/models/formDataModel';

import Form, {
  Props as FormProps,
} from '@/components/Forms/InputFormLayout/Form';
import { User } from '@/lib/models/formStateModels';

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

jest.mock('../../components/Utilities/AgaveLinkComponent.tsx', () => {
  return () => <>AgaveLinkComponent</>;
});

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
const { totalNumInputs: accountSettingsTotalInputs } = createFormStateData(
  accountSettingsFormData as EmptyAddProjectForm,
  true,
  false
);

describe('test if the account settings form is completely rendered', () => {
  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
  });
  test('test full rendering of all inputs', () => {
    renderWithProviders(
      <Form
        {...{
          ...props,
          form: 'accountSettings',
          formData: accountSettingsFormData as EmptyAddProjectForm,
        }}
      />
    );
    const allTextInputs = screen.queryAllByRole('textbox');
    const allButtons = screen.queryAllByRole('button');

    const allInputsLength = allTextInputs.length + allButtons.length;
    // There is a `edit format` button which we do not want to count as
    // an input element and the dropdown input elements are also buttons so
    // subtract one from the total
    expect(allInputsLength - 1).toBe(accountSettingsTotalInputs);
  });
});
