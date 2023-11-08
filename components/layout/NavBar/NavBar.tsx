import { useUser } from '@auth0/nextjs-auth0/client';

import { useAppSelector as useSelector } from '@/store/hooks';

import NavDropDown from './NavDropDown';
import BreadCrumbs from '@/components/BreadCrumbs/BreadCrumbs';

import classes from '../NavBar.module.css';
import { User } from '@/lib/models/formStateModels';
import ProcessingLoader from '@/components/UI/Loaders/ProcessingLoader';
import Button from '@/components/UI/Buttons/Button';

function NavBar() {
  const currentPath = useSelector((state) => {
    return state.path.currentPath;
  });

  const openProcessingNotification = useSelector(
    (state) => state.ui.processingNotification.openNotification
  );

  const { user } = useUser();
  return (
    <div className={`${classes['navbar']} fixed right-0 flex justify-between`}>
      <div className="flex gap-1 py-0 px-6 items-center">
        <NavDropDown
          path="/"
          name="Home"
          testId="home-tab"
          activeclass={`${
            currentPath === '/' ? classes['nav-item__active'] : ''
          }`}
        />
        <NavDropDown
          path={`/${(user as User).user_metadata.companyId}/projects`}
          name="Projects"
          testId="projects-tab"
          items={[
            {
              name: 'Add Project',
              menuPath: `/${
                (user as User).user_metadata.companyId
              }/projects/add-project`,
            },
          ]}
          activeclass={`${
            currentPath.startsWith(
              `/${(user as User).user_metadata.companyId}/projects`
            )
              ? classes['nav-item__active']
              : ''
          }`}
        />
        <NavDropDown
          path={`/${(user as User).user_metadata.companyId}/vendors`}
          name="Vendors"
          testId="vendors-tab"
          items={[
            {
              name: 'Add Vendor',
              menuPath: `/${
                (user as User).user_metadata.companyId
              }/vendors/add-vendor`,
            },
          ]}
          activeclass={`${
            currentPath.startsWith(
              `/${(user as User).user_metadata.companyId}/vendors`
            )
              ? classes['nav-item__active']
              : ''
          }`}
        />
        <NavDropDown
          path={`/${(user as User).user_metadata.companyId}/invoices`}
          name="Invoices"
          testId="invoices-tab"
          activeclass={`${
            currentPath.startsWith(
              `/${(user as User).user_metadata.companyId}/invoices`
            )
              ? classes['nav-item__active']
              : ''
          }`}
        />
      </div>
      {openProcessingNotification && (
        <div
          className="flex mt-2 mr-4 h-full"
          aria-label="processing_notification"
        >
          <ProcessingLoader size="1px" color="#313031" />
        </div>
      )}
    </div>
  );
}

export default NavBar;
