import { screen } from '@testing-library/react';
import { useUser } from '@auth0/nextjs-auth0/client';

import { renderWithProviders } from '../utils/test-utils';
import { User } from '@/lib/models/formStateModels';
import { getAPIUrl } from '@/lib/config';

import TopBorder from '@/components/layout/TopSideBorder/TopBorder';

jest.mock('@/public/icons/LogoSVG', () => () => (
  <svg role="img" aria-label="company logo"></svg>
));
jest.mock('@/public/icons/AvatarSVG', () => () => (
  <svg role="img" aria-label="user avatar"></svg>
));
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: jest.fn(),
}));
jest.mock('@/lib/config', () => ({
  getAPIUrl: jest.fn(),
}));

const mockUser: User = {
  user_metadata: {
    companyId: 'demo',
    userUUID: '',
    companyName: 'Demonstration',
    accountSettings: {},
  },
};

describe('TopBorder', () => {
  beforeAll(() => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (getAPIUrl as jest.Mock).mockReturnValue('fake api url');
  });
  test('renders the company name', () => {
    renderWithProviders(<TopBorder />);
    const companyHeading = screen.getAllByRole('heading');
    const companyName = screen.getByText(mockUser.user_metadata.companyName);
    expect(companyHeading).toHaveLength(1);
    expect(companyName).toBeInTheDocument();
  });
  test('renders the company logo', () => {
    renderWithProviders(<TopBorder />);
    expect(
      screen.getByRole('img', { name: /company logo/i })
    ).toBeInTheDocument();
  });

  test('renders the user avatar', () => {
    renderWithProviders(<TopBorder />);
    expect(
      screen.getByRole('img', { name: /user avatar/i })
    ).toBeInTheDocument();
  });
});
