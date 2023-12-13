import { useUser } from '@auth0/nextjs-auth0/client';
import { render, screen } from '@testing-library/react';

import { useAppSelector as useSelector } from '@/store/hooks';

import { User } from '@/lib/models/formStateModels';

import BreadCrumbs from '@/components/BreadCrumbs/BreadCrumbs';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
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

describe('testing the breadcrumbs correctly render by path', () => {
  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
  });
  const testCases = [
    { name: ['Home'], testid: 'bread-home', path: '/', hasActiveClass: true },
    {
      name: ['Home', 'Projects'],
      testid: 'bread-projects',
      path: `/${mockUser.user_metadata.companyId}/projects`,
      hasActiveClass: true,
    },
    {
      name: ['Home', 'Projects', 'Add Project'],
      testid: 'bread-projects/add-project',
      path: `/${mockUser.user_metadata.companyId}/projects/add-project`,
      hasActiveClass: true,
    },
    {
      name: ['Home', 'Vendors'],
      testid: 'bread-vendors',
      path: `/${mockUser.user_metadata.companyId}/vendors`,
      hasActiveClass: true,
    },
    {
      name: ['Home', 'Vendors', 'Add Vendor'],
      testid: 'bread-vendors/add-vendor',
      path: `/${mockUser.user_metadata.companyId}/vendors/add-vendor`,
      hasActiveClass: true,
    },
    {
      name: ['Home', 'Invoices'],
      testid: 'bread-invoices',
      path: `/${mockUser.user_metadata.companyId}/invoices`,
      hasActiveClass: true,
    },
    {
      name: ['Home', 'Account Settings'],
      testid: 'bread-account-settings',
      path: `/${mockUser.user_metadata.companyId}/account-settings`,
      hasActiveClass: true,
    },
  ];
  testCases.forEach((obj) => {
    test(`correctly render ${obj.name} breadcrumbs`, () => {
      (useSelector as jest.Mock).mockReturnValue(obj.path);
      render(<BreadCrumbs />);
      const breadcrumbLinks = screen.getAllByRole('link');
      const activeDivElement = screen.getByTestId(obj.testid);
      const hasActiveClass = Array.from(activeDivElement.classList).some(
        (className) => className.includes('font-semibold')
      );

      expect(breadcrumbLinks).toHaveLength(obj.name.length);
      expect(hasActiveClass).toBe(obj.hasActiveClass);
    });
  });
});
