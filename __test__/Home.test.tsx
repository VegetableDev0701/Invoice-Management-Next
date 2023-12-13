import { useUser } from '@auth0/nextjs-auth0/client';
import { screen } from '@testing-library/react';
import { NextRouter } from 'next/router';

import { User } from '@/lib/models/formStateModels';
import { renderWithProviders } from '@/__test__/utils/test-utils';

import Home from '../pages/index';

jest.mock('next/router', () => ({
  useRouter() {
    const routerMock: Partial<NextRouter> = {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
    };
    return routerMock;
  },
}));

jest.mock('nanoid', () => ({
  customAlphabet: jest.fn().mockReturnValue(() => 'mocked_id'),
}));

jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: jest.fn(),
}));

const mockUser: User = {
  user_metadata: {
    companyId: 'demo',
    companyName: 'Demonstration',
    userUUID: '',
    accountSettings: {},
  },
};

const env = {
  node_env: process.env.NEXT_PUBLIC_STAK_NODE_ENV || '',
  dev_api_url: process.env.NEXT_PUBLIC_DEV_API_URL || '',
  staging_api_url: process.env.NEXT_PUBLIC_STAGING_API_URL || '',
  production_api_url: process.env.NEXT_PUBLIC_PRODUCTION_API_URL || '',
};

describe('Home', () => {
  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
  });

  test('succefully renders with redux', () => {
    renderWithProviders(<Home {...env} />);
  });

  test('finds all correct tile titles', () => {
    renderWithProviders(<Home {...env} />);
    const newInvoicesText = screen.getByText('Add New Invoices');
    const companyCashFlowText = screen.getByText('Company Cash Flow');
    const importantText = screen.getByText('Important');
    expect(newInvoicesText).toBeInTheDocument();
    expect(companyCashFlowText).toBeInTheDocument();
    expect(importantText).toBeInTheDocument();
  });
});
