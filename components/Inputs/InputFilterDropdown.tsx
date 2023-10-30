import { Fragment, useEffect, useMemo, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';

import { Items, SelectMenuOptions } from '@/lib/models/formDataModel';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { sortArrayById, sortArrayByObjKey } from '@/lib/utility/tableHelpers';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface ExtendedItems extends Partial<Items> {
  sortBy: 'label' | 'id';
  forceToTopKey?: string;
}

interface Props {
  input: ExtendedItems;
  sortBy: 'label' | 'id';
  className?: string;
  onFilterSupervisor?: (selected: string) => void;
}

interface Selected {
  label: string;
}

const FilterDropdown = (props: Props) => {
  const { input, sortBy, onFilterSupervisor } = props;

  const [selected, setSelected] = useState<Selected>({ label: 'No Filter' });
  const [sortedMenuOptions, setSortedMenuOptions] = useState(
    input.selectMenuOptions
  );

  useEffect(() => {
    if (onFilterSupervisor) {
      onFilterSupervisor(selected.label);
    }
  }, [selected]);

  useMemo(() => {
    if (sortBy === 'label') {
      const sortedSelectMenu = sortArrayByObjKey(
        input.selectMenuOptions as SelectMenuOptions[],
        'label',
        input?.forceToTopKey || 'No Filter'
      );
      setSortedMenuOptions(sortedSelectMenu);
    } else if (sortBy === 'id') {
      const sortedSelectMenu = sortArrayById(
        input.selectMenuOptions as SelectMenuOptions[]
      );
      setSortedMenuOptions(sortedSelectMenu);
    }
  }, [input.selectMenuOptions]);

  return (
    <div className="flex flex-col justify-center p-0 gap-0 max-w-full">
      <Listbox value={selected} onChange={setSelected}>
        {({ open }) => (
          <>
            <Listbox.Label className="-mt-5 pb-1 left-2 inline-block bg-stak-main-bg px-1 text-base text-left font-sans font-medium text-gray-700">
              {input.label}
            </Listbox.Label>
            <div className="flex flex-row items-end gap-4 -mt-2">
              <div className="grow relative mt-1">
                <Listbox.Button
                  id={input.id}
                  className={`font-sans w-full border-2 h-8 border-gray-500 rounded-md cursor-default py-0 pl-2 pr-10 text-left focus:border-stak-dark-green focus:shadow-xl focus-visible:border-stak-dark-green focus-visible:outline-stak-dark-green focus-visible:outline-0 sm:text-sm`}
                >
                  <span className="flex truncate -mb-1 text-xl">
                    {selected.label}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto drop-shadow-xl border-stak-light-gray rounded-md bg-white py-1 text-base text-left shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {sortedMenuOptions &&
                      (sortedMenuOptions as SelectMenuOptions[]).map(
                        (option) => (
                          <Listbox.Option
                            key={option.id}
                            className={({ active }) =>
                              classNames(
                                'font-sans text-base relative cursor-default select-none py-2 pl-3 pr-9',
                                active
                                  ? 'bg-stak-dark-green text-white'
                                  : 'text-stak-dark-gray'
                              )
                            }
                            value={option}
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={classNames(
                                    selected ? 'font-semibold' : 'font-normal',
                                    'block truncate'
                                  )}
                                >
                                  {option.label}
                                </span>

                                {selected ? (
                                  <span
                                    className={classNames(
                                      active
                                        ? 'text-white'
                                        : 'text-stak-dark-green',
                                      'absolute inset-y-0 right-0 flex items-center pr-4'
                                    )}
                                  >
                                    <CheckIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        )
                      )}
                  </Listbox.Options>
                </Transition>
              </div>
            </div>
          </>
        )}
      </Listbox>
    </div>
  );
};

export default FilterDropdown;
