import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';

import { User } from '@/lib/models/formStateModels';

import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import { UserMenu } from '@/components/layout/TopSideBorder/UserMenu';
import LogoSVG from '@/public/icons/LogoSVG';

import classes from '../TopSideBorder.module.css';

function TopBorder() {
  const scaleFactor = 0.8;

  const { user, isLoading: userLoading } = useUser();

  return (
    <>
      {userLoading && <FullScreenLoader />}
      {!userLoading && user && (
        <div className={classes['top']}>
          <div className={`${classes['icon']} ${classes['logo']}`}>
            <Link href="/">
              <LogoSVG width={null} height={null} scaler={scaleFactor} />
            </Link>
          </div>
          <h1>{(user as User).user_metadata.companyName}</h1>
          <div className={`${classes['icon']}`}>
            <UserMenu user={user as User} />
          </div>
        </div>
      )}
    </>
  );
}

export default TopBorder;
