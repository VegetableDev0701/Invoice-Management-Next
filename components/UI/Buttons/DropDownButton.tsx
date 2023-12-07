import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import ButtonWithLoader from './ButtonWithLoader';
import { DropDownButtonProp } from '@/lib/models/uiModels';
import { classNames } from '@/lib/utility/utils';
import ArrowSVG from '@/public/icons/ArrowSVG';

interface Props {
  dropDownButton: DropDownButtonProp;
  taskId?: string;
}

const DropDownButton = ({ dropDownButton, taskId }: Props) => {
  const { label, className, onClick, items } = dropDownButton;

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <Menu.Button>
            <ButtonWithLoader
              button={{
                label: label,
                className: classNames(
                  className,
                  'flex items-center pl-10 pr-6 py-2 md:text-2xl font-normal bg-stak-dark-green 2xl:text-3xl'
                ),
                onClick,
              }}
              taskId={taskId}
            >
              <ArrowSVG
                color="white"
                width={30}
                height={30}
                className={`transition-transform duration-300 ml-3 ${
                  open ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </ButtonWithLoader>
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 w-44 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 z-50">
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
        </>
      )}
    </Menu>
  );
};

export default DropDownButton;
