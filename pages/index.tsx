import React from 'react';

import { useAppDispatch as useDispatch } from '@/store/hooks';
import { nodeEnvActions } from '@/store/node-env-slice';

import { useSetStatePath } from '@/hooks/use-setpath';

import MainDashboard from '@/components/Dashboards/Main/MainDashboard';
import { NodeEnv } from '@/lib/models/envModel';

const Home = (props: NodeEnv) => {
  const dispatch = useDispatch();
  dispatch(nodeEnvActions.setNodeEnvVariables(props));
  useSetStatePath();
  return (
    <>
      <MainDashboard />
    </>
  );
};

export default React.memo(Home);

export async function getServerSideProps() {
  const node_env = process.env.NEXT_PUBLIC_STAK_NODE_ENV || '';
  const dev_api_url = process.env.NEXT_PUBLIC_DEV_API_URL || '';
  const staging_api_url = process.env.NEXT_PUBLIC_STAGING_API_URL || '';
  const production_api_url = process.env.NEXT_PUBLIC_PRODUCTION_API_URL || '';

  return {
    props: {
      node_env,
      dev_api_url,
      staging_api_url,
      production_api_url,
    },
  };
}
