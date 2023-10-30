import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';

import { User, UserMetadata } from '@/lib/models/formStateModels';

export function useCurrentUser() {
  const [currentUserData, setCurrentUserData] = useState<UserMetadata>(
    {} as UserMetadata
  );
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  const { user: auth0User, isLoading, ...rest } = useAuth0User();

  const user = auth0User as User | undefined;

  useEffect(() => {
    async function getCurrentUserData() {
      setIsLoadingUserData(true);
      try {
        const response = await fetch(
          `/api/${(user as User).user_metadata.companyId}/${
            (user as User).user_metadata.userUUID
          }/get-current-user-metadata`
        );
        if (!response.ok) {
          throw new Error(
            `Error in retrieving Auth0 User Data: ${response.headers}`
          );
        }
        const data = await response.json();
        setCurrentUserData(data);
      } catch (error: any) {
        console.error(error);
      }
      setIsLoadingUserData(false);
    }
    if (!isLoading) {
      getCurrentUserData();
    }
  }, [isLoading]);

  return {
    user: { ...user, ...currentUserData },
    isLoading,
    isLoadingUserData,
    ...rest,
  };
}
