import { Fragment } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';

import { useAppSelector as useSelector } from '@/store/hooks';
import { User } from '@/lib/models/formStateModels';
import { formatFriendly } from '@/lib/utility/formatter';

import BreadcrumbArrow from '@/public/icons/BreadcrumbArrowSVG';

import classes from './BreadCrumbs.module.css';

function BreadCrumbs() {
  const activeClasses = 'font-semibold text-gray-700';
  const currentPath = useSelector((state) => {
    return state.path.currentPath;
  });
  const { user } = useUser();

  return (
    <div className={`flex flex-row ${classes['main']}`}>
      <Link href="/" aria-label="bread-home">
        <div
          className={`${classes['bread-item']} ${
            currentPath === '/' && activeClasses
          }`}
          data-testid="bread-home"
        >
          Home
        </div>
      </Link>
      {currentPath !== '/' &&
        currentPath
          .split(`/${(user as User).user_metadata.companyId}`)
          .toString()
          .split('/')
          .slice(1)
          .map((path, i, arr) => {
            const linkToPath =
              `/${(user as User).user_metadata.companyId}/` +
              arr.slice(0, i + 1).join('/');
            const activeClass = arr.length === i + 1 ? activeClasses : '';
            return (
              <Fragment key={Math.random()}>
                <BreadcrumbArrow width={null} height={null} />
                <Link href={linkToPath}>
                  <div
                    className={`${classes['bread-item']} ${activeClass}`}
                    data-testid={`bread-${arr.slice(0, i + 1).join('/')}`}
                  >
                    {formatFriendly(path)}
                  </div>
                </Link>
              </Fragment>
            );
          })}
    </div>
  );
}

export default BreadCrumbs;
