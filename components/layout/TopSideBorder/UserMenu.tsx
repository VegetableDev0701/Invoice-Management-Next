import Link from 'next/link';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  ChevronDownIcon,
  Cog8ToothIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/20/solid';

import { User } from '@/lib/models/formStateModels';
import Avatar from '@/public/icons/AvatarSVG';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface Props {
  user: User;
}

export function UserMenu(props: Props) {
  const { user } = props;
  return (
    <Menu as="div" className="relative inline-block text-left z-30">
      <div>
        <Menu.Button className="inline-flex z-30 w-full justify-center items-center rounded-md px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm">
          <ChevronDownIcon width={30} color="var(--main-border-item-color)" />
          <Avatar width={null} height={null} scaler={0.8} />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="flex flex-col flex-wrap min-w-full absolute right-0 w-64 mt-2 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="flex items-center justify-between px-4 py-3">
            <img
              className="inline-block h-12 w-12 rounded-full"
              src={user.picture as string}
              alt="user avatar icon"
            />
            <div>
              <p className="text-md">Signed in as</p>
              <p className="truncate text-md font-medium text-gray-900">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <div
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'flex flex-row justify-left items-center gap-4 py-2 pl-4 text-md'
                  )}
                >
                  <Cog8ToothIcon className="h-5 w-5" />
                  <Link
                    href={`/${user.user_metadata.companyId}/account-settings`}
                  >
                    Account settings
                  </Link>
                </div>
              )}
            </Menu.Item>
            {/* <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block px-4 py-2 text-sm'
                  )}
                >
                  Support
                </a>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block px-4 py-2 text-sm'
                  )}
                >
                  License
                </a>
              )}
            </Menu.Item> */}
          </div>
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <div
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'flex flex-row justify-left items-center gap-4 py-2 pl-4 text-md'
                  )}
                >
                  <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                  <a href="/api/auth/logout">Sign out</a>
                </div>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
