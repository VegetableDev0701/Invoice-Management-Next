import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ActionCreatorWithoutPayload, AsyncThunk } from '@reduxjs/toolkit';

import { useAppDispatch as useDispatch } from '@/store/hooks';

type ThunkOrAction = AsyncThunk<any, any, any> | ActionCreatorWithoutPayload;

const useLocationChange = (onRouteChangeAction: ThunkOrAction) => {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const oldPath = router.asPath.split(/[?#]/)[0];
      const newPath = url.split(/[?#]/)[0];

      if (oldPath !== newPath) {
        if ('pending' in onRouteChangeAction) {
          dispatch(onRouteChangeAction(undefined));
        } else {
          dispatch(onRouteChangeAction());
        }
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [dispatch, router]);
};

export default useLocationChange;
