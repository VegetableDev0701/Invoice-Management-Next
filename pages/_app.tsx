import { Profiler } from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { Provider } from 'react-redux';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { PersistGate } from 'redux-persist/lib/integration/react';

import { store, persistor } from '@/store/index';

import Layout from '@/components/layout/Layout';
import AutoLogoutWrapper from '@/components/Utilities/AutoLogoutWrapper';
import InitialLoadWrapper from '@/components/Utilities/InitialLoadWrapper';

import '../styles/globals.css';
import NotificationWrapper from '@/components/UI/Notification/NotificationWrapper';
import ServerSentEvent from '@/components/Utilities/WebSocketWrapper';
import OnBoardNewUser from '@/components/Utilities/OnBoardUser/OnBoardNewUser';

const INACTIVITY_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours
// const INACTIVITY_TIMEOUT = 5000; // used for testing

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <UserProvider>
      <Provider store={store}>
        <OnBoardNewUser>
          <InitialLoadWrapper>
            <PersistGate loading={null} persistor={persistor}>
              <Layout>
                <Head>
                  <title>Stak</title>
                  <meta
                    name="description"
                    content="Stak Technologies, Inc. an Automated Invoicing Platform for Construction"
                  />
                  <meta
                    name="viewport"
                    content="initial-scale=1.0, width=device-width"
                  />
                </Head>
                <AutoLogoutWrapper timeout={INACTIVITY_TIMEOUT}>
                  <NotificationWrapper />
                  <ServerSentEvent />
                  <Component {...pageProps} />
                </AutoLogoutWrapper>

                {/* </Profiler> */}
              </Layout>
            </PersistGate>
          </InitialLoadWrapper>
        </OnBoardNewUser>
      </Provider>
    </UserProvider>
  );
};

export default App;
