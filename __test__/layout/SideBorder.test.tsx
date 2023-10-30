import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';

import SideBorder from '@/components/layout/TopSideBorder/SideBorder';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/public/icons/BackArrowSVG', () => () => (
  <svg role="img" aria-label="back arrow"></svg>
));
jest.mock('@/public/icons/HelpSVG', () => () => (
  <svg role="img" aria-label="help icon"></svg>
));

describe('SideBorder', () => {
  test('renders the back arrow', () => {
    (useRouter as jest.Mock).mockReturnValueOnce({ back: jest.fn() });
    render(<SideBorder />);
    expect(
      screen.getByRole('img', { name: /back arrow/i })
    ).toBeInTheDocument();
  });

  test('renders the help icon', () => {
    render(<SideBorder />);
    expect(screen.getByRole('img', { name: /help icon/i })).toBeInTheDocument();
  });

  test('calls router.back() when back arrow is clicked', () => {
    const mockRouter = { back: jest.fn() };
    (useRouter as jest.Mock).mockReturnValueOnce(mockRouter);
    render(<SideBorder />);
    const backArrow = screen.getByRole('img', { name: /back arrow/i });
    fireEvent.click(backArrow);
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
