import { useEffect } from 'react';
import localforage from 'localforage';

import { fetchCompanyData } from '@/store/company-data-slice';
import { userActions } from '@/store/user-slice';
import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { persistor } from '@/store';
import { fetchProjectData } from '@/store/projects-data-slice';

import { useCurrentUser as useUser } from './use-user';

import { User } from '@/lib/models/formStateModels';
import { RESET_STATE } from '@/lib/globals';

let initialLoad = true;

const useInitLoadData = () => {
  const { user, isLoading: userLoading } = useUser();
  const dispatch = useDispatch();

  const currentCompanyId = useSelector(
    (state) => state.user?.user_metadata?.companyId
  );

  useEffect(() => {
    if (userLoading === true || !user.user_metadata) return;
    // only load the company data on the first load, i.e. a page refresh or login
    if (initialLoad) {
      // check if the new user signed in is from a different company
      // and purge the state if they are
      if (
        currentCompanyId &&
        currentCompanyId !== user.user_metadata.companyId
      ) {
        dispatch({ type: RESET_STATE });
        persistor.purge().then(() => {
          localforage.clear().then(() => {
            console.log('done clearing state');
          });
        });
      }
      dispatch(userActions.setUserState(user as User));
      dispatch(
        fetchCompanyData({
          companyId: (user as User).user_metadata.companyId,
        })
      )
        .then(() => {
          dispatch(
            fetchProjectData({
              companyId: (user as User).user_metadata.companyId,
            })
          );
        })
        .catch((error) => {
          console.error(error);
        });

      initialLoad = false;
    }
  }, [user, userLoading, initialLoad, dispatch]);

  return { user, userLoading };
};

export default useInitLoadData;
