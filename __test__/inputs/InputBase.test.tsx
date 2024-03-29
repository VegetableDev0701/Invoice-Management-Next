import { screen } from '@testing-library/react';

import { renderWithProviders } from '../utils/test-utils';
import { Actions } from '@/lib/models/types';

import InputBase, { Props } from '@/components/Inputs/InputBaseWithValidation';
import { getAPIUrl } from '@/lib/config';

jest.mock('@heroicons/react/20/solid', () => ({
  ExclamationCircleIcon: () => <svg role="img" aria-hidden="true" />,
}));
jest.mock('@/lib/config', () => ({
  getAPIUrl: jest.fn(),
}));

const props: Props = {
  input: {
    label: 'Test Label',
    value: '',
    id: 'test-label',
    required: false,
  },
  actions: jest.fn() as unknown as Actions,
  form: 'addProject',
  showError: false,
};

const errorProps: Props = {
  input: {
    label: 'Project Name',
    value: '',
    id: 'project-name',
    required: true,
    errormessage: 'test error message',
  },
  actions: jest.fn() as unknown as Actions,
  form: 'addProject',
  showError: true,
};

jest.mock('@/hooks/use-inputChangeHandler', () => {
  return () => {
    const inputValue = '';
    const changeHandler = jest.fn();
    const blurHandler = jest.fn();

    return [inputValue, changeHandler, blurHandler];
  };
});

describe('test this input component`s functions', () => {
  beforeEach(() => {
    (getAPIUrl as jest.Mock).mockReturnValue('fake api url');
  });
  // This test throws an error, something about calling this custom hook...not sure why???
  // test('test if an error is called with getInputState', () => {
  //   console.error = jest.fn();
  //   renderWithProviders(<InputBase props={props.props} />);
  //   useGetInputState('test-label', 'addProject');
  //   expect(console.error).toHaveBeenCalled();
  // });

  test('test if input box is rendered', () => {
    renderWithProviders(
      <InputBase
        input={props.input}
        actions={props.actions}
        form={props.form}
        showError={props.showError}
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  test('test if error is shown', () => {
    renderWithProviders(
      <InputBase
        input={errorProps.input}
        actions={errorProps.actions}
        form={errorProps.form}
        showError={errorProps.showError}
      />
    );
    const input = screen.getByRole('textbox');
    const errorText = screen.getByText('test error message');
    const hasErrorClass = Array.from(input.classList).some((cls) =>
      cls.includes('text-red-500')
    );
    const errorIconDiv = screen.getByTestId('error-icon-div');

    expect(hasErrorClass).toBe(true);
    expect(errorText).toBeInTheDocument();
    expect(errorIconDiv).toBeInTheDocument();
  });
});
