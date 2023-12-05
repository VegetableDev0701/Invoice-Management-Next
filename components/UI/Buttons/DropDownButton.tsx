import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import ButtonWithLoader from './ButtonWithLoader';
import { DropDownButtonProp } from '@/lib/models/uiModels';
import { classNames } from '@/lib/utility/utils';

const DropDownButton = (props: DropDownButtonProp) => {
  const { label, className, onClick, items } = props;

  return (
    <Menu as="div" className="relative inline-block text-left z-50">
      <div>
        <Menu.Button>
          <ButtonWithLoader
            button={{
              label: label,
              className: classNames(
                className,
                'px-10 py-2 md:text-2xl font-normal bg-stak-dark-green 2xl:text-3xl'
              ),
              onClick,
            }}
          />
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
        <Menu.Items className="absolute right-0 w-44 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200">
          {items &&
            items.map((item, index) => (
              <Menu.Item key={index}>
                {() => (
                  <div
                    className={classNames(
                      item.className,
                      'block px-4 py-2 text-md cursor-pointer hover:bg-gray-100'
                    )}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </div>
                )}
              </Menu.Item>
            ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default DropDownButton;
