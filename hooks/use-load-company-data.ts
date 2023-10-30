import { useEffect } from 'react';

import { fetchCompanyData } from '@/store/company-data-slice';
import { userActions } from '@/store/user-slice';
import { useAppDispatch as useDispatch } from '@/store/hooks';
import { User } from '@/lib/models/formStateModels';
import { useCurrentUser as useUser } from './use-user';
import { fetchProjectData } from '@/store/projects-data-slice';

let initialLoad = true;

const useInitLoadData = () => {
  const { user, isLoading: userLoading } = useUser();
  const dispatch = useDispatch();

  useEffect(() => {
    if (userLoading === true) return;
    // only load the company data on the first load, i.e. a page refresh or login
    if (initialLoad) {
      dispatch(userActions.setUserState(user as User));
      dispatch(
        fetchCompanyData({ companyId: (user as User).user_metadata.companyId })
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
