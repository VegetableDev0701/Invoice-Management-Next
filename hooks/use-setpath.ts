import { pathActions } from '@/store/pathname-slice';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAppDispatch as useDispatch } from '@/store/hooks';

export function useSetStatePath() {
  const dispatch = useDispatch();
  const router = useRouter();
  const currentPath = router.asPath;
  useEffect(() => {
    dispatch(pathActions.setCurrentPath({ currentPath }));
  }, []);
}
