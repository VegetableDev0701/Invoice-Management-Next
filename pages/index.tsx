import React from 'react';
import { useCurrentUser as useUser } from '@/hooks/use-user';

import { useSetStatePath } from '@/hooks/use-setpath';

import MainDashboard from '@/components/Dashboards/Main/MainDashboard';

const Home = () => {
  useSetStatePath();
  return (
    <>
      <MainDashboard />
    </>
  );
};

export default React.memo(Home);
