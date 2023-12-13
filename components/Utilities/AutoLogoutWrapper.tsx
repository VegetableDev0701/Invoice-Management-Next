import useAutoTokenRefresh from '@/hooks/use-auto-logout';
import React from 'react';

interface Props {
  timeout: number;
  children: React.ReactNode;
}

const AutoLogoutWrapper = ({ children, timeout }: Props) => {
  useAutoTokenRefresh(timeout);
  return <>{children}</>;
};

export default AutoLogoutWrapper;
