import { useEffect } from 'react';

import { useCurrentUser as useUser } from './use-user';
import { CHECK_INTERVAL, PRE_REFRESH_INTERVAL } from '@/lib/config';

/**
 * This custom hook refreshes the short lived access token whenever the
 * expiration of that token occurs. This uses rotating refresh tokens via Auth0.
 * @param inactivityTimeout
 */
const useAutoTokenRefresh = (inactivityTimeout: number) => {
  const { user, isLoading, error } = useUser();
  const isAuthenticated = user && !isLoading && !error;
  // Fetch token expiration time from the server-side

  // Handle inactivity
  useEffect(() => {
    if (isAuthenticated) {
      let lastActivity = Date.now();

      const checkInactivity = () => {
        if (Date.now() - lastActivity >= inactivityTimeout) {
          window.location.href = '/api/auth/logout';
        }
      };

      const handleActivity = () => {
        lastActivity = Date.now();
      };

      const inactivityInterval = setInterval(checkInactivity, CHECK_INTERVAL);

      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);

      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        clearInterval(inactivityInterval);
      };
    }
  }, [isAuthenticated, inactivityTimeout]);

  // Handle token expiration

  useEffect(() => {
    const checkTokenExpiration = () => {
      if (isAuthenticated) {
        fetch('/api/checkTokenExpiration')
          .then((response) => response.json())
          .then((data) => {
            if (data?.tokenExpiration) {
              const remainingTime = data.tokenExpiration - Date.now();
              if (remainingTime > PRE_REFRESH_INTERVAL) {
                setTimeout(() => {
                  fetch('/api/refresh-token').catch((error) => {
                    console.error('Error refreshing token:', error);
                    // window.location.href = '/api/auth/login';
                    window.location.href = process.env
                      .POST_LOGOUT_REDIRECT_URI as string;
                  });
                }, remainingTime - PRE_REFRESH_INTERVAL);
              } else {
                fetch('/api/refresh-token').catch((error) => {
                  console.error('Error refreshing token:', error);
                  // window.location.href = '/api/auth/login';
                  window.location.href = process.env
                    .POST_LOGOUT_REDIRECT_URI as string;
                });
              }
            } else {
              // window.location.href = 'http://localhost:3001';
              fetch('/api/refresh-token').catch((error) => {
                console.error('Error refreshing token:', error);
                // window.location.href = '/api/auth/login';
                window.location.href = process.env
                  .POST_LOGOUT_REDIRECT_URI as string;
              });
            }
          })
          .catch((error) => {
            console.error('Error fetching token expiration:', error);
          });
      }
    };

    checkTokenExpiration();

    const intervalId = setInterval(checkTokenExpiration, CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);
};

export default useAutoTokenRefresh;
