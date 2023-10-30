import { useUser } from '@auth0/nextjs-auth0/client';
import { render, screen } from '@testing-library/react';

import { useAppSelector as useSelector } from '@/store/hooks';

import { User } from '@/lib/models/formStateModels';

import NavBar from '@/components/layout/NavBar/NavBar';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: jest.fn(),
}));

const mockUser: User = {
  user_metadata: {
    companyId: 'demo',
    accountSettings: {},
  },
};

describe('NavBar rendering', () => {
  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (useSelector as jest.Mock).mockReturnValue('/');
  });

  // test('finds breadcrumb navigation', () => {
  //   render(<NavBar />);
  //   const nav = screen.getByRole('navigation');
  //   expect(
  //     screen.getByRole('navigation', { name: 'breadcrumbs' })
  //   ).toBeInTheDocument();
  // });

  test('find all navbar headings', () => {
    render(<NavBar />);
    expect(screen.getByRole('link', { name: /^home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /vendors/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /invoices/i })).toBeInTheDocument();
  });

  // test('make sure breadcrumbs are rendered', () => {
  //   render(<NavBar />);
  //   const breadcrumbs = screen.getByRole('navigation');
  //   expect(breadcrumbs).toBeInTheDocument();
  // });
});

describe('testing active class assignment on navbar tabs', () => {
  const testCases = [
    {
      name: 'home-tab',
      path: '/',
      hasActiveClass: true,
    },
    {
      name: 'projects-tab',
      path: `/${mockUser.user_metadata.companyId}/projects`,
      hasActiveClass: true,
    },
    {
      name: 'invoices-tab',
      path: `/${mockUser.user_metadata.companyId}/invoices`,
      hasActiveClass: true,
    },
    {
      name: 'vendors-tab',
      path: `/${mockUser.user_metadata.companyId}/vendors`,
      hasActiveClass: true,
    },
  ];
  testCases.forEach((obj) => {
    test(`active class on the ${obj.name}`, () => {
      (useSelector as jest.Mock).mockReturnValue(obj.path);
      render(<NavBar />);
      const activeTab = screen.getByTestId(obj.name);
      const hasActiveClass = Array.from(activeTab.classList).some((className) =>
        className.includes('nav-item__active')
      );
      expect(hasActiveClass).toBe(obj.hasActiveClass);
    });
  });
});
