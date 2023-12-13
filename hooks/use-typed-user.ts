// Custom useTypedUser hook
import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';
import { User } from '@/lib/models/formStateModels';

export function useTypedUser() {
  const { user: auth0User, ...rest } = useAuth0User();

  // Cast the auth0User object to the User type
  const user = auth0User as User | undefined;

  return { user, ...rest };
}
